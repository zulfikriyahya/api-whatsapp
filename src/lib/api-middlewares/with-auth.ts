import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { UserRole } from "@/types/database.types";

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

interface AuthOptions {
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

export function withAuth(handler: RouteHandler, options?: AuthOptions) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return unauthorizedResponse();
      }

      if (options?.requiredRole && session.user.role !== options.requiredRole) {
        return forbiddenResponse("Insufficient permissions");
      }

      if (
        options?.allowedRoles &&
        !options.allowedRoles.includes(session.user.role as UserRole)
      ) {
        return forbiddenResponse("Insufficient permissions");
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("Unknown error in auth middleware"));
    }
  };
}
