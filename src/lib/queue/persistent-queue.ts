import Queue, { Job, JobOptions } from "bull";
import { appConfig } from "@/config/app.config";
import { whatsappClientManager } from "../whatsapp/client-manager";
import { MessageQueries } from "../db/queries/message.queries";
import { MessageStatus } from "@/types/database.types";
import { logger } from "../services/logger.service";

interface MessageQueueData {
  messageId: string;
  deviceId: string;
  toNumber: string;
  message: string;
  mediaPath?: string;
  userId: string;
  attempt: number;
}

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export class PersistentMessageQueue {
  private queue: Queue.Queue<MessageQueueData>;
  private deadLetterQueue: Queue.Queue<MessageQueueData>;
  private readonly maxRetries = appConfig.retry.maxAttempts;
  private readonly retryDelay = appConfig.retry.delayMs;

  constructor() {
    const redisConfig = appConfig.redis
      ? { redis: appConfig.redis.url }
      : undefined;

    this.queue = new Queue<MessageQueueData>(
      "message-queue",
      redisConfig || {
        redis: { port: 6379, host: "127.0.0.1" },
      },
    );

    this.deadLetterQueue = new Queue<MessageQueueData>(
      "dead-letter-queue",
      redisConfig || {
        redis: { port: 6379, host: "127.0.0.1" },
      },
    );

    this.setupProcessors();
    this.setupEventHandlers();
  }

  private setupProcessors(): void {
    this.queue.process(3, async (job: Job<MessageQueueData>) => {
      return this.processMessage(job);
    });

    this.deadLetterQueue.process(async (job: Job<MessageQueueData>) => {
      logger.error("Processing dead letter", { data: job.data });
      return { processed: true, outcome: "logged" };
    });
  }

  private setupEventHandlers(): void {
    this.queue.on("completed", (job) => {
      logger.info("Message completed", {
        messageId: job.data.messageId,
        attempts: job.attemptsMade,
      });
    });

    this.queue.on("failed", async (job, err) => {
      logger.error("Message failed", {
        messageId: job.data.messageId,
        error: err.message,
        attempts: job.attemptsMade,
      });

      if (job.attemptsMade >= this.maxRetries) {
        await this.deadLetterQueue.add(job.data, {
          attempts: 1,
          removeOnComplete: false,
        });

        await MessageQueries.updateStatus(
          job.data.messageId,
          MessageStatus.FAILED,
          `Max retries exceeded: ${err.message}`,
        );
      }
    });

    this.queue.on("stalled", (job) => {
      logger.warn("Message stalled", { messageId: job.data.messageId });
    });
  }

  private async processMessage(
    job: Job<MessageQueueData>,
  ): Promise<{ success: boolean }> {
    const { messageId, deviceId, toNumber, message, mediaPath } = job.data;

    try {
      await job.progress(10);

      await MessageQueries.updateStatus(messageId, MessageStatus.SENDING);

      await job.progress(30);

      const result = await whatsappClientManager.sendMessage(
        deviceId,
        toNumber,
        message,
        messageId,
        mediaPath,
      );

      await job.progress(70);

      if (!result.success) {
        throw new Error(result.error || "Send failed");
      }

      await job.progress(100);

      return { success: true };
    } catch (error: any) {
      await MessageQueries.updateStatus(
        messageId,
        MessageStatus.QUEUED,
        error.message,
      );

      throw error;
    }
  }

  async addMessage(data: Omit<MessageQueueData, "attempt">): Promise<string> {
    const options: JobOptions = {
      attempts: this.maxRetries,
      backoff: {
        type: "exponential",
        delay: this.retryDelay,
      },
      removeOnComplete: {
        age: 86400,
        count: 1000,
      },
      removeOnFail: false,
    };

    const job = await this.queue.add({ ...data, attempt: 0 }, options);
    return job.id.toString();
  }

  async addBulkMessages(
    messages: Array<Omit<MessageQueueData, "attempt">>,
  ): Promise<string[]> {
    const jobs = messages.map((data) => ({
      data: { ...data, attempt: 0 },
      opts: {
        attempts: this.maxRetries,
        backoff: {
          type: "exponential",
          delay: this.retryDelay,
        },
      } as JobOptions,
    }));

    const bulkJobs = await this.queue.addBulk(jobs);
    return bulkJobs.map((job) => job.id.toString());
  }

  async getMetrics(): Promise<QueueMetrics> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: await this.queue.isPaused(),
    };
  }

  async pause(): Promise<void> {
    await this.queue.pause();
  }

  async resume(): Promise<void> {
    await this.queue.resume();
  }

  async clean(grace: number = 86400000): Promise<number> {
    const completedJobs = await this.queue.clean(grace, "completed");
    const failedJobs = await this.queue.clean(grace, "failed");
    return completedJobs.length + failedJobs.length;
  }

  async close(): Promise<void> {
    await this.queue.close();
    await this.deadLetterQueue.close();
  }
}

export const persistentMessageQueue = new PersistentMessageQueue();
