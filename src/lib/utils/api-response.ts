import { NextResponse } from "next/server";

export function successResponse(data: any, options: { status?: number } = {}) {
  return NextResponse.json(
    { success: true, data },
    { status: options.status || 200 },
  );
}

export function errorResponse(
  message: string,
  statusCode: number,
  code: string,
) {
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status: statusCode },
  );
}

export function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number,
) {
  const totalPages = Math.ceil(total / limit);
  return NextResponse.json({
    success: true,
    data,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
}

export function handleApiError(error: any) {
  console.error("[API Error]", error);
  const message =
    error instanceof Error ? error.message : "Internal Server Error";

  if (message.toLowerCase().includes("not found"))
    return errorResponse(message, 404, "NOT_FOUND");
  if (message.toLowerCase().includes("unauthorized"))
    return errorResponse(message, 401, "UNAUTHORIZED");
  if (message.toLowerCase().includes("forbidden"))
    return errorResponse(message, 403, "FORBIDDEN");

  return errorResponse(message, 500, "INTERNAL_ERROR");
}

export const unauthorizedResponse = (message: string = "Unauthorized") =>
  errorResponse(message, 401, "UNAUTHORIZED");

export const forbiddenResponse = (message: string = "Forbidden") =>
  errorResponse(message, 403, "FORBIDDEN");

export const notFoundResponse = (entity: string) =>
  errorResponse(`${entity} Not Found`, 404, "NOT_FOUND");

export const validationErrorResponse = (errors: any) =>
  NextResponse.json(
    { success: false, error: { message: "Validation Error", details: errors } },
    { status: 422 },
  );

export const rateLimitResponse = () =>
  errorResponse("Too Many Requests", 429, "RATE_LIMIT_EXCEEDED");

export const serverErrorResponse = (error: Error) => {
  console.error(error);
  return errorResponse("Internal Server Error", 500, "INTERNAL_ERROR");
};
