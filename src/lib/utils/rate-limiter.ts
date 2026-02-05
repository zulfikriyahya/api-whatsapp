import { queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";

export class RateLimiter {
  static async checkLimit(
    deviceId: string,
    perMinute: number = appConfig.rateLimit.perMinute,
    perHour: number = appConfig.rateLimit.perHour,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const minuteCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? 
       AND created_at >= ?`,
      [deviceId, oneMinuteAgo],
    );

    if (minuteCount.count >= perMinute) {
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

    if (hourCount.count >= perHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${perHour} messages per hour`,
      };
    }

    return { allowed: true };
  }

  static async recordLimit(_deviceId: string): Promise<void> {
    // Placeholder for future implementation (e.g. Redis counter)
  }
}
