// src/lib/whatsapp/client-manager.ts
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import { DeviceStatus, MessageStatus } from "@/types/database.types";
import { query } from "@/lib/db";
import { appConfig } from "@/config/app.config";
import * as fs from "fs";

// Singleton Pattern untuk Next.js Hot Reload
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

    // Setup signal handlers only once
    this.setupSignalHandlers();
  }

  private ensureSessionDirectory(): void {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  // --- LOGIC BARU: SIGNAL HANDLERS ---
  private setupSignalHandlers() {
    // Hindari duplikasi listener saat hot reload
    if (process.env.NODE_ENV === "production") {
      const handleShutdown = async (signal: string) => {
        console.log(`${signal} received, disconnecting all clients...`);
        await this.disconnectAllClients();
        process.exit(0);
      };

      // Pastikan tidak menumpuk listener
      process.removeAllListeners("SIGTERM");
      process.removeAllListeners("SIGINT");

      process.on("SIGTERM", () => handleShutdown("SIGTERM"));
      process.on("SIGINT", () => handleShutdown("SIGINT"));
    }
  }

  async initializeClient(deviceId: string, phoneNumber: string): Promise<void> {
    if (this.initializationLocks.has(deviceId)) {
      console.log(`Waiting for existing initialization for device ${deviceId}`);
      await this.initializationLocks.get(deviceId);
      return;
    }

    if (this.clients.has(deviceId)) {
      const existing = this.clients.get(deviceId);
      // Jika sudah ready, jangan init ulang
      if (existing?.client && existing.status === DeviceStatus.AUTHENTICATED) {
        console.log(
          `Client already initialized and ready for device ${deviceId}`,
        );
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
    console.log(`Initializing client for device ${deviceId}`);

    // CONFIGURASI PUPPETEER KHUSUS DOCKER & VPS
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
      // PENTING: Gunakan cache remote agar tidak perlu download ulang saat update WA Web
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
      // Tingkatkan timeout menjadi 2 menit untuk koneksi lambat
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
      // Jangan throw error di sini agar loop init tidak mematikan server
    }
  }

  private setupClientEvents(client: Client, deviceId: string): void {
    client.on("qr", async (qr: string) => {
      console.log(`QR Code received for device ${deviceId}`);
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.qrCode = qr;
        instance.status = DeviceStatus.QR_READY;
        instance.lastActivity = new Date();
        await this.updateDeviceStatus(deviceId, DeviceStatus.QR_READY);
      }
    });

    client.on("ready", async () => {
      console.log(`Client is ready for device ${deviceId}`);
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
      console.log(`Client authenticated for device ${deviceId}`);
      await this.updateDeviceStatus(deviceId, DeviceStatus.CONNECTED);
    });

    client.on("disconnected", async (reason: string) => {
      console.log(`Client disconnected for device ${deviceId}:`, reason);
      await this.updateDeviceStatus(deviceId, DeviceStatus.DISCONNECTED, false);
      this.clients.delete(deviceId);
    });

    client.on("message", async (message: Message) => {
      // Update last activity
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

      const rules: any[] = await query(
        `SELECT * FROM auto_response_rules
         WHERE device_id = ? AND is_active = true
         ORDER BY priority DESC`,
        [deviceId],
      );

      for (const rule of rules) {
        const messageBody = message.body.toLowerCase();
        const keyword = rule.keyword.toLowerCase();

        if (messageBody.includes(keyword)) {
          await message.reply(rule.response);
          console.log(`Auto-response sent for device ${deviceId}`);
          break;
        }
      }
    } catch (error) {
      console.error("Error handling incoming message:", error);
    }
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
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const instance = this.clients.get(deviceId);

      if (!instance?.client) {
        return { success: false, error: "Device not initialized" };
      }

      // Allow sending if Authenticated OR Connected (kadang status belum update tapi sudah bisa kirim)
      if (
        instance.status !== DeviceStatus.AUTHENTICATED &&
        instance.status !== DeviceStatus.CONNECTED
      ) {
        return { success: false, error: "Device not authenticated" };
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      // Cek registrasi WA (Opsional, bisa di-skip untuk performa)
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

      await instance.client.sendMessage(formattedNumber, message);

      instance.lastActivity = new Date();

      await query(
        `UPDATE messages
         SET status = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [MessageStatus.SENT, messageId],
      );

      console.log(`Message sent from device ${deviceId} to ${phoneNumber}`);
      return { success: true };
    } catch (error: any) {
      console.error("Error sending message:", error);
      return { success: false, error: error.message };
    }
  }

  // NEW: Method untuk Validasi Nomor
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

    // Fallback jika tidak ada 62/0, asumsi indo (opsional)
    if (!formatted.startsWith("62")) {
      // formatted = "62" + formatted;
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
      console.log(`Client disconnected for device ${deviceId}`);
    }
  }

  async disconnectAllClients(): Promise<void> {
    console.log("Disconnecting all clients...");
    const promises = Array.from(this.clients.keys()).map((deviceId) =>
      this.disconnectClient(deviceId),
    );
    await Promise.all(promises);
  }

  getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }

  private startHealthCheck(): void {
    // Jalankan health check hanya jika belum ada interval (singleton)
    // Di sini kita biarkan setInterval berjalan
    setInterval(
      () => {
        const now = new Date();
        const staleThreshold = 30 * 60 * 1000; // 30 menit idle

        for (const [deviceId, instance] of this.clients.entries()) {
          if (instance.lastActivity) {
            const timeSinceActivity =
              now.getTime() - instance.lastActivity.getTime();

            if (timeSinceActivity > staleThreshold) {
              // Opsional: jangan disconnect otomatis jika ini server utama
              // console.log(`Removing stale client for device ${deviceId}`);
              // this.disconnectClient(deviceId);
            }
          }
        }
      },
      5 * 60 * 1000,
    );
  }
}

// SINGLETON EXPORT
export const whatsappClientManager =
  globalForWhatsapp.whatsappClientManager || new WhatsAppClientManager();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsapp.whatsappClientManager = whatsappClientManager;
}
