import { query, queryOne } from "../index";
import { ApiKey } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

export class ApiKeyQueries {
  static async findById(id: string): Promise<ApiKey | null> {
    return queryOne<ApiKey>("SELECT * FROM api_keys WHERE id = ?", [id]);
  }

  static async findByHash(keyHash: string): Promise<ApiKey | null> {
    return queryOne<ApiKey>("SELECT * FROM api_keys WHERE key_hash = ?", [
      keyHash,
    ]);
  }

  static async findByUserId(userId: string): Promise<ApiKey[]> {
    return query<ApiKey[]>(
      "SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async create(data: {
    name: string;
    user_id: string;
  }): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const id = uuidv4();
    const plainKey = this.generateApiKey();
    const keyHash = this.hashApiKey(plainKey);

    await query(
      `INSERT INTO api_keys (id, key_hash, name, user_id, is_active)
       VALUES (?, ?, ?, ?, true)`,
      [id, keyHash, data.name, data.user_id],
    );

    const apiKey = await this.findById(id);
    if (!apiKey) {
      throw new Error("Failed to create API key");
    }

    return { apiKey, plainKey };
  }

  static async updateLastUsed(id: string): Promise<void> {
    await query("UPDATE api_keys SET last_used = NOW() WHERE id = ?", [id]);
  }

  static async toggleActive(id: string, isActive: boolean): Promise<void> {
    await query(
      "UPDATE api_keys SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [isActive, id],
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM api_keys WHERE id = ?", [id]);
  }

  static generateApiKey(): string {
    return `wwa_${crypto.randomBytes(32).toString("hex")}`;
  }

  static hashApiKey(apiKey: string): string {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
  }
}
