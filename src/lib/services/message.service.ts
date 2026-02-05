import { MessageQueries } from "../db/queries/message.queries";
import { DeviceQueries } from "../db/queries/device.queries";
import { messageQueue } from "../whatsapp/message-queue";
import { transaction } from "../db";
import type { CreateMessageDTO } from "@/types/database.types";

export class MessageService {
  static async sendMessage(data: CreateMessageDTO) {
    const device = await DeviceQueries.findById(data.device_id);
    if (!device) throw new Error("Device not found");
    if (device.status !== "AUTHENTICATED" || !device.is_ready) {
      throw new Error("Device not ready");
    }

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
    return transaction(async (conn) => {
      let devices = await DeviceQueries.findWithStats(params.userId);
      devices = devices.filter(
        (d) => d.status === "AUTHENTICATED" && d.is_ready,
      );

      if (devices.length === 0) throw new Error("No active devices found");

      if (params.deviceIds && params.deviceIds.length > 0) {
        devices = devices.filter((d) => params.deviceIds!.includes(d.id));
      }

      if (devices.length === 0)
        throw new Error("Selected devices are not active");

      const messages: CreateMessageDTO[] = [];
      let deviceIndex = 0;

      for (const contact of params.contacts) {
        const device = devices[deviceIndex % devices.length];

        messages.push({
          device_id: device.id,
          user_id: params.userId,
          to_number: contact.phoneNumber,
          message: params.message.replace("{{name}}", contact.name || ""),
        });

        if (params.useRoundRobin !== false) {
          deviceIndex++;
        }
      }

      const created = await MessageQueries.bulkCreate(messages);

      for (const msg of created) {
        await messageQueue.addMessage(msg.id, msg.device_id);
      }

      return { queued: created.length, total: params.contacts.length };
    });
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
