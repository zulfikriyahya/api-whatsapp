import { Client, LocalAuth } from "whatsapp-web.js";
import {
  DeviceStatus,
  MessageDirection,
  MessageStatus,
} from "@/types/database.types";
import { SecureQueryBuilder } from "@/lib/db/secure-query";
import { structuredLogger } from "@/lib/logging/structured-logger";
import { EventEmitter } from "events";

interface ClientInstance {
  client: Client;
  deviceId: string;
  status: DeviceStatus;
  qrCode?: string;
  lastActivity: Date;
  healthCheckTimer?: NodeJS.Timeout;
  qrExpiresAt?: Date;
  reconnectAttempts: number;
}

export class WhatsAppClientManagerV2 extends EventEmitter {
  private clients: Map<string, ClientInstance> = new Map();
  private readonly MAX_CLIENTS = 50;
  private readonly QR_EXPIRATION_MS = 45000;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly HEALTH_CHECK_INTERVAL = 30000;
  private cleanupInterval: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor() {
    super();
    this.setMaxListeners(100);

    this.cleanupInterval = setInterval(() => {
      this.performCleanup().catch(console.error);
    }, 60000);

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      structuredLogger.info("Shutting down WhatsApp clients", { signal });

      clearInterval(this.cleanupInterval);

      await this.disconnectAll();
      process.exit(0);
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  }

  async initializeClient(deviceId: string, phoneNumber: string): Promise<void> {
    if (this.clients.size >= this.MAX_CLIENTS) {
      throw new Error("Maximum client limit reached");
    }

    const existing = this.clients.get(deviceId);
    if (existing?.status === DeviceStatus.AUTHENTICATED) {
      return;
    }

    if (existing) {
      await this.cleanup(deviceId);
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: deviceId,
        dataPath: "./sessions",
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
    });

    const instance: ClientInstance = {
      client,
      deviceId,
      status: DeviceStatus.CONNECTING,
      lastActivity: new Date(),
      reconnectAttempts: 0,
    };

    this.clients.set(deviceId, instance);
    this.attachEventHandlers(instance);

