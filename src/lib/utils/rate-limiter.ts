import { queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";

interface RateLimitConfig {
  perMinute?: number;
  perHour?: number;
  perDay?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: Date;
  reason?: string;
}

interface RateLimitWindow {
  count: number;
  resetAt: Date;
}

export class RateLimiter {
  private static cache: Map<string, RateLimitWindow[]> = new Map();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  static {
    this.startCleanup();
  }

  private static startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [key, windows] of this.cache.entries()) {
        const validWindows = windows.filter((w) => w.resetAt.getTime() > now);

        if (validWindows.length === 0) {
          this.cache.delete(key);
        } else if (validWindows.length !== windows.length) {
          this.cache.set(key, validWindows);
        }
      }
    }, 60000);
  }

  static async checkLimit(
    deviceId: string,
    config?: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const perMinute = config?.perMinute || appConfig.rateLimit.perMinute;
    const perHour = config?.perHour || appConfig.rateLimit.perHour;

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const [minuteResult, hourResult] = await Promise.all([
      this.checkWindow(deviceId, oneMinuteAgo, perMinute, "minute"),
      this.checkWindow(deviceId, oneHourAgo, perHour, "hour"),
    ]);

    if (!minuteResult.allowed) {
      return minuteResult;
    }

    if (!hourResult.allowed) {
      return hourResult;
    }

    return {
      allowed: true,
      remaining: perMinute - (minuteResult.remaining || 0),
    };
  }

  private static async checkWindow(
    deviceId: string,
    since: Date,
    limit: number,
    window: string,
  ): Promise<RateLimitResult> {
    const cacheKey = `${deviceId}:${window}`;
    const now = new Date();

    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? AND created_at >= ?`,
      [deviceId, since],
    );

    const count = result?.count || 0;

    if (count >= limit) {
      const resetAt = new Date(
        since.getTime() + (window === "minute" ? 60000 : 3600000),
      );

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        reason: `Rate limit exceeded: Max ${limit} messages per ${window}`,
      };
    }

    return {
      allowed: true,
      remaining: limit - count,
    };
  }

  static async checkApiKeyLimit(
    apiKey: string,
    limit: number = 1000,
    windowMs: number = 3600000,
  ): Promise<RateLimitResult> {
    const cacheKey = `apikey:${apiKey}`;
    const now = Date.now();
    const windows = this.cache.get(cacheKey) || [];

    const validWindows = windows.filter((w) => w.resetAt.getTime() > now);

    const totalCount = validWindows.reduce((sum, w) => sum + w.count, 0);

    if (totalCount >= limit) {
      const oldestWindow = validWindows.sort(
        (a, b) => a.resetAt.getTime() - b.resetAt.getTime(),
      )[0];

      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestWindow.resetAt,
        reason: `API key rate limit exceeded: Max ${limit} requests per hour`,
      };
    }

    const currentWindow: RateLimitWindow = {
      count: 1,
      resetAt: new Date(now + windowMs),
    };

    validWindows.push(currentWindow);
    this.cache.set(cacheKey, validWindows);

    return {
      allowed: true,
      remaining: limit - totalCount - 1,
    };
  }

  static async checkIpLimit(
    ipAddress: string,
    limit: number = 100,
    windowMs: number = 60000,
  ): Promise<RateLimitResult> {
    const cacheKey = `ip:${ipAddress}`;
    const now = Date.now();
    const windows = this.cache.get(cacheKey) || [];

    const validWindows = windows.filter((w) => w.resetAt.getTime() > now);

    const totalCount = validWindows.reduce((sum, w) => sum + w.count, 0);

    if (totalCount >= limit) {
      const oldestWindow = validWindows.sort(
        (a, b) => a.resetAt.getTime() - b.resetAt.getTime(),
      )[0];

      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestWindow.resetAt,
        reason: `IP rate limit exceeded: Max ${limit} requests per minute`,
      };
    }

    const existingWindow = validWindows.find(
      (w) => w.resetAt.getTime() > now && w.resetAt.getTime() <= now + windowMs,
    );

    if (existingWindow) {
      existingWindow.count++;
    } else {
      validWindows.push({
        count: 1,
        resetAt: new Date(now + windowMs),
      });
    }

    this.cache.set(cacheKey, validWindows);

    return {
      allowed: true,
      remaining: limit - totalCount - 1,
    };
  }

  static async getUsage(deviceId: string): Promise<{
    lastMinute: number;
    lastHour: number;
    lastDay: number;
  }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    const [minuteCount, hourCount, dayCount] = await Promise.all([
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages
         WHERE device_id = ? AND created_at >= ?`,
        [deviceId, oneMinuteAgo],
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages
         WHERE device_id = ? AND created_at >= ?`,
        [deviceId, oneHourAgo],
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages
         WHERE device_id = ? AND created_at >= ?`,
        [deviceId, oneDayAgo],
      ),
    ]);

    return {
      lastMinute: minuteCount?.count || 0,
      lastHour: hourCount?.count || 0,
      lastDay: dayCount?.count || 0,
    };
  }

  static async recordRequest(
    identifier: string,
    type: "device" | "apikey" | "ip" = "device",
  ): Promise<void> {
    const cacheKey = `${type}:${identifier}`;
    const now = Date.now();
    const windows = this.cache.get(cacheKey) || [];

    const validWindows = windows.filter((w) => w.resetAt.getTime() > now);

    const recentWindow = validWindows[validWindows.length - 1];

    if (recentWindow && recentWindow.resetAt.getTime() > now) {
      recentWindow.count++;
    } else {
      validWindows.push({
        count: 1,
        resetAt: new Date(now + 60000),
      });
    }

    this.cache.set(cacheKey, validWindows);
  }

  static clearCache(identifier?: string): void {
    if (identifier) {
      for (const type of ["device", "apikey", "ip"]) {
        this.cache.delete(`${type}:${identifier}`);
      }
    } else {
      this.cache.clear();
    }
  }

  static getCacheStats(): {
    totalEntries: number;
    totalWindows: number;
    cacheSize: number;
  } {
    let totalWindows = 0;

    for (const windows of this.cache.values()) {
      totalWindows += windows.length;
    }

    return {
      totalEntries: this.cache.size,
      totalWindows,
      cacheSize: totalWindows * 24,
    };
  }
}
