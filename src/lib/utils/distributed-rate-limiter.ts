import Redis from "ioredis";
import { appConfig } from "@/config/app.config";

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class DistributedRateLimiter {
  private redis: Redis | null = null;
  private fallbackMemoryCache: Map<
    string,
    { count: number; expiresAt: number }
  > = new Map();

  constructor() {
    if (appConfig.redis) {
      this.redis = new Redis(appConfig.redis.url, {
        password: appConfig.redis.password,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      this.redis.on("error", (err) => {
        console.error("[RateLimiter] Redis error:", err);
      });

      this.redis.connect().catch((err) => {
        console.error("[RateLimiter] Failed to connect to Redis:", err);
      });
    }
  }

  async checkLimit(
    identifier: string,
    options: RateLimitOptions,
  ): Promise<RateLimitResult> {
    const { maxRequests, windowMs, keyPrefix = "ratelimit" } = options;
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (this.redis && this.redis.status === "ready") {
      return this.checkWithRedis(key, maxRequests, windowMs, now, windowStart);
    }

    return this.checkWithMemory(key, maxRequests, windowMs, now);
  }

  private async checkWithRedis(
    key: string,
    maxRequests: number,
    windowMs: number,
    now: number,
    windowStart: number,
  ): Promise<RateLimitResult> {
    const pipeline = this.redis!.pipeline();

    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error("Redis pipeline failed");
    }

    const count = results[2][1] as number;
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = new Date(now + windowMs);

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil(windowMs / 1000),
    };
  }

  private checkWithMemory(
    key: string,
    maxRequests: number,
    windowMs: number,
    now: number,
  ): RateLimitResult {
    const existing = this.fallbackMemoryCache.get(key);

    if (!existing || existing.expiresAt < now) {
      this.fallbackMemoryCache.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(now + windowMs),
      };
    }

    existing.count++;

    const allowed = existing.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - existing.count);
    const resetAt = new Date(existing.expiresAt);

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed
        ? undefined
        : Math.ceil((existing.expiresAt - now) / 1000),
    };
  }

  async reset(
    identifier: string,
    keyPrefix: string = "ratelimit",
  ): Promise<void> {
    const key = `${keyPrefix}:${identifier}`;

    if (this.redis && this.redis.status === "ready") {
      await this.redis.del(key);
    }

    this.fallbackMemoryCache.delete(key);
  }

  cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.fallbackMemoryCache.entries()) {
      if (value.expiresAt < now) {
        this.fallbackMemoryCache.delete(key);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export const distributedRateLimiter = new DistributedRateLimiter();

setInterval(() => {
  distributedRateLimiter.cleanupMemoryCache();
}, 60000);
