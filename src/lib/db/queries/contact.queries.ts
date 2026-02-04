// src/lib/db/queries/contact.queries.ts
import { query, queryOne } from "../index";
import { Contact, CreateContactDTO } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class ContactQueries {
  static async findById(id: string): Promise<Contact | null> {
    return queryOne<Contact>("SELECT * FROM contacts WHERE id = ?", [id]);
  }

  static async findByPhoneNumber(
    phoneNumber: string,
    userId: string,
  ): Promise<Contact | null> {
    return queryOne<Contact>(
      "SELECT * FROM contacts WHERE phone_number = ? AND user_id = ?",
      [phoneNumber, userId],
    );
  }

  static async findByUserId(
    userId: string,
    params?: {
      search?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Contact[]> {
    let sql = "SELECT * FROM contacts WHERE user_id = ?";
    const queryParams: any[] = [userId];

    if (params?.search) {
      sql += " AND (name LIKE ? OR phone_number LIKE ? OR email LIKE ?)";
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    sql += " ORDER BY name ASC";

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<Contact[]>(sql, queryParams);
  }

  static async create(data: CreateContactDTO): Promise<Contact> {
    const id = uuidv4();

    await query(
      `INSERT INTO contacts (id, name, phone_number, email, tags, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.phone_number,
        data.email || null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.user_id,
      ],
    );

    const contact = await this.findById(id);
    if (!contact) {
      throw new Error("Failed to create contact");
    }

    return contact;
  }

  static async update(
    id: string,
    data: Partial<CreateContactDTO>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.phone_number !== undefined) {
      updates.push("phone_number = ?");
      params.push(data.phone_number);
    }

    if (data.email !== undefined) {
      updates.push("email = ?");
      params.push(data.email);
    }

    if (data.tags !== undefined) {
      updates.push("tags = ?");
      params.push(data.tags ? JSON.stringify(data.tags) : null);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM contacts WHERE id = ?", [id]);
  }

  static async deleteMultiple(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => "?").join(",");
    const result: any = await query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids,
    );

    return result.affectedRows || 0;
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM contacts WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }
}
