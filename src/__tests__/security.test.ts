import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { PasswordUtils } from "../utils/password";
import { SecureQueryBuilder } from "../db/secure-query";
import { DistributedRateLimiter } from "../utils/distributed-rate-limiter";
import { CircuitBreaker } from "../resilience/circuit-breaker";

describe("PasswordUtils", () => {
  describe("hash", () => {
    it("should hash password securely", async () => {
      const password = "Test@123456";
      const hash = await PasswordUtils.hash(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should throw error for weak passwords", async () => {
      await expect(PasswordUtils.hash("weak")).rejects.toThrow();
    });
  });

  describe("verify", () => {
    it("should verify correct password", async () => {
      const password = "Test@123456";
      const hash = await PasswordUtils.hash(password);
      const isValid = await PasswordUtils.verify(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "Test@123456";
      const hash = await PasswordUtils.hash(password);
      const isValid = await PasswordUtils.verify("Wrong@123", hash);

      expect(isValid).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should accept strong password", () => {
      expect(() => PasswordUtils.validatePassword("Test@123456")).not.toThrow();
    });

    it("should reject short password", () => {
      expect(() => PasswordUtils.validatePassword("Test@1")).toThrow();
    });

    it("should reject password without uppercase", () => {
      expect(() => PasswordUtils.validatePassword("test@123456")).toThrow();
    });

    it("should reject password without lowercase", () => {
      expect(() => PasswordUtils.validatePassword("TEST@123456")).toThrow();
    });

    it("should reject password without number", () => {
      expect(() => PasswordUtils.validatePassword("Test@abcdef")).toThrow();
    });

    it("should reject password without special char", () => {
      expect(() => PasswordUtils.validatePassword("Test12345678")).toThrow();
    });
  });

  describe("generateApiKey", () => {
    it("should generate unique API keys", () => {
      const key1 = PasswordUtils.generateApiKey();
      const key2 = PasswordUtils.generateApiKey();

      expect(key1).toBeTruthy();
      expect(key2).toBeTruthy();
      expect(key1).not.toBe(key2);
      expect(key1.startsWith("wwa_")).toBe(true);
    });
  });
});

describe("SecureQueryBuilder", () => {
  describe("escapeIdentifier", () => {
    it("should escape SQL identifiers", () => {
      const escaped = SecureQueryBuilder.escapeIdentifier("user_table");
      expect(escaped).toBe("`user_table`");
    });

    it("should prevent SQL injection in identifiers", () => {
      const malicious = "users`; DROP TABLE users; --";
      const escaped = SecureQueryBuilder.escapeIdentifier(malicious);
      expect(escaped).not.toContain("DROP");
    });
  });

  describe("escape", () => {
    it("should escape SQL values", () => {
      const escaped = SecureQueryBuilder.escape("test'value");
      expect(escaped).toBe("'test\\'value'");
    });

    it("should prevent SQL injection in values", () => {
      const malicious = "'; DROP TABLE users; --";
      const escaped = SecureQueryBuilder.escape(malicious);
      expect(escaped).not.toContain("DROP TABLE");
    });
  });
});

describe("CircuitBreaker", () => {
  let successFn: jest.Mock;
  let failureFn: jest.Mock;

  beforeEach(() => {
    successFn = jest.fn().mockResolvedValue("success");
    failureFn = jest.fn().mockRejectedValue(new Error("failure"));
  });

  it("should remain closed on successful calls", async () => {
    const breaker = new CircuitBreaker(successFn, {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
    });

    await breaker.execute();
    await breaker.execute();

    expect(breaker.getState()).toBe("CLOSED");
    expect(successFn).toHaveBeenCalledTimes(2);
  });

  it("should open after threshold failures", async () => {
    const breaker = new CircuitBreaker(failureFn, {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
    });

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute()).rejects.toThrow();
    }

    expect(breaker.getState()).toBe("OPEN");
  });

  it("should reject calls when open", async () => {
    const breaker = new CircuitBreaker(failureFn, {
      failureThreshold: 2,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
    });

    await expect(breaker.execute()).rejects.toThrow();
    await expect(breaker.execute()).rejects.toThrow();

    expect(breaker.getState()).toBe("OPEN");

    await expect(breaker.execute()).rejects.toThrow("Circuit breaker is OPEN");
  });

  it("should transition to half-open after timeout", async () => {
    jest.useFakeTimers();

    const breaker = new CircuitBreaker(successFn, {
      failureThreshold: 2,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
    });

    const failFn = jest.fn().mockRejectedValue(new Error("fail"));
    const testBreaker = new CircuitBreaker(failFn, {
      failureThreshold: 2,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
    });

    await expect(testBreaker.execute()).rejects.toThrow();
    await expect(testBreaker.execute()).rejects.toThrow();

    expect(testBreaker.getState()).toBe("OPEN");

    jest.advanceTimersByTime(6000);

    testBreaker["fn"] = successFn;
    await testBreaker.execute();

    expect(testBreaker.getState()).toBe("HALF_OPEN");

    jest.useRealTimers();
  });

  it("should timeout long-running calls", async () => {
    const slowFn = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000)),
      );

    const breaker = new CircuitBreaker(slowFn, {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 100,
      resetTimeout: 5000,
    });

    await expect(breaker.execute()).rejects.toThrow("timeout");
  });
});

describe("DistributedRateLimiter", () => {
  let limiter: DistributedRateLimiter;

  beforeEach(() => {
    limiter = new DistributedRateLimiter();
  });

  afterEach(async () => {
    await limiter.disconnect();
  });

  it("should allow requests within limit", async () => {
    const result = await limiter.checkLimit("test-user", {
      maxRequests: 5,
      windowMs: 60000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should block requests exceeding limit", async () => {
    const options = { maxRequests: 2, windowMs: 60000 };

    await limiter.checkLimit("test-user-2", options);
    await limiter.checkLimit("test-user-2", options);
    const result = await limiter.checkLimit("test-user-2", options);

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("should reset limits after window", async () => {
    jest.useFakeTimers();

    const options = { maxRequests: 1, windowMs: 1000 };

    const result1 = await limiter.checkLimit("test-user-3", options);
    expect(result1.allowed).toBe(true);

    const result2 = await limiter.checkLimit("test-user-3", options);
    expect(result2.allowed).toBe(false);

    jest.advanceTimersByTime(1500);

    const result3 = await limiter.checkLimit("test-user-3", options);
    expect(result3.allowed).toBe(true);

    jest.useRealTimers();
  });
});

describe("Integration: Authentication Flow", () => {
  it("should complete full authentication cycle", async () => {
    const password = "SecurePass@123";
    const hash = await PasswordUtils.hash(password);

    const isValid = await PasswordUtils.verify(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await PasswordUtils.verify("WrongPass@123", hash);
    expect(isInvalid).toBe(false);
  });
});
