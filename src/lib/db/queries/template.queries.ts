// src/lib/db/queries/template.queries.ts
import { query, queryOne } from "../index";
import { MessageTemplate } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class TemplateQueries {
  static async findById(id: string): Promise<MessageTemplate | null> {
    return queryOne<MessageTemplate>(
      "SELECT * FROM message_templates WHERE id = ?",
      [id],
    );
  }

  static async findByUserId(userId: string): Promise<MessageTemplate[]> {
    return query<MessageTemplate[]>(
      "SELECT * FROM message_templates WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async create(data: {
    name: string;
    content: string;
    variables?: Record<string, string> | null; // PERBAIKAN: Allow null
    user_id: string;
  }): Promise<MessageTemplate> {
    const id = uuidv4();

    await query(
      `INSERT INTO message_templates (id, name, content, variables, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.content,
        data.variables ? JSON.stringify(data.variables) : null,
        data.user_id,
      ],
    );

    const template = await this.findById(id);
    if (!template) {
      throw new Error("Failed to create template");
    }

    return template;
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      content: string;
      variables: Record<string, string> | null; // PERBAIKAN: Allow null eksplisit
    }>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.content !== undefined) {
      updates.push("content = ?");
      params.push(data.content);
    }

    if (data.variables !== undefined) {
      updates.push("variables = ?");
      params.push(data.variables ? JSON.stringify(data.variables) : null);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE message_templates SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM message_templates WHERE id = ?", [id]);
  }
}
