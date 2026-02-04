// src/lib/services/message.service.ts
import { MessageQueries } from "../db/queries/message.queries";
import { DeviceQueries } from "../db/queries/device.queries";
// import { whatsappClientManager } from "../whatsapp/client-manager";
import { messageQueue } from "../whatsapp/message-queue";
import type { Message, CreateMessageDTO } from "@/types/database.types";
import { MessageStatus } from "@/types/database.types";

export class MessageService {
  /**
   * Send a single message
   */
  static async sendMessage(data: CreateMessageDTO): Promise<Message> {
    // Validate device
    const device = await DeviceQueries.findById(data.device_id);
    if (!device) {
      throw new Error("Device not found");
    }

    if (!device.is_ready || device.status !== "AUTHENTICATED") {
      throw new Error("Device is not ready to send messages");
    }

    // Create message record
    const message = await MessageQueries.create(data);

    // Add to queue
    await messageQueue.addMessage(message.id, data.device_id);

    return message;
  }

  /**
   * Send bulk messages with optional round-robin
   */
  static async sendBulkMessages(params: {
    userId: string;
    contacts: Array<{ phoneNumber: string; name?: string }>;
    message: string;
    deviceIds?: string[];
    useRoundRobin?: boolean;
  }): Promise<{
    queued: number;
    failed: number;
    messages: Message[];
  }> {
    const {
      userId,
      contacts,
      message,
      deviceIds,
      useRoundRobin = true,
    } = params;

    // Get available devices
    let devices = deviceIds
      ? await Promise.all(deviceIds.map((id) => DeviceQueries.findById(id)))
      : await DeviceQueries.findByUserId(userId);

    devices = devices.filter(
      (d): d is NonNullable<typeof d> =>
        d !== null && d.is_ready && d.status === "AUTHENTICATED",
    );

    if (devices.length === 0) {
      throw new Error("No active devices available");
    }

    const results: Message[] = [];
    let failed = 0;
    let deviceIndex = 0;

    for (const contact of contacts) {
      try {
        // Select device (round-robin or first available)
        // FIX: Added '!' to assert that devices exist because we checked devices.length > 0 above
        const device = useRoundRobin
          ? devices[deviceIndex % devices.length]!
          : devices[0]!;

        // Create and queue message
        const msg = await MessageQueries.create({
          device_id: device.id,
          user_id: userId,
          to_number: contact.phoneNumber,
          message,
        });

        await messageQueue.addMessage(msg.id, device.id);
        results.push(msg);

        if (useRoundRobin) {
          deviceIndex++;
        }
      } catch (error) {
        console.error("Failed to queue message:", error);
        failed++;
      }
    }

    return {
      queued: results.length,
      failed,
      messages: results,
    };
  }

  /**
   * Get message by ID
   */
  static async getMessage(id: string): Promise<Message | null> {
    return MessageQueries.findById(id);
  }

  /**
   * Get messages for a device
   */
  static async getDeviceMessages(
    deviceId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Message[]> {
    return MessageQueries.findByDeviceId(deviceId, params);
  }

  /**
   * Update message status
   */
  static async updateMessageStatus(
    id: string,
    status: MessageStatus,
    errorMessage?: string,
  ): Promise<void> {
    await MessageQueries.updateStatus(id, status, errorMessage);
  }

  /**
   * Retry failed message
   */
  static async retryMessage(id: string): Promise<void> {
    const message = await MessageQueries.findById(id);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.status !== MessageStatus.FAILED) {
      throw new Error("Only failed messages can be retried");
    }

    const maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || "3");
    if (message.retry_count >= maxRetries) {
      throw new Error("Maximum retry attempts reached");
    }

    // Increment retry count
    await MessageQueries.incrementRetry(id);

    // Update status to pending
    await MessageQueries.updateStatus(id, MessageStatus.PENDING);

    // Add back to queue
    await messageQueue.addMessage(id, message.device_id);
  }

  /**
   * Get message statistics
   */
  static async getMessageStats(params?: {
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    successRate: number;
  }> {
    const stats = params?.deviceId
      ? await MessageQueries.getStatsByDevice(
          params.deviceId,
          params?.startDate,
          params?.endDate,
        )
      : await MessageQueries.getTodayStats();

    const successRate =
      stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    // Hitung pending berdasarkan sisa
    const pending = stats.total - (stats.sent + stats.failed);

    return {
      ...stats,
      pending, // Tambahkan properti ini
      successRate,
    };
  }

  /**
   * Get hourly message statistics
   */
  static async getHourlyStats(
    deviceId?: string,
    hours: number = 24,
  ): Promise<Array<{ hour: string; count: number }>> {
    return MessageQueries.getHourlyStats(deviceId, hours);
  }

  /**
   * Process pending messages (called by queue worker)
   */
  static async processPendingMessages(): Promise<void> {
    const messages = await MessageQueries.findPending(100);

    for (const message of messages) {
      await messageQueue.addMessage(message.id, message.device_id);
    }
  }

  /**
   * Clean up old messages
   */
  static async cleanupOldMessages(days: number = 30): Promise<number> {
    return MessageQueries.deleteOld(days);
  }
}
