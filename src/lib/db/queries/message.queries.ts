// src/lib/db/queries/message.queries.ts
import { query, queryOne } from "../index";
import type { Message, CreateMessageDTO } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class MessageQueries {
  static async findById(id: string): Promise<Message | null> {
    return queryOne<Message>("SELECT * FROM messages WHERE id = ?", [id]);
  }

  static async findByDeviceId(
    deviceId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Message[]> {
    let sql =
      "SELECT * FROM messages WHERE device_id = ? ORDER BY created_at DESC";
    const queryParams: any[] = [deviceId];

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset !== undefined) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<Message[]>(sql, queryParams);
  }

  static async findByUserId(
    userId: string,
    params?: {
      limit?: number;
      offset?: number;
      deviceId?: string;
      search?: string;
    },
  ): Promise<Message[]> {
    let sql = `
      SELECT m.*, d.name as device_name 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const queryParams: any[] = [userId];

    if (params?.deviceId) {
      sql += " AND m.device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params?.search) {
      sql += " AND (m.message LIKE ? OR m.to_number LIKE ?)";
      const term = `%${params.search}%`;
      queryParams.push(term, term);
    }

    sql += " ORDER BY m.created_at DESC";

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset !== undefined) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<Message[]>(sql, queryParams);
  }

  static async countByUserId(
    userId: string,
    params?: { deviceId?: string; search?: string },
  ): Promise<number> {
    let sql = `
      SELECT COUNT(*) as total 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const queryParams: any[] = [userId];

    if (params?.deviceId) {
      sql += " AND m.device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params?.search) {
      sql += " AND (m.message LIKE ? OR m.to_number LIKE ?)";
      const term = `%${params.search}%`;
      queryParams.push(term, term);
    }

    const result = await queryOne<{ total: number }>(sql, queryParams);
    return result?.total || 0;
  }

  static async findPending(limit: number = 100): Promise<Message[]> {
    return query<Message[]>(
      `SELECT * FROM messages 
       WHERE status IN ('PENDING', 'QUEUED') 
       ORDER BY created_at ASC
       LIMIT ?`,
      [limit],
    );
  }

  static async create(data: CreateMessageDTO): Promise<Message> {
    const id = uuidv4();

    await query(
      `INSERT INTO messages (id, device_id, user_id, to_number, message, status, retry_count)
       VALUES (?, ?, ?, ?, ?, 'PENDING', 0)`,
      [id, data.device_id, data.user_id, data.to_number, data.message],
    );

    const message = await this.findById(id);
    if (!message) {
      throw new Error("Failed to create message");
    }

    return message;
  }

  static async updateStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const updates: string[] = ["status = ?", "updated_at = NOW()"];
    const params: any[] = [status];

    if (status === "SENT") {
      updates.push("sent_at = NOW()");
    } else if (status === "DELIVERED") {
      updates.push("delivered_at = NOW()");
    } else if (status === "READ") {
      updates.push("read_at = NOW()");
    }

    if (errorMessage) {
      updates.push("error_message = ?");
      params.push(errorMessage);
    }

    params.push(id);

    await query(
      `UPDATE messages SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async incrementRetry(id: string): Promise<void> {
    await query(
      "UPDATE messages SET retry_count = retry_count + 1, updated_at = NOW() WHERE id = ?",
      [id],
    );
  }

  static async getStatsByDevice(
    deviceId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    let sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('SENT', 'DELIVERED', 'READ') THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status IN ('PENDING', 'QUEUED') THEN 1 ELSE 0 END) as pending
      FROM messages
      WHERE device_id = ?
    `;
    const params: any[] = [deviceId];

    if (startDate) {
      sql += " AND created_at >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND created_at <= ?";
      params.push(endDate);
    }

    const result = await queryOne<any>(sql, params);

    return {
      total: Number(result?.total || 0),
      sent: Number(result?.sent || 0),
      failed: Number(result?.failed || 0),
      pending: Number(result?.pending || 0),
    };
  }

  static async getTodayStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
  }> {
    const result = await queryOne<any>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('SENT', 'DELIVERED', 'READ') THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
      FROM messages
      WHERE DATE(created_at) = CURDATE()
    `);

    return {
      total: Number(result?.total || 0),
      sent: Number(result?.sent || 0),
      failed: Number(result?.failed || 0),
    };
  }

  static async getHourlyStats(
    deviceId?: string,
    hours: number = 24,
  ): Promise<Array<{ hour: string; count: number }>> {
    let sql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
        COUNT(*) as count
      FROM messages
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    const params: any[] = [hours];

    if (deviceId) {
      sql += " AND device_id = ?";
      params.push(deviceId);
    }

    sql += " GROUP BY hour ORDER BY hour ASC";

    return query<Array<{ hour: string; count: number }>>(sql, params);
  }

  static async deleteOld(days: number = 30): Promise<number> {
    const result = await query<any>(
      `DELETE FROM messages 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
       AND status IN ('SENT', 'DELIVERED', 'READ', 'FAILED')`,
      [days],
    );

    return result.affectedRows || 0;
  }
}
