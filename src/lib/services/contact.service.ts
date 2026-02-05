import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { Contact, CreateContactDTO } from "@/types/database.types";
import { parse } from "csv-parse/sync";
import * as vcf from "vcf";

export class ContactService {
  static async createContact(data: CreateContactDTO): Promise<Contact> {
    const existing = await queryOne(
      "SELECT * FROM contacts WHERE phone_number = ? AND user_id = ?",
      [data.phone_number, data.user_id],
    );

    if (existing) {
      throw new Error("Contact with this phone number already exists");
    }

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

    const contact = await queryOne<Contact>(
      "SELECT * FROM contacts WHERE id = ?",
      [id],
    );

    if (!contact) {
      throw new Error("Failed to create contact");
    }

    return contact;
  }

  static async getUserContacts(
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
      sql += " AND (name LIKE ? OR phone_number LIKE ?)";
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm);
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

  static async getContact(id: string): Promise<Contact | null> {
    return queryOne<Contact>("SELECT * FROM contacts WHERE id = ?", [id]);
  }

  static async updateContact(
    id: string,
    data: Partial<CreateContactDTO>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.phone_number) {
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

    if (updates.length === 0) {
      return;
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async deleteContact(id: string): Promise<void> {
    await query("DELETE FROM contacts WHERE id = ?", [id]);
  }

  static async deleteMultipleContacts(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => "?").join(",");
    const result: any = await query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids,
    );

    return result.affectedRows || 0;
  }

  static async importFromCSV(
    csvContent: string,
    userId: string,
  ): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let imported = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2;

      try {
        if (!row.name || !row.phone_number) {
          throw new Error("Missing required fields: name or phone_number");
        }

        await this.createContact({
          name: row.name,
          phone_number: row.phone_number,
          email: row.email || undefined,
          tags: row.tags
            ? row.tags.split(",").map((t: string) => t.trim())
            : undefined,
          user_id: userId,
        });

        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    return { imported, failed, errors };
  }

  static async importFromVCF(
    vcfContent: string,
    userId: string,
  ): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const cards = vcf.parse(vcfContent);

    let imported = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const rowNumber = i + 1;

      try {
        const name = card.get("fn")?.valueOf() || "Unknown";
        const tel = card.get("tel");

        if (!tel) {
          throw new Error("No phone number found");
        }

        const phoneNumber =
          typeof tel.valueOf() === "string" ? tel.valueOf() : tel.valueOf()[0];

        const email = card.get("email")?.valueOf();

        await this.createContact({
          name,
          phone_number: phoneNumber,
          email: typeof email === "string" ? email : undefined,
          user_id: userId,
        });

        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    return { imported, failed, errors };
  }

  static async exportToCSV(userId: string): Promise<string> {
    const contacts = await this.getUserContacts(userId);

    const headers = ["name", "phone_number", "email", "tags"];
    const rows = contacts.map((contact) => [
      contact.name,
      contact.phone_number,
      contact.email || "",
      contact.tags ? contact.tags.join(",") : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }

  static async countUserContacts(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM contacts WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }
}
