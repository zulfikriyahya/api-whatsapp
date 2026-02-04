// src/app/api/audit-logs/route.ts
import { NextRequest } from "next/server";
import { AuditLogQueries } from "@/lib/db/queries/audit-log.queries";
import {
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let logs;
    let total;

    if (session.user.role === UserRole.ADMIN) {
      // NOTE: Logic asli dari blueprint menggunakan findByUserId untuk admin juga.
      // Anda mungkin ingin mengubahnya menjadi AuditLogQueries.findAll() nanti jika admin butuh melihat semua log.
      logs = await AuditLogQueries.findByUserId(session.user.id, {
        limit,
        offset,
      });
      total = await AuditLogQueries.countByUser(session.user.id);
    } else {
      logs = await AuditLogQueries.findByUserId(session.user.id, {
        limit,
        offset,
      });
      total = await AuditLogQueries.countByUser(session.user.id);
    }

    return paginatedResponse(logs, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}
