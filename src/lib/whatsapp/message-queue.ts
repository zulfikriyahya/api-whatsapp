import { query, queryOne } from "../db";
import { whatsappClientManager } from "./client-manager";
import { MessageStatus } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

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
}

class MessageQueue {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly maxConcurrent = 3;
  private readonly retryDelay = parseInt(process.env.RETRY_DELAY_MS || "5000");
  private readonly maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || "3");

  constructor() {
    this.loadPendingMessages();
    this.startProcessing();
    this.setupSignalHandlers();
  }

  async loadPendingMessages() {
    try {
      const pending: any[] = await query(
        `SELECT * FROM message_queue WHERE status = 'PENDING' ORDER BY priority DESC, scheduled_at ASC`,
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
      console.log(`Loaded ${pending.length} pending messages into queue`);
    } catch (error) {
      console.error("Failed to load pending messages:", error);
    }
  }

  private setupSignalHandlers() {
    if (process.env.NODE_ENV === "production") {
      const cleanup = () => {
        this.stopProcessing();
      };
      process.on("SIGTERM", cleanup);
      process.on("SIGINT", cleanup);
    }
  }

  async addMessage(
    messageId: string,
    deviceId: string,
    priority: number = 0,
    scheduledAt: Date = new Date(),
  ) {
    const queueId = uuidv4();
    await query(
      `INSERT INTO message_queue (id, message_id, device_id, priority, scheduled_at, status) VALUES (?, ?, ?, ?, ?, 'PENDING')`,
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
    this.queue.sort(
      (a, b) =>
        b.priority - a.priority ||
        a.scheduledAt.getTime() - b.scheduledAt.getTime(),
    );
  }

  private startProcessing() {
    if (this.processingInterval) return;
    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.queue.length > 0) await this.processQueue();
    }, 1000);
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;
    try {
      const now = new Date();
      const readyMessages = this.queue.filter(
        (item) => item.scheduledAt <= now,
      );
      if (readyMessages.length === 0) {
        this.processing = false;
        return;
      }
      const batch = readyMessages.slice(0, this.maxConcurrent);
      await Promise.all(batch.map((item) => this.processMessage(item)));
    } catch (error) {
      console.error("Error processing queue:", error);
    } finally {
      this.processing = false;
    }
  }

  private async processMessage(item: QueueItem) {
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
        await this.removeFromQueue(item.id);
        await query(
          `UPDATE message_queue SET status = 'COMPLETED' WHERE id = ?`,
          [item.id],
        );
      } else {
        await this.handleFailure(item, result.error || "Unknown error");
      }
    } catch (error: any) {
      await this.handleFailure(item, error.message);
    }
  }

  private async handleFailure(item: QueueItem, error: string) {
    item.retries++;
    if (item.retries >= this.maxRetries) {
      await query(
        `UPDATE messages SET status = ?, error_message = ?, updated_at = NOW() WHERE id = ?`,
        [MessageStatus.FAILED, error, item.messageId],
      );
      await query(`UPDATE message_queue SET status = 'FAILED' WHERE id = ?`, [
        item.id,
      ]);
      await this.removeFromQueue(item.id);
    } else {
      item.scheduledAt = new Date(Date.now() + this.retryDelay * item.retries);
      await query(
        `UPDATE messages SET status = ?, retry_count = ?, error_message = ?, updated_at = NOW() WHERE id = ?`,
        [MessageStatus.QUEUED, item.retries, error, item.messageId],
      );
      await query(
        `UPDATE message_queue SET status = 'PENDING', scheduled_at = ? WHERE id = ?`,
        [item.scheduledAt, item.id],
      );
    }
  }

  private async removeFromQueue(queueId: string) {
    this.queue = this.queue.filter((item) => item.id !== queueId);
  }

  async loadPendingMessages() {
    const pending: any[] = await query(
      `SELECT * FROM message_queue WHERE status = 'PENDING' ORDER BY priority DESC, scheduled_at ASC`,
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
  }

  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      pendingMessages: this.queue.filter((i) => i.scheduledAt <= new Date())
        .length,
    };
  }
}

export const messageQueue = globalForQueue.messageQueue || new MessageQueue();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.messageQueue = messageQueue;
}

if (globalForQueue.messageQueue === undefined) {
  messageQueue.loadPendingMessages();
}
