import { NextRequest } from "next/server";
import { AuditLogQueries } from "@/lib/db/queries/audit-log.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export function withAudit(
  handler: (req: NextRequest) => Promise<Response>,
  action: string,
  entityType: string,
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    const response = await handler(req);

    if (session?.user && response.ok) {
      await AuditLogQueries.create({
        user_id: session.user.id,
        action,
        entity_type: entityType,
        ip_address: req.headers.get("x-forwarded-for") || req.ip || undefined,
        user_agent: req.headers.get("user-agent") || undefined,
      }).catch(console.error);
    }

    return response;
  };
}
