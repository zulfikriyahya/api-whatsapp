import { DeviceQueries } from "../db/queries/device.queries";
import { whatsappClientManager } from "../whatsapp/client-manager";
import { DeviceStatus, CreateDeviceDTO } from "@/types/database.types";

export class DeviceService {
  static async createDevice(data: CreateDeviceDTO) {
    const count = await DeviceQueries.countByUser(data.user_id);
    if (count >= 10) throw new Error("Maximum device limit reached");

    const device = await DeviceQueries.create(data);

    whatsappClientManager
      .initializeClient(device.id, device.phone_number)
      .catch((err) =>
        console.error(`[DeviceService] Init failed for ${device.id}`, err),
      );

    return device;
  }

  static async getDevice(id: string) {
    return DeviceQueries.findById(id);
  }

  static async getUserDevices(userId: string) {
    return DeviceQueries.findWithStats(userId);
  }

  static async getQRCode(deviceId: string) {
    const qrCode = whatsappClientManager.getQRCode(deviceId);
    const status =
      whatsappClientManager.getClientStatus(deviceId) ||
      DeviceStatus.DISCONNECTED;
    return { qrCode, status };
  }

  static async deleteDevice(deviceId: string) {
    await whatsappClientManager.disconnectClient(deviceId);
    await DeviceQueries.delete(deviceId);
  }

  static async reconnectDevice(deviceId: string) {
    const device = await DeviceQueries.findById(deviceId);
    if (!device) throw new Error("Device not found");

    await whatsappClientManager.disconnectClient(deviceId);
    setTimeout(() => {
      whatsappClientManager.initializeClient(device.id, device.phone_number);
    }, 1000);
  }
}
