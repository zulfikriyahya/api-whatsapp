// src/lib/utils/api-response.ts
import { NextResponse } from "next/server";
import type { ApiResponse, ApiError, ApiMeta } from "@/types/api.types";
import { appConfig } from "@/config/app.config";

interface SuccessOptions {
  status?: number;
  meta?: Partial<ApiMeta>;
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  options?: SuccessOptions,
): NextResponse<ApiResponse<T>> {
  const status = options?.status || 200;
  const meta = options?.meta || {};

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status },
  );
}

/**
 * Create error response
 */
export function errorResponse(
  message: string,
  code: string = "ERROR",
  status: number = 400,
  details?: Record<string, any>,
): NextResponse<ApiResponse> {
  const error: ApiError = {
    code,
    message,
    details,
  };

  // Include stack trace in development
  if (appConfig.isDevelopment && details?.stack) {
    error.stack = details.stack;
  }

  return NextResponse.json(
    {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

/**
 * Create validation error response
 */
export function validationErrorResponse(
  errors: Array<{ field: string; message: string }>,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { validationErrors: errors },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: 422 },
  );
}

/**
 * Create not found response
 */
export function notFoundResponse(
  resource: string = "Resource",
): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, "NOT_FOUND", 404);
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(
  message: string = "Unauthorized",
): NextResponse<ApiResponse> {
  return errorResponse(message, "UNAUTHORIZED", 401);
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(
  message: string = "Forbidden",
): NextResponse<ApiResponse> {
  return errorResponse(message, "FORBIDDEN", 403);
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(): NextResponse<ApiResponse> {
  return errorResponse("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", 429);
}

/**
 * Create server error response
 */
export function serverErrorResponse(error: Error): NextResponse<ApiResponse> {
  console.error("Server error:", error);

  return errorResponse(
    appConfig.isDevelopment ? error.message : "Internal server error",
    "INTERNAL_ERROR",
    500,
    appConfig.isDevelopment ? { stack: error.stack } : undefined,
  );
}

/**
 * Handle API errors uniformly
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof Error) {
    // Known error types
    if (error.message.includes("not found")) {
      return notFoundResponse();
    }
    if (error.message.includes("unauthorized")) {
      return unauthorizedResponse();
    }
    if (error.message.includes("forbidden")) {
      return forbiddenResponse();
    }
    if (error.message.includes("rate limit")) {
      return rateLimitResponse();
    }

    // Generic server error
    return serverErrorResponse(error);
  }

  // Unknown error
  return errorResponse("An unexpected error occurred", "UNKNOWN_ERROR", 500);
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    },
    { status: 200 },
  );
}
