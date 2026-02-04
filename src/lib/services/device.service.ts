// src/lib/services/device.service.ts
import { DeviceQueries } from "../db/queries/device.queries";
import { whatsappClientManager } from "../whatsapp/client-manager";
import type {
  Device,
  CreateDeviceDTO,
  DeviceViewModel,
} from "@/types/database.types";
import { DeviceStatus } from "@/types/database.types";

export class DeviceService {
  /**
   * Get device by ID with full details
   */
  static async getDevice(id: string): Promise<Device | null> {
    return DeviceQueries.findById(id);
  }

  /**
   * Get all devices for a user with stats
   */
  static async getUserDevices(userId: string): Promise<DeviceViewModel[]> {
    return DeviceQueries.findWithStats(userId);
  }

  /**
   * Create a new device and initialize WhatsApp client
   */
  static async createDevice(data: CreateDeviceDTO): Promise<Device> {
    // Check if phone number already exists
    const existing = await DeviceQueries.findByPhoneNumber(data.phone_number);
    if (existing) {
      throw new Error("Phone number already registered");
    }

    // Check device limit
    const count = await DeviceQueries.countByUser(data.user_id);
    const maxDevices = parseInt(process.env.MAX_DEVICES_PER_USER || "10");
    if (count >= maxDevices) {
      throw new Error(`Maximum ${maxDevices} devices per user`);
    }

    // Create device in database
    const device = await DeviceQueries.create(data);

    // Initialize WhatsApp client
    try {
      await whatsappClientManager.initializeClient(
        device.id,
        device.phone_number,
      );
    } catch (error) {
      console.error("Failed to initialize WhatsApp client:", error);
      // Don't throw error, device is created but client initialization failed
      await DeviceQueries.updateStatus(device.id, DeviceStatus.ERROR);
    }

    return device;
  }

  /**
   * Get QR code for device authentication
   */
  static async getQRCode(deviceId: string): Promise<{
    qrCode: string | null;
    status: DeviceStatus;
  }> {
    const device = await DeviceQueries.findById(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    const qrCode = whatsappClientManager.getQRCode(deviceId);
    const status =
      whatsappClientManager.getClientStatus(deviceId) || device.status;

    return { qrCode: qrCode || null, status };
  }

  /**
   * Disconnect and remove device
   */
  static async deleteDevice(deviceId: string): Promise<void> {
    const device = await DeviceQueries.findById(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    // Disconnect WhatsApp client
    await whatsappClientManager.disconnectClient(deviceId);

    // Delete from database (cascade will handle related records)
    await DeviceQueries.delete(deviceId);
  }

  /**
   * Reconnect device
   */
  static async reconnectDevice(deviceId: string): Promise<void> {
    const device = await DeviceQueries.findById(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    // Disconnect existing client
    await whatsappClientManager.disconnectClient(deviceId);

    // Reinitialize
    await whatsappClientManager.initializeClient(
      device.id,
      device.phone_number,
    );
  }

  /**
   * Get device status
   */
  static async getDeviceStatus(deviceId: string): Promise<{
    device: Device;
    clientStatus: DeviceStatus | null;
    isReady: boolean;
  }> {
    const device = await DeviceQueries.findById(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    const clientStatus = whatsappClientManager.getClientStatus(deviceId);
    const isReady = whatsappClientManager.isClientReady(deviceId);

    return {
      device,
      clientStatus: clientStatus || null,
      isReady,
    };
  }

  /**
   * Get all active devices
   */
  static async getActiveDevices(): Promise<Device[]> {
    return DeviceQueries.getActiveDevices();
  }

  /**
   * Update device status
   */
  static async updateDeviceStatus(
    deviceId: string,
    status: DeviceStatus,
    isReady: boolean = false,
  ): Promise<void> {
    await DeviceQueries.updateStatus(deviceId, status, isReady);
  }

  /**
   * Check if device is ready to send messages
   */
  static async isDeviceReady(deviceId: string): Promise<boolean> {
    const device = await DeviceQueries.findById(deviceId);
    if (!device || !device.is_ready) {
      return false;
    }

    return whatsappClientManager.isClientReady(deviceId);
  }
}
