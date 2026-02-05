import { query, queryOne } from "../index";
import { AutoResponseRule } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class AutoResponseQueries {
  static async findById(id: string): Promise<AutoResponseRule | null> {
    return queryOne<AutoResponseRule>(
      "SELECT * FROM auto_response_rules WHERE id = ?",
      [id],
    );
  }

  static async findByDeviceId(deviceId: string): Promise<AutoResponseRule[]> {
    return query<AutoResponseRule[]>(
      "SELECT * FROM auto_response_rules WHERE device_id = ? ORDER BY priority DESC",
      [deviceId],
    );
  }

  static async findActiveByDeviceId(
    deviceId: string,
  ): Promise<AutoResponseRule[]> {
    return query<AutoResponseRule[]>(
      `SELECT * FROM auto_response_rules 
       WHERE device_id = ? AND is_active = true 
       ORDER BY priority DESC`,
      [deviceId],
    );
  }

  static async create(data: {
    keyword: string;
    response: string;
    device_id: string;
    priority?: number;
    is_active?: boolean;
  }): Promise<AutoResponseRule> {
    const id = uuidv4();

    await query(
      `INSERT INTO auto_response_rules (id, keyword, response, device_id, priority, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.keyword,
        data.response,
        data.device_id,
        data.priority || 0,
        data.is_active !== undefined ? data.is_active : true,
      ],
    );

    const rule = await this.findById(id);
    if (!rule) {
      throw new Error("Failed to create auto-response rule");
    }

    return rule;
  }

  static async update(
    id: string,
    data: Partial<{
      keyword: string;
      response: string;
      priority: number;
      is_active: boolean;
    }>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.keyword !== undefined) {
      updates.push("keyword = ?");
      params.push(data.keyword);
    }

    if (data.response !== undefined) {
      updates.push("response = ?");
      params.push(data.response);
    }

    if (data.priority !== undefined) {
      updates.push("priority = ?");
      params.push(data.priority);
    }

    if (data.is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(data.is_active);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE auto_response_rules SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM auto_response_rules WHERE id = ?", [id]);
  }
}
