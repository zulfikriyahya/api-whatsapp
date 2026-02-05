import { Client, LocalAuth, Message, MessageMedia } from "whatsapp-web.js";
import {
  DeviceStatus,
  MessageStatus,
  MessageDirection,
} from "@/types/database.types";
import { query, queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";
import { WebhookService } from "@/lib/services/webhook.service";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const globalForWhatsapp = global as unknown as {
  whatsappClientManager: WhatsAppClientManager | undefined;
};

interface WhatsAppClientInstance {
  client: Client;
  deviceId: string;
  status: DeviceStatus;
  qrCode?: string;
  lastActivity?: Date;
}

export class WhatsAppClientManager {
  private clients: Map<string, WhatsAppClientInstance> = new Map();
  private sessionPath: string;
  private initializationLocks: Map<string, Promise<void>> = new Map();

  constructor() {
    this.sessionPath = appConfig.whatsapp.sessionPath;
    this.ensureSessionDirectory();
    this.startHealthCheck();
    this.setupSignalHandlers();
  }

  private ensureSessionDirectory(): void {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  private setupSignalHandlers() {
    if (process.env.NODE_ENV === "production") {
      const handleShutdown = async (signal: string) => {
        console.log(`${signal} received, disconnecting all clients...`);
        await this.disconnectAllClients();
        process.exit(0);
      };

      process.removeAllListeners("SIGTERM");
      process.removeAllListeners("SIGINT");

      process.on("SIGTERM", () => handleShutdown("SIGTERM"));
      process.on("SIGINT", () => handleShutdown("SIGINT"));
    }
  }

  async postStatus(
    deviceId: string,
    text: string,
    mediaPath?: string,
  ): Promise<void> {
    const instance = this.clients.get(deviceId);
    if (!instance?.client || instance.status !== DeviceStatus.AUTHENTICATED) {
      throw new Error("Device not ready");
    }

    try {
      const statusJid = "status@broadcast";

      if (mediaPath) {
        const absolutePath = path.join(process.cwd(), "public", mediaPath);
        if (!fs.existsSync(absolutePath)) {
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
        throw new Error("Content required (text or media)");
      }

      console.log(`[Status] Posted for device ${deviceId}`);
    } catch (error: any) {
      console.error(`[Status] Failed:`, error);
      throw new Error(`Failed to post status: ${error.message}`);
    }
  }

  async initializeClient(deviceId: string, phoneNumber: string): Promise<void> {
    if (this.initializationLocks.has(deviceId)) {
      await this.initializationLocks.get(deviceId);
      return;
    }

    if (this.clients.has(deviceId)) {
      const existing = this.clients.get(deviceId);
      if (existing?.client && existing.status === DeviceStatus.AUTHENTICATED) {
        return;
      }
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
        ],
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
    } catch (error) {
      console.error(
        `Failed to initialize client for device ${deviceId}:`,
        error,
      );
      await this.updateDeviceStatus(deviceId, DeviceStatus.ERROR);
      this.clients.delete(deviceId);
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
      }
    });

    client.on("authenticated", async () => {
      await this.updateDeviceStatus(deviceId, DeviceStatus.CONNECTED);
    });

    client.on("disconnected", async () => {
      await this.updateDeviceStatus(deviceId, DeviceStatus.DISCONNECTED, false);
      this.clients.delete(deviceId);
    });

    client.on("message_ack", async (msg, ack) => {
      let status = MessageStatus.SENT;
      if (ack === 1) status = MessageStatus.SENT;
      if (ack === 2) status = MessageStatus.DELIVERED;
      if (ack === 3) status = MessageStatus.READ;

      WebhookService.triggerWebhook("message.status", {
        deviceId,
        status,
        ackRaw: ack,
        timestamp: new Date(),
      }).catch(console.error);
    });

    client.on("message", async (message: Message) => {
      const instance = this.clients.get(deviceId);
      if (instance) instance.lastActivity = new Date();
      await this.handleIncomingMessage(deviceId, message);
    });
  }

  private async handleIncomingMessage(
    deviceId: string,
    message: Message,
  ): Promise<void> {
    try {
      if (message.fromMe) return;

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

      await WebhookService.triggerWebhook("message.received", {
        messageId,
        deviceId,
        from: fromNumber,
        message: messageBody,
        timestamp: new Date(),
      });

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
              device.user_id,
              fromNumber,
              rule.response,
              MessageDirection.OUTBOUND,
              MessageStatus.SENT,
            ],
          );
          break;
        }
      }
    } catch (error) {
      console.error("Error handling incoming message:", error);
    }
  }

  private async getDeviceUserId(
    deviceId: string,
  ): Promise<{ user_id: string; phone_number: string } | null> {
    const res: any = await queryOne(
      "SELECT user_id, phone_number FROM devices WHERE id = ?",
      [deviceId],
    );
    return res;
  }

  private async updateDeviceStatus(
    deviceId: string,
    status: DeviceStatus,
    isReady: boolean = false,
  ): Promise<void> {
    try {
      await query(
        `UPDATE devices
         SET status = ?, is_ready = ?, last_seen = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [status, isReady, deviceId],
      );
    } catch (error) {
      console.error("Error updating device status:", error);
    }
  }

  async sendMessage(
    deviceId: string,
    phoneNumber: string,
    message: string,
    messageId: string,
    mediaPath?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
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

      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      try {
        const isRegistered =
          await instance.client.isRegisteredUser(formattedNumber);
        if (!isRegistered) {
          return {
            success: false,
            error: "Phone number not registered on WhatsApp",
          };
        }
      } catch (e) {
        console.warn("Skipping registration check due to error/timeout");
      }

      if (mediaPath) {
        const absolutePath = path.join(process.cwd(), "public", mediaPath);

        if (!fs.existsSync(absolutePath)) {
          return {
            success: false,
            error: "File media tidak ditemukan di server",
          };
        }

        const media = MessageMedia.fromFilePath(absolutePath);
        await instance.client.sendMessage(formattedNumber, media, {
          caption: message || "",
        });
      } else {
        if (!message) return { success: false, error: "Pesan kosong" };
        await instance.client.sendMessage(formattedNumber, message);
      }

      instance.lastActivity = new Date();

      await query(
        `UPDATE messages
         SET status = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [MessageStatus.SENT, messageId],
      );

      return { success: true };
    } catch (error: any) {
      console.error("Error sending message:", error);
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
    if (!instance?.client) {
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
      console.error("Error checking number:", error);
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
    const instance = this.clients.get(deviceId);
    if (instance?.client) {
      try {
        await instance.client.destroy();
      } catch (error) {
        console.error(`Error destroying client for device ${deviceId}:`, error);
      }
      this.clients.delete(deviceId);
      await this.updateDeviceStatus(deviceId, DeviceStatus.DISCONNECTED, false);
    }
  }

  async disconnectAllClients(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((deviceId) =>
      this.disconnectClient(deviceId),
    );
    await Promise.all(promises);
  }

  getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }

  private startHealthCheck(): void {
    setInterval(
      () => {
        const now = new Date();
        const staleThreshold = 30 * 60 * 1000;
        for (const [deviceId, instance] of this.clients.entries()) {
          if (instance.lastActivity) {
            const timeSinceActivity =
              now.getTime() - instance.lastActivity.getTime();
            if (timeSinceActivity > staleThreshold) {
              // Log stale clients
            }
          }
        }
      },
      5 * 60 * 1000,
    );
  }
}

export const whatsappClientManager =
  globalForWhatsapp.whatsappClientManager || new WhatsAppClientManager();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsapp.whatsappClientManager = whatsappClientManager;
}
