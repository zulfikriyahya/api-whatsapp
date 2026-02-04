// src/lib/db/queries/device.queries.ts
import { query, queryOne } from "../index";
import type {
  Device,
  DeviceViewModel,
  CreateDeviceDTO,
} from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class DeviceQueries {
  static async findById(id: string): Promise<Device | null> {
    return queryOne<Device>("SELECT * FROM devices WHERE id = ?", [id]);
  }

  static async findByPhoneNumber(phoneNumber: string): Promise<Device | null> {
    return queryOne<Device>("SELECT * FROM devices WHERE phone_number = ?", [
      phoneNumber,
    ]);
  }

  static async findByUserId(userId: string): Promise<Device[]> {
    return query<Device[]>(
      "SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async findAll(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<Device[]> {
    let sql = "SELECT * FROM devices WHERE 1=1";
    const queryParams: any[] = [];

    if (params?.status) {
      sql += " AND status = ?";
      queryParams.push(params.status);
    }

    sql += " ORDER BY created_at DESC";

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<Device[]>(sql, queryParams);
  }

  static async findWithStats(userId?: string): Promise<DeviceViewModel[]> {
    let sql = `
      SELECT 
        d.*,
        u.name as user_name,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM devices d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN messages m ON d.id = m.device_id
    `;

    const queryParams: any[] = [];

    if (userId) {
      sql += " WHERE d.user_id = ?";
      queryParams.push(userId);
    }

    sql += " GROUP BY d.id ORDER BY d.created_at DESC";

    return query<DeviceViewModel[]>(sql, queryParams);
  }

  static async create(data: CreateDeviceDTO): Promise<Device> {
    const id = uuidv4();

    await query(
      `INSERT INTO devices (id, name, phone_number, user_id, status, is_ready)
       VALUES (?, ?, ?, ?, 'DISCONNECTED', false)`,
      [id, data.name, data.phone_number, data.user_id],
    );

    const device = await this.findById(id);
    if (!device) {
      throw new Error("Failed to create device");
    }

    return device;
  }

  static async updateStatus(
    id: string,
    status: string,
    isReady: boolean = false,
  ): Promise<void> {
    await query(
      `UPDATE devices 
       SET status = ?, is_ready = ?, last_seen = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [status, isReady, id],
    );
  }

  static async updateSessionData(
    id: string,
    sessionData: string,
  ): Promise<void> {
    await query(
      "UPDATE devices SET session_data = ?, updated_at = NOW() WHERE id = ?",
      [sessionData, id],
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM devices WHERE id = ?", [id]);
  }

  static async getActiveDevices(): Promise<Device[]> {
    return query<Device[]>(
      `SELECT * FROM devices 
       WHERE status = 'AUTHENTICATED' AND is_ready = true`,
    );
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM devices WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }
}
