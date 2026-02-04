// src/lib/services/settings.service.ts
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface SystemSettings {
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  maxDevicesPerUser?: number;
  maxRetryAttempts?: number;
  retryDelayMs?: number;
  sessionTimeout?: number;
  autoBackupEnabled?: boolean;
  autoBackupInterval?: number;
}

export class SettingsService {
  static async getSystemSettings(): Promise<SystemSettings> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE user_id IS NULL AND setting_key = 'system'",
    );

    if (!settings) {
      return this.getDefaultSettings();
    }

    return JSON.parse(settings.setting_value);
  }

  static async updateSystemSettings(settings: SystemSettings): Promise<void> {
    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE user_id IS NULL AND setting_key = 'system'",
    );

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(settings), existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, NULL, 'system', ?)",
        [id, JSON.stringify(settings)],
      );
    }
  }

  static async getUserSettings(userId: string): Promise<Record<string, any>> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );

    if (!settings) {
      return {};
    }

    return JSON.parse(settings.setting_value);
  }

  static async updateUserSettings(
    userId: string,
    settings: Record<string, any>,
  ): Promise<void> {
    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(settings), existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, ?, 'user_preferences', ?)",
        [id, userId, JSON.stringify(settings)],
      );
    }
  }

  private static getDefaultSettings(): SystemSettings {
    return {
      rateLimitPerMinute: 20,
      rateLimitPerHour: 500,
      maxDevicesPerUser: 10,
      maxRetryAttempts: 3,
      retryDelayMs: 5000,
      sessionTimeout: 2592000,
      autoBackupEnabled: false,
      autoBackupInterval: 86400,
    };
  }
}
