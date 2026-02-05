import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  successResponse,
  handleApiError,
} from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId"); // Remote Number (from/to)

    if (!chatId) return successResponse([]);

    const sql = `
      SELECT m.* 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ? 
      AND (m.from_number = ? OR m.to_number = ?)
      ORDER BY m.created_at ASC
      LIMIT 100
    `;

    const rows: any[] = await query(sql, [session.user.id, chatId, chatId]);

    const messages = rows.map((row) => ({
      id: row.id,
      text: row.message,
      isMe: row.direction === "OUTBOUND",
      time: new Date(row.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: row.status,
    }));

    return successResponse(messages);
  } catch (error) {
    return handleApiError(error);
  }
}
