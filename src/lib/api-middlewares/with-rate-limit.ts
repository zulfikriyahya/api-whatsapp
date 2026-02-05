import { NextRequest } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

export function withRateLimit(handler: RouteHandler) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Basic rate limit check based on API Key if present
      const apiKey = req.headers.get("x-api-key");
      if (apiKey) {
        // Future implementation: Check rate limit per API key
        // const allowed = await RateLimiter.checkApiKeyLimit(apiKey);
        // if (!allowed) return rateLimitResponse();
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("Unknown error in middleware"));
    }
  };
}
