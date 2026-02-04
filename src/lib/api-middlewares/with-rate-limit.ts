import { NextRequest } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth/options";

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

export function withRateLimit(handler: RouteHandler) {
  return async (req: NextRequest, context?: any) => {
    try {
      // const session = await getServerSession(authOptions);
      // Rate limiting by device usually happens in service,
      // but here we can rate limit by User ID or IP for API protection

      // If we are in a device context (e.g. sending message), extract deviceId from body
      const clone = req.clone();
      try {
        const body = await clone.json();
        if (body.deviceId) {
          const check = await RateLimiter.checkLimit(body.deviceId);
          if (!check.allowed) {
            return rateLimitResponse();
          }
          // Record usage asynchronously
          RateLimiter.recordLimit(body.deviceId).catch(console.error);
        }
      } catch (e) {
        // Body parsing failed or not JSON, skip device check
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("Unknown error"));
    }
  };
}
