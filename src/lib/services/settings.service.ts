import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface SystemSettings {
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  maxDevicesPerUser: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  sessionTimeout: number;
  autoBackupEnabled: boolean;
  autoBackupInterval: number;
}

export class SettingsService {
  private static DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    rateLimitPerMinute: 20,
    rateLimitPerHour: 500,
    maxDevicesPerUser: 10,
    maxRetryAttempts: 3,
    retryDelayMs: 5000,
    sessionTimeout: 2592000,
    autoBackupEnabled: false,
    autoBackupInterval: 86400,
  };

  static async getSystemSettings(): Promise<SystemSettings> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE user_id IS NULL AND setting_key = 'system'",
    );

    if (!settings) {
      return this.DEFAULT_SYSTEM_SETTINGS;
    }

    try {
      return {
        ...this.DEFAULT_SYSTEM_SETTINGS,
        ...JSON.parse(settings.setting_value),
      };
    } catch {
      return this.DEFAULT_SYSTEM_SETTINGS;
    }
  }

  static async updateSystemSettings(
    settings: Partial<SystemSettings>,
  ): Promise<void> {
    const current = await this.getSystemSettings();
    const updated = { ...current, ...settings };

    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE user_id IS NULL AND setting_key = 'system'",
    );

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(updated), existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, NULL, 'system', ?)",
        [id, JSON.stringify(updated)],
      );
    }
  }

  static async getUserSettings(userId: string): Promise<Record<string, any>> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );

    if (!settings) return {};

    try {
      return JSON.parse(settings.setting_value);
    } catch {
      return {};
    }
  }

  static async updateUserSettings(
    userId: string,
    settings: Record<string, any>,
  ): Promise<void> {
    const current = await this.getUserSettings(userId);
    const updated = { ...current, ...settings };

    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(updated), existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, ?, 'user_preferences', ?)",
        [id, userId, JSON.stringify(updated)],
      );
    }
  }

  static async deleteUserSettings(userId: string): Promise<void> {
    await query(
      "DELETE FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );
  }

  static async getSetting(key: string, userId?: string): Promise<any | null> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = ? AND user_id = ?",
      [key, userId || null],
    );

    if (!settings) return null;

    try {
      return JSON.parse(settings.setting_value);
    } catch {
      return settings.setting_value;
    }
  }

  static async setSetting(
    key: string,
    value: any,
    userId?: string,
  ): Promise<void> {
    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE setting_key = ? AND user_id = ?",
      [key, userId || null],
    );

    const jsonValue = JSON.stringify(value);

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [jsonValue, existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, ?, ?, ?)",
        [id, userId || null, key, jsonValue],
      );
    }
  }
}
