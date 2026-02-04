// src/lib/utils/rate-limiter.ts
import { query, queryOne } from "@/lib/db";
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
       AND status IN ('SENT', 'DELIVERED', 'READ')
       AND sent_at >= ?`,
      [deviceId, oneMinuteAgo],
    );

    if (minuteCount.count >= perMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${perMinute} messages per minute`,
      };
    }

    const hourCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? 
       AND status IN ('SENT', 'DELIVERED', 'READ')
       AND sent_at >= ?`,
      [deviceId, oneHourAgo],
    );

    if (hourCount.count >= perHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${perHour} messages per hour`,
      };
    }

    return { allowed: true };
  }

  static async recordLimit(deviceId: string): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60000);

    const existing: any = await queryOne(
      `SELECT * FROM rate_limits
       WHERE device_id = ? AND window_start >= ?`,
      [deviceId, windowStart],
    );

    if (existing) {
      await query(
        `UPDATE rate_limits 
         SET messages_count = messages_count + 1, updated_at = NOW()
         WHERE id = ?`,
        [existing.id],
      );
    } else {
      const id = require("uuid").v4();
      await query(
        `INSERT INTO rate_limits (id, device_id, messages_count, window_start, window_end)
         VALUES (?, ?, 1, ?, ?)`,
        [id, deviceId, now, new Date(now.getTime() + 60000)],
      );
    }
  }
}
