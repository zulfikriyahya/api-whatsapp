import { logger } from "@/lib/services/logger.service";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: any,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      isOperational: this.isOperational,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND", { resource, identifier });
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", resetAt?: Date) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { resetAt });
    this.name = "RateLimitError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, "CONFLICT", details);
    this.name = "ConflictError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      500,
      "DATABASE_ERROR",
      { originalError: originalError?.message },
      false,
    );
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(
      `External service '${service}' error: ${message}`,
      503,
      "EXTERNAL_SERVICE_ERROR",
      { service, originalError: originalError?.message },
      false,
    );
    this.name = "ExternalServiceError";
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      504,
      "TIMEOUT_ERROR",
      { operation, timeoutMs },
    );
    this.name = "TimeoutError";
  }
}

export function handleError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error(error.message, {
        stack: error.stack,
        context,
        code: error.code,
        details: error.details,
      });
    } else {
      logger.warn(error.message, {
        context,
        code: error.code,
        details: error.details,
      });
    }
    return error;
  }

  if (error instanceof Error) {
    logger.error(error.message, {
      stack: error.stack,
      context,
      name: error.name,
    });

    if (error.message.includes("ECONNREFUSED")) {
      return new ExternalServiceError("database", "Connection refused", error);
    }

    if (error.message.includes("timeout")) {
      return new TimeoutError(context || "unknown", 30000);
    }

    return new AppError(error.message, 500, "INTERNAL_ERROR", undefined, false);
  }

  const unknownError = new AppError(
    "An unknown error occurred",
    500,
    "UNKNOWN_ERROR",
    { error: String(error) },
    false,
  );

  logger.error(unknownError.message, {
    context,
    error: String(error),
  });

  return unknownError;
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {
    this.setupUncaughtHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupUncaughtHandlers(): void {
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", {
        error: error.message,
        stack: error.stack,
      });

      if (!isOperationalError(error)) {
        console.error("Non-operational error detected. Shutting down...");
        process.exit(1);
      }
    });

    process.on("unhandledRejection", (reason: any) => {
      logger.error("Unhandled Rejection:", {
        reason: reason?.message || String(reason),
        stack: reason?.stack,
      });

      if (reason instanceof Error && !isOperationalError(reason)) {
        console.error("Non-operational error detected. Shutting down...");
        process.exit(1);
      }
    });
  }

  public handle(error: unknown, context?: string): AppError {
    return handleError(error, context);
  }
}

export const errorHandler = ErrorHandler.getInstance();

export function createErrorResponse(error: AppError) {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    },
  };
}

export function sanitizeErrorForClient(error: AppError): any {
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    message: error.message,
    code: error.code,
    ...(isDevelopment && { stack: error.stack }),
    ...(error.details && { details: error.details }),
  };
}
