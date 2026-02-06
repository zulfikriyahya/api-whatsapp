import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
];

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-api-key",
  "x-correlation-id",
  "x-request-id",
];

const MAX_AGE = 86400;

export function secureCorsHeaders(origin?: string): HeadersInit {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
    "Access-Control-Max-Age": MAX_AGE.toString(),
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function handleSecureCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return NextResponse.json(
      {},
      {
        status: 204,
        headers: secureCorsHeaders(origin || undefined),
      },
    );
  }

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: "CORS policy violation" },
      { status: 403 },
    );
  }

  return null;
}

export function withSecureCors(
  handler: (req: NextRequest) => Promise<Response>,
) {
  return async (req: NextRequest) => {
    const corsResponse = handleSecureCors(req);
    if (corsResponse) return corsResponse;

    const response = await handler(req);
    const origin = req.headers.get("origin");
    const headers = secureCorsHeaders(origin || undefined);

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value as string);
    });

    return response;
  };
}
