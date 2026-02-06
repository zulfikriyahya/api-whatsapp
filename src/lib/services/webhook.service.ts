import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import { logger } from "./logger.service";
import {
  ValidationError,
  NotFoundError,
  ExternalServiceError,
} from "@/lib/utils/error-handler";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  user_id: string;
  secret: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  duration: number;
}

interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export class WebhookService {
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT_MS = 10000;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000];

  static async createWebhook(data: {
    url: string;
    events: string[];
    user_id: string;
    secret?: string;
    is_active?: boolean;
  }): Promise<Webhook> {
    try {
      new URL(data.url);
    } catch {
      throw new ValidationError("Invalid webhook URL");
    }

    if (!data.events || data.events.length === 0) {
      throw new ValidationError("At least one event must be specified");
    }

    const validEvents = [
      "message.sent",
      "message.delivered",
      "message.read",
      "message.failed",
      "message.received",
      "message.status",
      "device.connected",
      "device.disconnected",
      "device.qr",
    ];

    const invalidEvents = data.events.filter((e) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      throw new ValidationError("Invalid events specified", { invalidEvents });
    }

    const id = uuidv4();
    const secret = data.secret || this.generateSecret();

    await query(
      `INSERT INTO webhooks (id, url, events, user_id, secret, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.url,
        JSON.stringify(data.events),
        data.user_id,
        secret,
        data.is_active !== undefined ? data.is_active : true,
      ],
    );

    const webhook = await queryOne<Webhook>(
      "SELECT * FROM webhooks WHERE id = ?",
      [id],
    );

    if (!webhook) {
      throw new Error("Failed to create webhook");
    }

    return webhook;
  }

  static async getUserWebhooks(userId: string): Promise<Webhook[]> {
    return query<Webhook[]>(
      "SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async getWebhook(id: string): Promise<Webhook | null> {
    return queryOne<Webhook>("SELECT * FROM webhooks WHERE id = ?", [id]);
  }

  static async updateWebhook(
    id: string,
    data: Partial<{
      url: string;
      events: string[];
      secret: string;
      is_active: boolean;
    }>,
  ): Promise<void> {
    if (data.url) {
      try {
        new URL(data.url);
      } catch {
        throw new ValidationError("Invalid webhook URL");
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.url !== undefined) {
      updates.push("url = ?");
      params.push(data.url);
    }

    if (data.events !== undefined) {
      updates.push("events = ?");
      params.push(JSON.stringify(data.events));
    }

    if (data.secret !== undefined) {
      updates.push("secret = ?");
      params.push(data.secret);
    }

    if (data.is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(data.is_active);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE webhooks SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async deleteWebhook(id: string): Promise<void> {
    await query("DELETE FROM webhooks WHERE id = ?", [id]);
  }

  static async triggerWebhook(
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhooks = await this.getActiveWebhooksForEvent(event);

    if (webhooks.length === 0) return;

    const promises = webhooks.map((webhook) =>
      this.deliverWebhook(webhook, event, payload),
    );

    await Promise.allSettled(promises);
  }

  private static async getActiveWebhooksForEvent(
    event: string,
  ): Promise<Webhook[]> {
    return query<Webhook[]>(
      `SELECT * FROM webhooks 
       WHERE is_active = true 
       AND JSON_CONTAINS(events, ?)`,
      [JSON.stringify(event)],
    );
  }

  private static async deliverWebhook(
    webhook: Webhook,
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhookPayload: WebhookPayload = {
      id: uuidv4(),
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const result = await this.sendWebhookRequest(webhook, webhookPayload);

      if (result.success) {
        logger.info("Webhook delivered successfully", {
          webhookId: webhook.id,
          event,
          attempt: attempt + 1,
          duration: result.duration,
        });
        return;
      }

      if (attempt < this.MAX_RETRIES - 1) {
        const delay = this.RETRY_DELAYS[attempt];
        logger.warn("Webhook delivery failed, retrying", {
          webhookId: webhook.id,
          event,
          attempt: attempt + 1,
          nextRetryIn: delay,
          error: result.error,
        });
        await this.sleep(delay);
      } else {
        logger.error("Webhook delivery failed after all retries", {
          webhookId: webhook.id,
          event,
          attempts: this.MAX_RETRIES,
          error: result.error,
        });
      }
    }
  }

  private static async sendWebhookRequest(
    webhook: Webhook,
    payload: WebhookPayload,
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "WA-Dashboard-Webhook/1.0",
        "X-Webhook-Event": payload.event,
        "X-Webhook-Id": payload.id,
        "X-Webhook-Timestamp": payload.timestamp,
      };

      if (webhook.secret) {
        const signature = this.generateSignature(body, webhook.secret);
        headers["X-Webhook-Signature"] = signature;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const duration = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          duration,
        };
      }

      const errorText = await response.text();

      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${errorText}`,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message || "Unknown error",
        duration,
      };
    }
  }

  private static generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret);

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  private static generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
    const webhook = await this.getWebhook(webhookId);

    if (!webhook) {
      throw new NotFoundError("Webhook", webhookId);
    }

    const testPayload: WebhookPayload = {
      id: uuidv4(),
      event: "test.webhook",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook",
      },
    };

    return this.sendWebhookRequest(webhook, testPayload);
  }

  static async getWebhookStats(webhookId: string, days: number = 7) {
    const webhook = await this.getWebhook(webhookId);

    if (!webhook) {
      throw new NotFoundError("Webhook", webhookId);
    }

    return {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      avgResponseTime: 0,
      lastDelivery: null,
    };
  }

  static async disableFailingWebhook(webhookId: string): Promise<void> {
    await this.updateWebhook(webhookId, { is_active: false });

    logger.warn("Webhook disabled due to repeated failures", { webhookId });
  }
}
