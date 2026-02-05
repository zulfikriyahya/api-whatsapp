import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  successResponse,
  handleApiError,
} from "@/lib/utils/api-response";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    // PERBAIKAN: Menambahkan 'messages.' di depan kolom yang ambigu (id, direction, dll)
    const sql = `
      SELECT 
        t1.remote_number,
        t1.display_name,
        m.message as last_message,
        m.created_at as last_activity,
        m.status
      FROM (
        SELECT 
          CASE 
            WHEN messages.direction = 'INBOUND' THEN messages.from_number 
            ELSE messages.to_number 
          END as remote_number,
          MAX(messages.id) as last_message_id, -- Fixed ambiguous column
          MAX(CASE WHEN messages.direction = 'INBOUND' THEN messages.from_number ELSE messages.to_number END) as display_name
        FROM messages 
        JOIN devices d ON messages.device_id = d.id
        WHERE d.user_id = ?
        GROUP BY remote_number
      ) t1
      JOIN messages m ON t1.last_message_id = m.id
      ORDER BY m.created_at DESC
    `;

    const rows: any[] = await query(sql, [session.user.id]);

    const conversations = rows.map((row) => ({
      id: row.remote_number,
      name: row.display_name || row.remote_number,
      number: row.remote_number,
      lastMessage: row.last_message,
      time: new Date(row.last_activity).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isGroup: row.remote_number.endsWith("@g.us"),
      unreadCount: 0, // Placeholder
    }));

    return successResponse(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}
