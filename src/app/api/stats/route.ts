// src/app/api/stats/route.ts
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { DeviceService } from "@/lib/services/device.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

/**
 * GET /api/stats
 * Get dashboard statistics
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    // Get message statistics
    const messageStats = await MessageService.getMessageStats({
      deviceId,
      startDate,
      endDate,
    });

    // Get hourly statistics
    const hourlyStats = await MessageService.getHourlyStats(deviceId, 24);

    // Get device statistics
    const devices = await DeviceService.getUserDevices(session.user.id);
    const deviceStats = devices.map((device) => ({
      deviceId: device.id,
      deviceName: device.name,
      status: device.status,
      isReady: device.is_ready,
      messageCount: device.message_count || 0,
      lastMessageAt: device.last_message_at,
    }));

    // Calculate totals
    const totalDevices = devices.length;
    const activeDevices = devices.filter(
      (d) => d.status === "AUTHENTICATED" && d.is_ready,
    ).length;

    return successResponse({
      overview: {
        totalDevices,
        activeDevices,
        totalMessages: messageStats.total,
        sentMessages: messageStats.sent,
        failedMessages: messageStats.failed,
        pendingMessages: messageStats.pending,
        successRate: messageStats.successRate,
      },
      devices: deviceStats,
      hourlyStats,
      period: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/stats/summary
 * Get quick summary for dashboard cards
 */
export async function HEAD(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const devices = await DeviceService.getUserDevices(session.user.id);
    const todayStats = await MessageService.getMessageStats();

    return successResponse({
      totalDevices: devices.length,
      activeDevices: devices.filter((d) => d.is_ready).length,
      todayMessages: todayStats.total,
      successRate: todayStats.successRate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
