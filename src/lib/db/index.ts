import mysql from "mysql2/promise";
import { appConfig } from "@/config/app.config";
import { EventEmitter } from "events";

interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  queuedRequests: number;
}

class Database extends EventEmitter {
  private static instance: Database;
  private pool: mysql.Pool | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  private constructor() {
    super();
    this.setupSignalHandlers();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private setupSignalHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      console.log(`[DB] Received ${signal}, closing connections...`);

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      await this.close();
      process.exit(0);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }

  public getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: appConfig.database.host,
        port: appConfig.database.port,
        user: appConfig.database.user,
        password: appConfig.database.password,
        database: appConfig.database.database,
        waitForConnections: true,
        connectionLimit: 20,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 100,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        timezone: "+00:00",
        multipleStatements: false,
        namedPlaceholders: false,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        charset: "utf8mb4",
      });

      this.setupPoolEventHandlers();
      this.startHealthCheck();
    }

    return this.pool;
  }

  private setupPoolEventHandlers(): void {
    if (!this.pool) return;

    this.pool.on("acquire", () => {
      this.emit("acquire");
    });

    this.pool.on("release", () => {
      this.emit("release");
    });

    this.pool.on("enqueue", () => {
      this.emit("enqueue");
    });

    this.pool.on("connection", () => {
      this.reconnectAttempts = 0;
    });
  }

  private async reconnect(): Promise<void> {
    if (
      this.isShuttingDown ||
      this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS
    ) {
      console.error("[DB] Max reconnection attempts reached");
      process.exit(1);
    }

    this.reconnectAttempts++;
    console.log(
      `[DB] Reconnection attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`,
    );

    if (this.pool) {
      await this.pool.end().catch(console.error);
      this.pool = null;
    }

    await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_DELAY));
    this.getPool();
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.query("SELECT 1");
      } catch (error) {
        console.error("[DB] Health check failed:", error);
        await this.reconnect();
      }
    }, 30000);
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const pool = this.getPool();
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(sql, params);
      return rows as T;
    } finally {
      connection.release();
    }
  }

  public async queryOne<T = any>(
    sql: string,
    params?: any[],
  ): Promise<T | null> {
    const rows = await this.query<T[]>(sql, params);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  public async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.getPool().getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("[DB] Health check failed:", error);
      return false;
    }
  }

  public getMetrics(): PoolMetrics {
    if (!this.pool) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        queuedRequests: 0,
      };
    }

    const poolConfig = this.pool.pool.config;
    const poolState = this.pool.pool;

    return {
      totalConnections: poolConfig.connectionLimit,
      activeConnections: (poolState as any)._allConnections?.length || 0,
      idleConnections: (poolState as any)._freeConnections?.length || 0,
      queuedRequests: (poolState as any)._connectionQueue?.length || 0,
    };
  }
}

const db = Database.getInstance();

export const query = <T = any>(sql: string, params?: any[]): Promise<T> =>
  db.query<T>(sql, params);

export const queryOne = <T = any>(
  sql: string,
  params?: any[],
): Promise<T | null> => db.queryOne<T>(sql, params);

export const transaction = <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> => db.transaction(callback);

export const closeDatabase = (): Promise<void> => db.close();

export const healthCheck = (): Promise<boolean> => db.healthCheck();

export const getMetrics = (): PoolMetrics => db.getMetrics();

export default db;
