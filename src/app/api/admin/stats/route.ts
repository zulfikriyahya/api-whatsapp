// src/app/api/admin/stats/route.ts
import { query, queryOne } from "@/lib/db";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

// Hapus parameter request
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const totalUsers: any = await queryOne(
      "SELECT COUNT(*) as count FROM users",
    );
    const activeUsers: any = await queryOne(
      "SELECT COUNT(*) as count FROM users WHERE is_active = true",
    );
    const totalDevices: any = await queryOne(
      "SELECT COUNT(*) as count FROM devices",
    );
    const activeDevices: any = await queryOne(
      "SELECT COUNT(*) as count FROM devices WHERE status = 'AUTHENTICATED' AND is_ready = true",
    );
    const totalMessages: any = await queryOne(
      "SELECT COUNT(*) as count FROM messages",
    );
    const todayMessages: any = await queryOne(
      "SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = CURDATE()",
    );

    const usersByRole = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    const messagesByStatus = await query(`
      SELECT status, COUNT(*) as count
      FROM messages
      GROUP BY status
    `);

    const devicesByStatus = await query(`
      SELECT status, COUNT(*) as count
      FROM devices
      GROUP BY status
    `);

    return successResponse({
      users: {
        total: totalUsers?.count || 0,
        active: activeUsers?.count || 0,
        byRole: usersByRole,
      },
      devices: {
        total: totalDevices?.count || 0,
        active: activeDevices?.count || 0,
        byStatus: devicesByStatus,
      },
      messages: {
        total: totalMessages?.count || 0,
        today: todayMessages?.count || 0,
        byStatus: messagesByStatus,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
