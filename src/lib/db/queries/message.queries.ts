import { query, queryOne } from "../index";
import type { Message, CreateMessageDTO } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class MessageQueries {
  static async findById(id: string): Promise<Message | null> {
    return queryOne<Message>("SELECT * FROM messages WHERE id = ?", [id]);
  }

  static async findByUserId(
    userId: string,
    params: {
      limit: number;
      offset: number;
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

    if (params.deviceId) {
      sql += " AND m.device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.search) {
      sql += " AND (m.message LIKE ? OR m.to_number LIKE ?)";
      const term = `%${params.search}%`;
      queryParams.push(term, term);
    }

    sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(params.limit, params.offset);

    return query<Message[]>(sql, queryParams);
  }

  static async countByUserId(
    userId: string,
    params: { deviceId?: string; search?: string },
  ): Promise<number> {
    let sql = `
      SELECT COUNT(*) as total
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const queryParams: any[] = [userId];

    if (params.deviceId) {
      sql += " AND m.device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.search) {
      sql += " AND (m.message LIKE ? OR m.to_number LIKE ?)";
      const term = `%${params.search}%`;
      queryParams.push(term, term);
    }

    const res = await queryOne<{ total: number }>(sql, queryParams);
    return res?.total || 0;
  }

  static async findPending(limit: number = 100): Promise<Message[]> {
    return query<Message[]>(
      "SELECT * FROM messages WHERE status IN ('PENDING', 'QUEUED') ORDER BY created_at ASC LIMIT ?",
      [limit],
    );
  }

  static async getStatsByUserId(userId: string) {
    const sql = `
      SELECT 
        COUNT(m.id) as total,
        SUM(CASE WHEN m.status IN ('SENT', 'DELIVERED', 'READ') THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN m.status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN m.status IN ('PENDING', 'QUEUED') THEN 1 ELSE 0 END) as pending
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;

    const res = await queryOne<any>(sql, [userId]);

    return {
      total: Number(res?.total || 0),
      sent: Number(res?.sent || 0),
      failed: Number(res?.failed || 0),
      pending: Number(res?.pending || 0),
    };
  }

  static async getDetailedStats(params: {
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let sql = `
      SELECT 
        COUNT(id) as total,
        SUM(CASE WHEN status IN ('SENT', 'DELIVERED', 'READ') THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status IN ('PENDING', 'QUEUED') THEN 1 ELSE 0 END) as pending
      FROM messages
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (params.deviceId) {
      sql += " AND device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.startDate) {
      sql += " AND created_at >= ?";
      queryParams.push(params.startDate);
    }

    if (params.endDate) {
      sql += " AND created_at <= ?";
      queryParams.push(params.endDate);
    }

    const res = await queryOne<any>(sql, queryParams);
    return {
      total: Number(res?.total || 0),
      sent: Number(res?.sent || 0),
      failed: Number(res?.failed || 0),
      pending: Number(res?.pending || 0),
    };
  }

  static async create(data: CreateMessageDTO): Promise<Message> {
    const id = uuidv4();
    await query(
      `INSERT INTO messages (id, device_id, user_id, to_number, message, media_url, media_type, status, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 0)`,
      [
        id,
        data.device_id,
        data.user_id,
        data.to_number,
        data.message || "",
        data.media_path || null,
        data.media_type || null,
      ],
    );
    return (await this.findById(id))!;
  }

  static async updateStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const updates = ["status = ?", "updated_at = NOW()"];
    const params: any[] = [status];

    if (status === "SENT") updates.push("sent_at = NOW()");
    if (status === "DELIVERED") updates.push("delivered_at = NOW()");
    if (status === "READ") updates.push("read_at = NOW()");

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

  static async getHourlyStats(
    deviceId?: string,
    hours: number = 24,
  ): Promise<Array<{ hour: string; count: number }>> {
    let sql = `
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour, COUNT(*) as count
      FROM messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    const params: any[] = [hours];
    if (deviceId) {
      sql += " AND device_id = ?";
      params.push(deviceId);
    }
    sql += " GROUP BY hour ORDER BY hour ASC";
    return query(sql, params);
  }

  static async findByDeviceId(
    deviceId: string,
    params: { limit: number },
  ): Promise<Message[]> {
    return query<Message[]>(
      "SELECT * FROM messages WHERE device_id = ? ORDER BY created_at DESC LIMIT ?",
      [deviceId, params.limit],
    );
  }

  static async bulkCreate(messages: CreateMessageDTO[]): Promise<Message[]> {
    if (messages.length === 0) return [];

    const values: any[] = [];
    const placeholders: string[] = [];

    for (const data of messages) {
      const id = uuidv4();
      placeholders.push("(?, ?, ?, ?, ?, ?, ?, 'PENDING', 0)");
      values.push(
        id,
        data.device_id,
        data.user_id,
        data.to_number,
        data.message || "",
        data.media_path || null,
        data.media_type || null,
      );
    }

    const sql = `INSERT INTO messages (id, device_id, user_id, to_number, message, media_url, media_type, status, retry_count) VALUES ${placeholders.join(", ")}`;
    await query(sql, values);

    return query<Message[]>(
      `SELECT * FROM messages WHERE id IN (${values
        .filter((_, i) => i % 8 === 0)
        .map(() => "?")
        .join(",")})`,
      values.filter((_, i) => i % 8 === 0),
    );
  }

  static async deleteOldMessages(days: number = 30): Promise<number> {
    const result: any = await query(
      `DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );
    return result.affectedRows || 0;
  }
}
