type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

export class CircuitBreaker<T extends (...args: any[]) => Promise<any>> {
  private state: CircuitState = "CLOSED";
  private metrics: CircuitMetrics = {
    failures: 0,
    successes: 0,
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
  };
  private nextAttemptTime: number = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(
    private readonly fn: T,
    options?: Partial<CircuitBreakerOptions>,
  ) {
    this.options = {
      failureThreshold: options?.failureThreshold || 5,
      successThreshold: options?.successThreshold || 2,
      timeout: options?.timeout || 10000,
      resetTimeout: options?.resetTimeout || 60000,
    };
  }

  async execute(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error("Circuit breaker is OPEN");
      }
      this.state = "HALF_OPEN";
    }

    try {
      const result = await this.executeWithTimeout(args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout(
    args: Parameters<T>,
  ): Promise<ReturnType<T>> {
    return Promise.race([
      this.fn(...args),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Circuit breaker timeout")),
          this.options.timeout,
        ),
      ),
    ]);
  }

  private onSuccess(): void {
    this.metrics.successes++;
    this.metrics.consecutiveSuccesses++;
    this.metrics.consecutiveFailures = 0;
    this.metrics.lastSuccessTime = Date.now();

    if (this.state === "HALF_OPEN") {
      if (this.metrics.consecutiveSuccesses >= this.options.successThreshold) {
        this.state = "CLOSED";
        this.resetMetrics();
      }
    }
  }

  private onFailure(): void {
    this.metrics.failures++;
    this.metrics.consecutiveFailures++;
    this.metrics.consecutiveSuccesses = 0;
    this.metrics.lastFailureTime = Date.now();

    if (this.metrics.consecutiveFailures >= this.options.failureThreshold) {
      this.state = "OPEN";
      this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    }
  }

  private resetMetrics(): void {
    this.metrics = {
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
    };
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.state = "CLOSED";
    this.resetMetrics();
    this.nextAttemptTime = 0;
  }

  forceOpen(): void {
    this.state = "OPEN";
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
  }

  forceClose(): void {
    this.state = "CLOSED";
    this.resetMetrics();
  }
}

export function createCircuitBreaker<
  T extends (...args: any[]) => Promise<any>,
>(fn: T, options?: Partial<CircuitBreakerOptions>): CircuitBreaker<T> {
  return new CircuitBreaker(fn, options);
}
