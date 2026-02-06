import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { UserRole } from "@/types/database.types";
import { AuditLogQueries } from "@/lib/db/queries/audit-log.queries";

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

interface AuthOptions {
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  requireMFA?: boolean;
  skipAudit?: boolean;
}

interface SessionWithUser {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    mfaEnabled: boolean;
  };
}

export function withAuth(handler: RouteHandler, options?: AuthOptions) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = (await getServerSession(
        authOptions,
      )) as SessionWithUser | null;

      if (!session?.user) {
        return unauthorizedResponse("Authentication required");
      }

      if (options?.requireMFA && session.user.mfaEnabled) {
        const mfaVerified = req.headers.get("x-mfa-verified");
        if (mfaVerified !== "true") {
          return forbiddenResponse("MFA verification required");
        }
      }

      if (options?.requiredRole && session.user.role !== options.requiredRole) {
        await logAuthorizationFailure(
          req,
          session.user.id,
          options.requiredRole,
        );
        return forbiddenResponse("Insufficient permissions");
      }

      if (
        options?.allowedRoles &&
        !options.allowedRoles.includes(session.user.role)
      ) {
        await logAuthorizationFailure(
          req,
          session.user.id,
          options.allowedRoles.join(","),
        );
        return forbiddenResponse("Insufficient permissions");
      }

      if (!options?.skipAudit) {
        await logAccessAttempt(req, session.user.id, true);
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("Authentication error"));
    }
  };
}

export function withApiKey(handler: RouteHandler) {
  return async (req: NextRequest, context?: any) => {
    try {
      const apiKey = req.headers.get("x-api-key");

      if (!apiKey) {
        return unauthorizedResponse("API key required");
      }

      const { ApiKeyQueries } =
        await import("@/lib/db/queries/api-key.queries");

      const keyHash = ApiKeyQueries.hashApiKey(apiKey);
      const apiKeyRecord = await ApiKeyQueries.findByHash(keyHash);

      if (!apiKeyRecord) {
        await logApiKeyFailure(req, "invalid_key");
        return unauthorizedResponse("Invalid API key");
      }

      if (!apiKeyRecord.is_active) {
        await logApiKeyFailure(req, "inactive_key", apiKeyRecord.user_id);
        return unauthorizedResponse("API key is inactive");
      }

      await ApiKeyQueries.updateLastUsed(apiKeyRecord.id);

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("API key authentication error"));
    }
  };
}

export function withRoleCheck(allowedRoles: UserRole[]) {
  return (handler: RouteHandler) => {
    return withAuth(handler, { allowedRoles });
  };
}

export function withAdminOnly(handler: RouteHandler) {
  return withAuth(handler, { requiredRole: UserRole.ADMIN });
}

async function logAccessAttempt(
  req: NextRequest,
  userId: string,
  success: boolean,
): Promise<void> {
  try {
    await AuditLogQueries.create({
      user_id: userId,
      action: success ? "ACCESS_GRANTED" : "ACCESS_DENIED",
      entity_type: "API",
      ip_address: req.headers.get("x-forwarded-for") || req.ip,
      user_agent: req.headers.get("user-agent") || undefined,
    });
  } catch (error) {
    console.error("Failed to log access attempt:", error);
  }
}

async function logAuthorizationFailure(
  req: NextRequest,
  userId: string,
  requiredRole: string,
): Promise<void> {
  try {
    await AuditLogQueries.create({
      user_id: userId,
      action: "AUTHORIZATION_FAILED",
      entity_type: "API",
      new_value: { requiredRole, endpoint: req.url },
      ip_address: req.headers.get("x-forwarded-for") || req.ip,
      user_agent: req.headers.get("user-agent") || undefined,
    });
  } catch (error) {
    console.error("Failed to log authorization failure:", error);
  }
}

async function logApiKeyFailure(
  req: NextRequest,
  reason: string,
  userId?: string,
): Promise<void> {
  try {
    await AuditLogQueries.create({
      user_id: userId,
      action: "API_KEY_AUTH_FAILED",
      entity_type: "API",
      new_value: { reason, endpoint: req.url },
      ip_address: req.headers.get("x-forwarded-for") || req.ip,
      user_agent: req.headers.get("user-agent") || undefined,
    });
  } catch (error) {
    console.error("Failed to log API key failure:", error);
  }
}

export function combineMiddleware(
  ...middlewares: ((handler: RouteHandler) => RouteHandler)[]
) {
  return (handler: RouteHandler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler,
    );
  };
}