    try {
      await client.initialize();
      await SecureQueryBuilder.update(
        "devices",
        { status: DeviceStatus.CONNECTING, updated_at: new Date() },
        { id: deviceId },
      );
    } catch (error) {
      structuredLogger.error("Client initialization failed", {
        deviceId,
        error,
      });
      await this.cleanup(deviceId);
      throw error;
    }
  }

  private attachEventHandlers(instance: ClientInstance): void {
    const { client, deviceId } = instance;

    const handlers = {
      qr: (qr: string) => this.handleQR(instance, qr),
      ready: () => this.handleReady(instance),
      authenticated: () => this.handleAuthenticated(instance),
      disconnected: (reason: string) =>
        this.handleDisconnected(instance, reason),
      message: (msg: any) => this.handleMessage(instance, msg),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      client.on(event, handler);
    });

    instance.healthCheckTimer = setInterval(() => {
      this.checkHealth(instance);
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async handleQR(instance: ClientInstance, qr: string): Promise<void> {
    instance.qrCode = qr;
    instance.status = DeviceStatus.QR_READY;
    instance.qrExpiresAt = new Date(Date.now() + this.QR_EXPIRATION_MS);
    instance.lastActivity = new Date();

    await SecureQueryBuilder.update(
      "devices",
      { status: DeviceStatus.QR_READY, updated_at: new Date() },
      { id: instance.deviceId },
    );

    this.emit("qr_code", { deviceId: instance.deviceId, qr });
  }

  private async handleReady(instance: ClientInstance): Promise<void> {
    instance.status = DeviceStatus.AUTHENTICATED;
    instance.qrCode = undefined;
    instance.qrExpiresAt = undefined;
    instance.lastActivity = new Date();
    instance.reconnectAttempts = 0;

    await SecureQueryBuilder.update(
      "devices",
      {
        status: DeviceStatus.AUTHENTICATED,
        is_ready: true,
        last_seen: new Date(),
        updated_at: new Date(),
      },
      { id: instance.deviceId },
    );

    this.emit("client_ready", { deviceId: instance.deviceId });
  }

  private async handleAuthenticated(instance: ClientInstance): Promise<void> {
    instance.lastActivity = new Date();
    await SecureQueryBuilder.update(
      "devices",
      { status: DeviceStatus.CONNECTED, updated_at: new Date() },
      { id: instance.deviceId },
    );
  }

  private async handleDisconnected(
    instance: ClientInstance,
    reason: string,
  ): Promise<void> {
    structuredLogger.warn("Client disconnected", {
      deviceId: instance.deviceId,
      reason,
    });

    if (
      instance.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS &&
      !this.isShuttingDown
    ) {
      instance.reconnectAttempts++;

      setTimeout(() => {
        this.initializeClient(instance.deviceId, "").catch(console.error);
      }, 5000 * instance.reconnectAttempts);
    } else {
      await this.cleanup(instance.deviceId);
    }
  }

  private async handleMessage(
    instance: ClientInstance,
    message: any,
  ): Promise<void> {
    if (message.fromMe) return;

    instance.lastActivity = new Date();

    try {
      const device = await SecureQueryBuilder.selectOne<any>({
        table: "devices",
        where: { id: instance.deviceId },
        select: ["user_id", "phone_number"],
      });

      if (!device) return;

      await SecureQueryBuilder.insert("messages", {
        id: require("uuid").v4(),
        device_id: instance.deviceId,
        user_id: device.user_id,
        from_number: message.from.replace("@c.us", ""),
        to_number: device.phone_number,
        message: message.body,
        direction: MessageDirection.INBOUND,
        status: MessageStatus.DELIVERED,
        created_at: new Date(),
      });

      this.emit("message_received", {
        deviceId: instance.deviceId,
        from: message.from,
        body: message.body,
      });
    } catch (error) {
      structuredLogger.error("Message handling failed", {
        deviceId: instance.deviceId,
        error,
      });
    }
  }

  private async checkHealth(instance: ClientInstance): Promise<void> {
    const inactiveMs = Date.now() - instance.lastActivity.getTime();

    if (inactiveMs > 1800000) {
      structuredLogger.warn("Client inactive, cleaning up", {
        deviceId: instance.deviceId,
      });
      await this.cleanup(instance.deviceId);
    }

    if (instance.qrExpiresAt && Date.now() > instance.qrExpiresAt.getTime()) {
      instance.qrCode = undefined;
      instance.qrExpiresAt = undefined;
    }
  }

  private async performCleanup(): Promise<void> {
    for (const [deviceId, instance] of this.clients.entries()) {
      await this.checkHealth(instance);
    }
  }

  async sendMessage(
    deviceId: string,
    phoneNumber: string,
    message: string,
    messageId: string,
    mediaPath?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const instance = this.clients.get(deviceId);

    if (!instance || instance.status !== DeviceStatus.AUTHENTICATED) {
      return { success: false, error: "Device not ready" };
    }

    try {
      const formatted = phoneNumber.endsWith("@c.us")
        ? phoneNumber
        : `${phoneNumber}@c.us`;

      await instance.client.sendMessage(formatted, message);
      instance.lastActivity = new Date();

      await SecureQueryBuilder.update(
        "messages",
        { status: MessageStatus.SENT, sent_at: new Date() },
        { id: messageId },
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async cleanup(deviceId: string): Promise<void> {
    const instance = this.clients.get(deviceId);
    if (!instance) return;

    if (instance.healthCheckTimer) {
      clearInterval(instance.healthCheckTimer);
    }

    instance.client.removeAllListeners();

    try {
      await instance.client.destroy();
    } catch (error) {
      structuredLogger.error("Error destroying client", { deviceId, error });
    }

    this.clients.delete(deviceId);

    await SecureQueryBuilder.update(
      "devices",
      {
        status: DeviceStatus.DISCONNECTED,
        is_ready: false,
        updated_at: new Date(),
      },
      { id: deviceId },
    );
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((id) =>
      this.cleanup(id),
    );
    await Promise.allSettled(promises);
  }

  getQRCode(deviceId: string): string | undefined {
    return this.clients.get(deviceId)?.qrCode;
  }

  getStatus(deviceId: string): DeviceStatus | undefined {
    return this.clients.get(deviceId)?.status;
  }
}

export const whatsappClientManagerV2 = new WhatsAppClientManagerV2();
