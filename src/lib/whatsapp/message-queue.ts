import { query, queryOne, transaction } from "../db";
import { whatsappClientManager } from "./client-manager";
import { MessageStatus } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

const globalForQueue = global as unknown as {
  messageQueue: MessageQueue | undefined;
};

interface QueueItem {
  id: string;
  messageId: string;
  deviceId: string;
  priority: number;
  scheduledAt: Date;
  retries: number;
  lastError?: string;
}

interface QueueMetrics {
  queueSize: number;
  processing: boolean;
  pendingMessages: number;
  completedToday: number;
  failedToday: number;
}

class MessageQueue extends EventEmitter {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly maxConcurrent = 3;
  private readonly retryDelay = parseInt(process.env.RETRY_DELAY_MS || "5000");
  private readonly maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || "3");
  private readonly maxQueueSize = 10000;
  private activeProcessing: Set<string> = new Set();
  private isShuttingDown = false;

  constructor() {
    super();
    this.loadPendingMessages().catch(console.error);
    this.startProcessing();
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      console.log(`[Queue] Received ${signal}, shutting down...`);

      this.stopProcessing();
      await this.waitForProcessingComplete();

      console.log("[Queue] Shutdown complete");
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }

  private async waitForProcessingComplete(): Promise<void> {
    const maxWait = 30000;
    const startTime = Date.now();

    while (this.activeProcessing.size > 0) {
      if (Date.now() - startTime > maxWait) {
        console.warn("[Queue] Force shutdown, some messages may be incomplete");
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async loadPendingMessages(): Promise<void> {
    try {
      const pending: any[] = await query(
        `SELECT * FROM message_queue 
         WHERE status = 'PENDING' 
         ORDER BY priority DESC, scheduled_at ASC 
         LIMIT ?`,
        [this.maxQueueSize],
      );

      for (const item of pending) {
        this.queue.push({
          id: item.id,
          messageId: item.message_id,
          deviceId: item.device_id,
          priority: item.priority,
          scheduledAt: new Date(item.scheduled_at),
          retries: 0,
        });
      }

      console.log(`[Queue] Loaded ${pending.length} pending messages`);
      this.emit("queue_loaded", { count: pending.length });
    } catch (error) {
      console.error("[Queue] Failed to load pending messages:", error);
      this.emit("load_error", { error });
    }
  }

  async addMessage(
    messageId: string,
    deviceId: string,
    priority: number = 0,
    scheduledAt: Date = new Date(),
  ): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error("Queue is shutting down");
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Queue is full");
    }

    const queueId = uuidv4();

    await query(
      `INSERT INTO message_queue (id, message_id, device_id, priority, scheduled_at, status) 
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [queueId, messageId, deviceId, priority, scheduledAt],
    );

    this.queue.push({
      id: queueId,
      messageId,
      deviceId,
      priority,
      scheduledAt,
      retries: 0,
    });

    this.sortQueue();
    this.emit("message_added", { messageId, deviceId, priority });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
  }

  private startProcessing(): void {
    if (this.processingInterval || this.isShuttingDown) return;

    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.queue.length > 0 && !this.isShuttingDown) {
        await this.processQueue();
      }
    }, 1000);
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.isShuttingDown) return;

    this.processing = true;

    try {
      const now = new Date();
      const readyMessages = this.queue.filter(
        (item) =>
          item.scheduledAt <= now && !this.activeProcessing.has(item.id),
      );

      if (readyMessages.length === 0) {
        return;
      }

      const availableSlots = this.maxConcurrent - this.activeProcessing.size;
      const batch = readyMessages.slice(0, availableSlots);

      await Promise.allSettled(batch.map((item) => this.processMessage(item)));
    } catch (error) {
      console.error("[Queue] Error processing queue:", error);
      this.emit("processing_error", { error });
    } finally {
      this.processing = false;
    }
  }

  private async processMessage(item: QueueItem): Promise<void> {
    this.activeProcessing.add(item.id);

    try {
      const message: any = await queryOne(
        "SELECT * FROM messages WHERE id = ?",
        [item.messageId],
      );

      if (!message) {
        await this.removeFromQueue(item.id);
        return;
      }

      await query(
        `UPDATE messages SET status = ?, updated_at = NOW() WHERE id = ?`,
        [MessageStatus.SENDING, item.messageId],
      );

      await query(
        `UPDATE message_queue SET status = 'PROCESSING', processed_at = NOW() WHERE id = ?`,
        [item.id],
      );

      const result = await whatsappClientManager.sendMessage(
        item.deviceId,
        message.to_number,
        message.message,
        item.messageId,
        message.media_url || undefined,
      );

      if (result.success) {
        await this.markCompleted(item);
      } else {
        await this.handleFailure(item, result.error || "Unknown error");
      }
    } catch (error: any) {
      await this.handleFailure(item, error.message);
    } finally {
      this.activeProcessing.delete(item.id);
    }
  }

  private async markCompleted(item: QueueItem): Promise<void> {
    await transaction(async (conn) => {
      await conn.execute(
        `UPDATE message_queue SET status = 'COMPLETED', processed_at = NOW() WHERE id = ?`,
        [item.id],
      );
    });

    await this.removeFromQueue(item.id);
    this.emit("message_completed", { messageId: item.messageId });
  }

  private async handleFailure(item: QueueItem, error: string): Promise<void> {
    item.retries++;
    item.lastError = error;

    if (item.retries >= this.maxRetries) {
      await transaction(async (conn) => {
        await conn.execute(
          `UPDATE messages SET status = ?, error_message = ?, updated_at = NOW() WHERE id = ?`,
          [MessageStatus.FAILED, error, item.messageId],
        );

        await conn.execute(
          `UPDATE message_queue SET status = 'FAILED', processed_at = NOW() WHERE id = ?`,
          [item.id],
        );
      });

      await this.removeFromQueue(item.id);
      this.emit("message_failed", { messageId: item.messageId, error });
    } else {
      const backoffDelay = this.retryDelay * Math.pow(2, item.retries - 1);
      item.scheduledAt = new Date(Date.now() + backoffDelay);

      await transaction(async (conn) => {
        await conn.execute(
          `UPDATE messages SET status = ?, retry_count = ?, error_message = ?, updated_at = NOW() WHERE id = ?`,
          [MessageStatus.QUEUED, item.retries, error, item.messageId],
        );

        await conn.execute(
          `UPDATE message_queue SET status = 'PENDING', scheduled_at = ? WHERE id = ?`,
          [item.scheduledAt, item.id],
        );
      });

      this.sortQueue();
      this.emit("message_retry_scheduled", {
        messageId: item.messageId,
        attempt: item.retries,
        nextAttempt: item.scheduledAt,
      });
    }
  }

  private async removeFromQueue(queueId: string): Promise<void> {
    this.queue = this.queue.filter((item) => item.id !== queueId);
  }

  getStatus(): QueueMetrics {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      pendingMessages: this.queue.filter((i) => i.scheduledAt <= new Date())
        .length,
      completedToday: 0,
      failedToday: 0,
    };
  }

  async getDetailedMetrics(): Promise<
    QueueMetrics & { avgProcessingTime: number }
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [completed, failed]: any[] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) as count FROM message_queue 
         WHERE status = 'COMPLETED' AND processed_at >= ?`,
        [today],
      ),
      queryOne(
        `SELECT COUNT(*) as count FROM message_queue 
         WHERE status = 'FAILED' AND processed_at >= ?`,
        [today],
      ),
    ]);

    return {
      ...this.getStatus(),
      completedToday: completed?.count || 0,
      failedToday: failed?.count || 0,
      avgProcessingTime: 0,
    };
  }

  async cleanupOldRecords(days: number = 7): Promise<number> {
    const result: any = await query(
      `DELETE FROM message_queue 
       WHERE status IN ('COMPLETED', 'FAILED') 
       AND processed_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    return result.affectedRows || 0;
  }
}

export const messageQueue = globalForQueue.messageQueue || new MessageQueue();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.messageQueue = messageQueue;
}
