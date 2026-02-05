import { NextRequest } from "next/server";
import {
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query, queryOne } from "@/lib/db";
import { Message } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const deviceId = searchParams.get("deviceId");
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    let sql = `
      SELECT m.*, d.name as device_name 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const params: any[] = [session.user.id];

    if (deviceId) {
      sql += " AND m.device_id = ?";
      params.push(deviceId);
    }

    if (status) {
      sql += " AND m.status = ?";
      params.push(status);
    }

    sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const messages = await query<Message[]>(sql, params);

    let countSql = `
      SELECT COUNT(*) as total 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const countParams: any[] = [session.user.id];

    if (deviceId) {
      countSql += " AND m.device_id = ?";
      countParams.push(deviceId);
    }

    if (status) {
      countSql += " AND m.status = ?";
      countParams.push(status);
    }

    const countResult = await queryOne<{ total: number }>(
      countSql,
      countParams,
    );

    return paginatedResponse(messages, page, limit, countResult?.total || 0);
  } catch (error) {
    return handleApiError(error);
  }
}
