import { MessageQueries } from "../db/queries/message.queries";
import { DeviceQueries } from "../db/queries/device.queries";
import { messageQueue } from "../whatsapp/message-queue";
import type { CreateMessageDTO } from "@/types/database.types";

export class MessageService {
  static async sendMessage(data: CreateMessageDTO) {
    const device = await DeviceQueries.findById(data.device_id);
    if (!device) throw new Error("Device not found");

    const message = await MessageQueries.create(data);
    await messageQueue.addMessage(message.id, data.device_id);

    return message;
  }

  static async sendBulkMessages(params: {
    userId: string;
    contacts: Array<{ phoneNumber: string; name?: string }>;
    message: string;
    deviceIds?: string[];
    useRoundRobin?: boolean;
  }) {
    let devices = await DeviceQueries.findWithStats(params.userId);
    devices = devices.filter((d) => d.status === "AUTHENTICATED" && d.is_ready);

    if (devices.length === 0) throw new Error("No active devices found");

    if (params.deviceIds && params.deviceIds.length > 0) {
      devices = devices.filter((d) => params.deviceIds!.includes(d.id));
    }

    if (devices.length === 0)
      throw new Error("Selected devices are not active");

    const results = [];
    let deviceIndex = 0;

    for (const contact of params.contacts) {
      // Round Robin Logic
      const device = devices[deviceIndex % devices.length];

      const msg = await this.sendMessage({
        device_id: device.id,
        user_id: params.userId,
        to_number: contact.phoneNumber,
        message: params.message.replace("{{name}}", contact.name || ""),
      });

      results.push(msg);

      // Only increment index if Round Robin is enabled, otherwise use first device
      if (params.useRoundRobin !== false) {
        deviceIndex++;
      }
    }

    return { queued: results.length, total: params.contacts.length };
  }

  static async getUserStats(userId: string) {
    const stats = await MessageQueries.getStatsByUserId(userId);

    const successRate =
      stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    return {
      ...stats,
      successRate,
    };
  }

  static async getMessageStats(params: {
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const stats = await MessageQueries.getDetailedStats(params);

    const successRate =
      stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    return {
      ...stats,
      successRate,
    };
  }

  static async getHourlyStats(deviceId?: string, hours: number = 24) {
    return MessageQueries.getHourlyStats(deviceId, hours);
  }
}
