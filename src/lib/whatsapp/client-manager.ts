import { Client, LocalAuth, Message, MessageMedia } from "whatsapp-web.js";
import {
  DeviceStatus,
  MessageStatus,
  MessageDirection,
} from "@/types/database.types";
import { query, queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";
import { WebhookService } from "@/lib/services/webhook.service";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

const globalForWhatsapp = global as unknown as {
  whatsappClientManager: WhatsAppClientManager | undefined;
};

interface WhatsAppClientInstance {
  client: Client;
  deviceId: string;
  status: DeviceStatus;
  qrCode?: string;
  lastActivity: Date;
  healthCheckTimer?: NodeJS.Timeout;
  reconnectTimer?: NodeJS.Timeout;
}

export class WhatsAppClientManager extends EventEmitter {
  private clients: Map<string, WhatsAppClientInstance> = new Map();
  private sessionPath: string;
  private initializationLocks: Map<string, Promise<void>> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private readonly SESSION_TIMEOUT = 1800000;
  private readonly HEALTH_CHECK_INTERVAL = 60000;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    super();
    this.sessionPath = appConfig.whatsapp.sessionPath;
    this.ensureSessionDirectory().catch(console.error);
    this.startCleanupScheduler();
    this.setupSignalHandlers();
  }

  private async ensureSessionDirectory(): Promise<void> {
    try {
      await fs.access(this.sessionPath);
    } catch {
      await fs.mkdir(this.sessionPath, { recursive: true });
    }
  }

  private setupSignalHandlers(): void {
    const handleShutdown = async (signal: string) => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      console.log(`[WA] Received ${signal}, gracefully shutting down...`);

      if (this.cleanupTimer) {
        clearTimeout(this.cleanupTimer);
      }

      await this.disconnectAllClients();
      process.exit(0);
    };

    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGINT");

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  }

  private startCleanupScheduler(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleClients().catch(console.error);
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async cleanupStaleClients(): Promise<void> {
    const now = Date.now();
    const staleThreshold = this.SESSION_TIMEOUT;

    for (const [deviceId, instance] of this.clients.entries()) {
      const inactiveDuration = now - instance.lastActivity.getTime();

      if (inactiveDuration > staleThreshold) {
        console.log(`[WA] Cleaning up stale client: ${deviceId}`);
        await this.disconnectClient(deviceId);
      }
    }
  }

  async postStatus(
    deviceId: string,
    text: string,
    mediaPath?: string,
  ): Promise<void> {
    const instance = this.clients.get(deviceId);

    if (!instance?.client || instance.status !== DeviceStatus.AUTHENTICATED) {
      throw new Error("Device not authenticated");
    }

    try {
      const statusJid = "status@broadcast";

      if (mediaPath) {
        const absolutePath = path.join(process.cwd(), "public", mediaPath);

        try {
          await fs.access(absolutePath);
        } catch {
          throw new Error("Media file not found");
        }

        const media = MessageMedia.fromFilePath(absolutePath);
        await instance.client.sendMessage(statusJid, media, {
          caption: text || "",
        });
      } else if (text) {
        await instance.client.sendMessage(statusJid, text, {
          backgroundColor: "#3b82f6",
          font: 1,
        });
      } else {
        throw new Error("Content required");
      }

      instance.lastActivity = new Date();
      this.emit("status_posted", { deviceId, text, mediaPath });
    } catch (error: any) {
      console.error(`[WA] Status post failed for ${deviceId}:`, error);
      throw new Error(`Failed to post status: ${error.message}`);
    }
  }

  async initializeClient(deviceId: string, phoneNumber: string): Promise<void> {
    const existingLock = this.initializationLocks.get(deviceId);
    if (existingLock) {
      return existingLock;
    }

    const existing = this.clients.get(deviceId);
    if (existing?.status === DeviceStatus.AUTHENTICATED) {
      return;
    }

    const initPromise = this._doInitialize(deviceId, phoneNumber);
    this.initializationLocks.set(deviceId, initPromise);

    try {
      await initPromise;
    } finally {
      this.initializationLocks.delete(deviceId);
    }
  }

  private async _doInitialize(
    deviceId: string,
    _phoneNumber: string,
  ): Promise<void> {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: deviceId,
        dataPath: this.sessionPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-software-rasterizer",
        ],
        timeout: 60000,
      },
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },
    });

    this.clients.set(deviceId, {
      client,
      deviceId,
      status: DeviceStatus.CONNECTING,
      lastActivity: new Date(),
    });

    this.setupClientEvents(client, deviceId);

    try {
      await Promise.race([
        client.initialize(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Initialization timeout")), 120000),
        ),
      ]);

      await this.updateDeviceStatus(deviceId, DeviceStatus.CONNECTING);
      this.emit("client_initialized", { deviceId });
    } catch (error) {
      console.error(`[WA] Init failed for ${deviceId}:`, error);
      await this.updateDeviceStatus(deviceId, DeviceStatus.ERROR);
      this.clients.delete(deviceId);
      this.emit("client_error", { deviceId, error });
      throw error;
    }
  }

  private setupClientEvents(client: Client, deviceId: string): void {
    client.on("qr", async (qr: string) => {
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.qrCode = qr;
        instance.status = DeviceStatus.QR_READY;
        instance.lastActivity = new Date();
        await this.updateDeviceStatus(deviceId, DeviceStatus.QR_READY);
        this.emit("qr_code", { deviceId, qr });
      }
    });

    client.on("ready", async () => {
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.status = DeviceStatus.AUTHENTICATED;
        instance.qrCode = undefined;
        instance.lastActivity = new Date();
        await this.updateDeviceStatus(
          deviceId,
          DeviceStatus.AUTHENTICATED,
          true,
        );
        this.emit("client_ready", { deviceId });
      }
    });

    client.on("authenticated", async () => {
      await this.updateDeviceStatus(deviceId, DeviceStatus.CONNECTED);
      this.emit("client_authenticated", { deviceId });
    });

    client.on("disconnected", async (reason) => {
      console.log(`[WA] Client ${deviceId} disconnected:`, reason);
      await this.cleanupClient(deviceId);
      this.emit("client_disconnected", { deviceId, reason });
    });

    client.on("message_ack", async (msg, ack) => {
      const statusMap: Record<number, MessageStatus> = {
        1: MessageStatus.SENT,
        2: MessageStatus.DELIVERED,
        3: MessageStatus.READ,
      };

      const status = statusMap[ack] || MessageStatus.SENT;

      WebhookService.triggerWebhook("message.status", {
        deviceId,
        status,
        ackRaw: ack,
        timestamp: new Date(),
      }).catch(console.error);
    });

    client.on("message", async (message: Message) => {
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.lastActivity = new Date();
      }
      await this.handleIncomingMessage(deviceId, message);
    });
  }

  private async handleIncomingMessage(
    deviceId: string,
    message: Message,
  ): Promise<void> {
    if (message.fromMe) return;

    try {
      const device = await this.getDeviceUserId(deviceId);
      if (!device) return;

      const fromNumber = message.from.replace("@c.us", "");
      const messageBody = message.body;
      const messageId = uuidv4();

      await query(
        `INSERT INTO messages 
        (id, device_id, user_id, from_number, to_number, message, direction, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          deviceId,
          device.user_id,
          fromNumber,
          device.phone_number,
          messageBody,
          MessageDirection.INBOUND,
          MessageStatus.DELIVERED,
        ],
      );

      this.emit("message_received", {
        deviceId,
        messageId,
        fromNumber,
        messageBody,
      });

      await WebhookService.triggerWebhook("message.received", {
        messageId,
        deviceId,
        from: fromNumber,
        message: messageBody,
        timestamp: new Date(),
      });

      await this.processAutoResponse(
        deviceId,
        device.user_id,
        fromNumber,
        messageBody,
        message,
      );
    } catch (error) {
      console.error("[WA] Error handling incoming message:", error);
      this.emit("message_error", { deviceId, error });
    }
  }

  private async processAutoResponse(
    deviceId: string,
    userId: string,
    fromNumber: string,
    messageBody: string,
    message: Message,
  ): Promise<void> {
    const rules: any[] = await query(
      `SELECT * FROM auto_response_rules
       WHERE device_id = ? AND is_active = true
       ORDER BY priority DESC`,
      [deviceId],
    );

    for (const rule of rules) {
      if (messageBody.toLowerCase().includes(rule.keyword.toLowerCase())) {
        await message.reply(rule.response);

        const replyId = uuidv4();
        await query(
          `INSERT INTO messages 
          (id, device_id, user_id, to_number, message, direction, status, sent_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            replyId,
            deviceId,
            userId,
            fromNumber,
            rule.response,
            MessageDirection.OUTBOUND,
            MessageStatus.SENT,
          ],
        );

        this.emit("auto_response_sent", {
          deviceId,
          fromNumber,
          ruleId: rule.id,
        });
        break;
      }
    }
  }

  private async getDeviceUserId(
    deviceId: string,
  ): Promise<{ user_id: string; phone_number: string } | null> {
    return queryOne("SELECT user_id, phone_number FROM devices WHERE id = ?", [
      deviceId,
    ]);
  }

  private async updateDeviceStatus(
    deviceId: string,
    status: DeviceStatus,
    isReady: boolean = false,
  ): Promise<void> {
    await query(
      `UPDATE devices
       SET status = ?, is_ready = ?, last_seen = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [status, isReady, deviceId],
    );
  }

  async sendMessage(
    deviceId: string,
    phoneNumber: string,
    message: string,
    messageId: string,
    mediaPath?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const instance = this.clients.get(deviceId);

    if (!instance?.client) {
      return { success: false, error: "Device not initialized" };
    }

    if (
      instance.status !== DeviceStatus.AUTHENTICATED &&
      instance.status !== DeviceStatus.CONNECTED
    ) {
      return { success: false, error: "Device not authenticated" };
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const isRegistered =
        await instance.client.isRegisteredUser(formattedNumber);
      if (!isRegistered) {
        return {
          success: false,
          error: "Phone number not registered on WhatsApp",
        };
      }

      if (mediaPath) {
        const absolutePath = path.join(process.cwd(), "public", mediaPath);

        try {
          await fs.access(absolutePath);
        } catch {
          return { success: false, error: "Media file not found" };
        }

        const media = MessageMedia.fromFilePath(absolutePath);
        await instance.client.sendMessage(formattedNumber, media, {
          caption: message || "",
        });
      } else {
        if (!message) {
          return { success: false, error: "Message content required" };
        }
        await instance.client.sendMessage(formattedNumber, message);
      }

      instance.lastActivity = new Date();

      await query(
        `UPDATE messages
         SET status = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [MessageStatus.SENT, messageId],
      );

      this.emit("message_sent", { deviceId, messageId, phoneNumber });
      return { success: true };
    } catch (error: any) {
      console.error("[WA] Send message failed:", error);
      this.emit("message_send_error", { deviceId, messageId, error });
      return { success: false, error: error.message };
    }
  }

  async checkNumber(
    deviceId: string,
    phoneNumber: string,
  ): Promise<{
    registered: boolean;
    formattedNumber?: string;
    error?: string;
  }> {
    const instance = this.clients.get(deviceId);

    if (!instance?.client || instance.status !== DeviceStatus.AUTHENTICATED) {
      return { registered: false, error: "Device not ready" };
    }

    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      const isRegistered = await instance.client.isRegisteredUser(formatted);

      return {
        registered: isRegistered,
        formattedNumber: formatted.replace("@c.us", ""),
      };
    } catch (error: any) {
      return { registered: false, error: error.message };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let formatted = phoneNumber.replace(/\D/g, "");

    if (!formatted.startsWith("62") && formatted.startsWith("0")) {
      formatted = "62" + formatted.substring(1);
    }

    if (!formatted.endsWith("@c.us")) {
      formatted = `${formatted}@c.us`;
    }

    return formatted;
  }

  getQRCode(deviceId: string): string | undefined {
    return this.clients.get(deviceId)?.qrCode;
  }

  getClientStatus(deviceId: string): DeviceStatus | undefined {
    return this.clients.get(deviceId)?.status;
  }

  isClientReady(deviceId: string): boolean {
    const instance = this.clients.get(deviceId);
    return instance?.status === DeviceStatus.AUTHENTICATED;
  }

  async disconnectClient(deviceId: string): Promise<void> {
    await this.cleanupClient(deviceId);
  }

  private async cleanupClient(deviceId: string): Promise<void> {
    const instance = this.clients.get(deviceId);

    if (!instance) return;

    if (instance.healthCheckTimer) {
      clearTimeout(instance.healthCheckTimer);
    }

    if (instance.reconnectTimer) {
      clearTimeout(instance.reconnectTimer);
    }

    if (instance.client) {
      try {
        instance.client.removeAllListeners();
        await instance.client.destroy();
      } catch (error) {
        console.error(`[WA] Error destroying client ${deviceId}:`, error);
      }
    }

    this.clients.delete(deviceId);
    await this.updateDeviceStatus(deviceId, DeviceStatus.DISCONNECTED, false);
  }

  async disconnectAllClients(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((deviceId) =>
      this.cleanupClient(deviceId),
    );

    await Promise.allSettled(promises);
  }

  getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }

  getClientMetrics() {
    return {
      totalClients: this.clients.size,
      activeClients: Array.from(this.clients.values()).filter(
        (c) => c.status === DeviceStatus.AUTHENTICATED,
      ).length,
      connectingClients: Array.from(this.clients.values()).filter(
        (c) => c.status === DeviceStatus.CONNECTING,
      ).length,
    };
  }
}

export const whatsappClientManager =
  globalForWhatsapp.whatsappClientManager || new WhatsAppClientManager();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsapp.whatsappClientManager = whatsappClientManager;
}
