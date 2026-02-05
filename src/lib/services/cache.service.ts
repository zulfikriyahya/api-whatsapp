import NodeCache from "node-cache";

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 300);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): string[] {
    return this.cache.keys();
  }
}

export const cacheService = new CacheService();
