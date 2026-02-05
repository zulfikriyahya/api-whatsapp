import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

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

export class WebhookService {
  static async createWebhook(data: {
    url: string;
    events: string[];
    user_id: string;
    secret?: string;
    is_active?: boolean;
  }): Promise<Webhook> {
    const id = uuidv4();

    await query(
      `INSERT INTO webhooks (id, url, events, user_id, secret, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.url,
        JSON.stringify(data.events),
        data.user_id,
        data.secret || null,
        data.is_active !== undefined ? data.is_active : true,
      ],
    );

    const webhook = await queryOne<Webhook>(
      "SELECT * FROM webhooks WHERE id = ?",
      [id],
    );
    if (!webhook) throw new Error("Failed to create webhook");
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
    const webhooks = await query<Webhook[]>(
      `SELECT * FROM webhooks 
       WHERE is_active = true 
       AND JSON_CONTAINS(events, ?)`,
      [JSON.stringify(event)],
    );

    if (webhooks.length === 0) return;

    const promises = webhooks.map((webhook) =>
      this.sendWebhookRequest(webhook, event, payload),
    );

    Promise.allSettled(promises);
  }

  private static async sendWebhookRequest(
    webhook: Webhook,
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const bodyData = {
        id: uuidv4(),
        event,
        timestamp,
        data: payload,
      };

      const body = JSON.stringify(bodyData);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "WA-Dashboard-Webhook/1.0",
        "X-Webhook-Event": event,
        "X-Webhook-Timestamp": timestamp,
      };

      if (webhook.secret) {
        const signature = crypto
          .createHmac("sha256", webhook.secret)
          .update(body)
          .digest("hex");
        headers["X-Webhook-Signature"] = signature;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(
          `Webhook ${webhook.id} failed with status ${response.status}`,
        );
      }
    } catch (error) {
      console.error(`Webhook error for ${webhook.url}:`, error);
    }
  }
}
