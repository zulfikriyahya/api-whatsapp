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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const [
      totalUsers,
      activeUsers,
      totalDevices,
      activeDevices,
      totalMessages,
      todayMessages,
      usersByRole,
      messagesByStatus,
      devicesByStatus,
    ] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users"),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE is_active = true",
      ),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM devices"),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM devices WHERE status = ? AND is_ready = true",
        ["AUTHENTICATED"],
      ),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM messages"),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = CURDATE()",
      ),
      query<any[]>("SELECT role, COUNT(*) as count FROM users GROUP BY role"),
      query<any[]>(
        "SELECT status, COUNT(*) as count FROM messages GROUP BY status",
      ),
      query<any[]>(
        "SELECT status, COUNT(*) as count FROM devices GROUP BY status",
      ),
    ]);

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
