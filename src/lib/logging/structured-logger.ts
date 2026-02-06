import winston from "winston";
import { AsyncLocalStorage } from "async_hooks";
import { appConfig } from "@/config/app.config";

const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class StructuredLogger {
  private logger: winston.Logger;

  constructor() {
    const { combine, timestamp, json, printf, colorize, errors } =
      winston.format;

    const customFormat = printf(
      ({ level, message, timestamp, correlationId, ...meta }) => {
        const base = {
          timestamp,
          level,
          message,
          correlationId: correlationId || this.getCorrelationId(),
          ...meta,
        };

        if (appConfig.isDevelopment) {
          return `${timestamp} [${level}] ${correlationId || "no-correlation"} ${message} ${JSON.stringify(meta)}`;
        }

        return JSON.stringify(base);
      },
    );

    this.logger = winston.createLogger({
      level: appConfig.logging.level,
      format: combine(
        errors({ stack: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        customFormat,
      ),
      transports: [
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          maxsize: 10485760,
          maxFiles: 10,
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
          maxsize: 10485760,
          maxFiles: 10,
        }),
      ],
    });

    if (appConfig.isDevelopment) {
      this.logger.add(
        new winston.transports.Console({
          format: combine(
            colorize(),
            timestamp({ format: "HH:mm:ss" }),
            customFormat,
          ),
        }),
      );
    }
  }

  private getContext(): LogContext {
    const store = asyncLocalStorage.getStore();
    return store ? Object.fromEntries(store.entries()) : {};
  }

  private getCorrelationId(): string | undefined {
    return this.getContext().correlationId;
  }

  private mergeContext(meta: any): any {
    const context = this.getContext();
    return { ...context, ...meta };
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, this.mergeContext(meta));
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, this.mergeContext(meta));
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, this.mergeContext(meta));
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, this.mergeContext(meta));
  }

  http(message: string, meta?: any): void {
    this.logger.http(message, this.mergeContext(meta));
  }

  setContext(context: LogContext): void {
    const store = asyncLocalStorage.getStore();
    if (store) {
      Object.entries(context).forEach(([key, value]) => {
        store.set(key, value);
      });
    }
  }

  runWithContext<T>(context: LogContext, fn: () => T): T {
    const store = new Map(Object.entries(context));
    return asyncLocalStorage.run(store, fn);
  }

  async runWithContextAsync<T>(
    context: LogContext,
    fn: () => Promise<T>,
  ): Promise<T> {
    const store = new Map(Object.entries(context));
    return asyncLocalStorage.run(store, fn);
  }

  generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

export const structuredLogger = new StructuredLogger();
