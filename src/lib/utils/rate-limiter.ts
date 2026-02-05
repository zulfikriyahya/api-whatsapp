import { queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";

interface RateLimitConfig {
  perMinute?: number;
  perHour?: number;
}

export class RateLimiter {
  static async checkLimit(
    deviceId: string,
    config?: RateLimitConfig,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const perMinute = config?.perMinute || appConfig.rateLimit.perMinute;
    const perHour = config?.perHour || appConfig.rateLimit.perHour;

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const minuteCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? 
       AND created_at >= ?`,
      [deviceId, oneMinuteAgo],
    );

    if (minuteCount && minuteCount.count >= perMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${perMinute} messages per minute`,
      };
    }

    const hourCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? 
       AND created_at >= ?`,
      [deviceId, oneHourAgo],
    );

    if (hourCount && hourCount.count >= perHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${perHour} messages per hour`,
      };
    }

    return { allowed: true };
  }

  static async getUsage(deviceId: string): Promise<{
    lastMinute: number;
    lastHour: number;
  }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const minuteCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? AND created_at >= ?`,
      [deviceId, oneMinuteAgo],
    );

    const hourCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? AND created_at >= ?`,
      [deviceId, oneHourAgo],
    );

    return {
      lastMinute: minuteCount?.count || 0,
      lastHour: hourCount?.count || 0,
    };
  }
}
