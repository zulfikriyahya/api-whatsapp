// src/lib/db/queries/audit-log.queries.ts
import { query, queryOne } from "../index";
import { AuditLog } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class AuditLogQueries {
  static async create(data: {
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_value?: Record<string, any>;
    new_value?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    const id = uuidv4();

    await query(
      `INSERT INTO audit_logs 
       (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.user_id || null,
        data.action,
        data.entity_type,
        data.entity_id || null,
        data.old_value ? JSON.stringify(data.old_value) : null,
        data.new_value ? JSON.stringify(data.new_value) : null,
        data.ip_address || null,
        data.user_agent || null,
      ],
    );
  }

  static async findByUserId(
    userId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<AuditLog[]> {
    let sql =
      "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC";
    const queryParams: any[] = [userId];

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<AuditLog[]>(sql, queryParams);
  }

  static async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return query<AuditLog[]>(
      `SELECT * FROM audit_logs 
       WHERE entity_type = ? AND entity_id = ? 
       ORDER BY created_at DESC`,
      [entityType, entityId],
    );
  }

  static async deleteOld(days: number = 90): Promise<number> {
    const result: any = await query(
      `DELETE FROM audit_logs 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    return result.affectedRows || 0;
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }

  static async findAll(params?: {
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    let sql = "SELECT * FROM audit_logs ORDER BY created_at DESC";
    const queryParams: any[] = [];

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<AuditLog[]>(sql, queryParams);
  }
}
