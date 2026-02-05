import mysql from "mysql2/promise";
import { appConfig } from "@/config/app.config";

class Database {
  private static instance: Database;
  private pool: mysql.Pool | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
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
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        timezone: "+00:00",
        multipleStatements: false,
        namedPlaceholders: false,
      });

      (this.pool as any).on("error", (err: any) => {
        console.error("Database pool error:", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          this.reconnect();
        }
      });
    }

    return this.pool;
  }

  private reconnect(): void {
    if (this.pool) {
      this.pool.end().catch(console.error);
      this.pool = null;
    }
    this.getPool();
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T> {
    try {
      const pool = this.getPool();
      const [rows] = await pool.execute(sql, params);
      return rows as T;
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  }

  public async queryOne<T = any>(
    sql: string,
    params?: any[],
  ): Promise<T | null> {
    const rows = await this.query<T[]>(sql, params);
    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as T) : null;
  }

  public async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.getPool().getConnection();
    await connection.beginTransaction();
    try {
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
      console.error("Database health check failed:", error);
      return false;
    }
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

export default db;
