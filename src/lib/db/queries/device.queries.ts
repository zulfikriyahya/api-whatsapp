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

  static async findWithStats(userId: string): Promise<DeviceViewModel[]> {
    return query<DeviceViewModel[]>(
      `SELECT d.*, 
       (SELECT COUNT(*) FROM messages m WHERE m.device_id = d.id) as message_count,
       (SELECT MAX(created_at) FROM messages m WHERE m.device_id = d.id) as last_message_at
       FROM devices d WHERE d.user_id = ? ORDER BY d.created_at DESC`,
      [userId],
    );
  }

  static async create(data: CreateDeviceDTO): Promise<Device> {
    const id = uuidv4();
    await query(
      `INSERT INTO devices (id, name, phone_number, user_id, status, is_ready)
       VALUES (?, ?, ?, ?, 'DISCONNECTED', false)`,
      [id, data.name, data.phone_number, data.user_id],
    );
    return (await this.findById(id))!;
  }

  static async updateStatus(
    id: string,
    status: string,
    isReady: boolean = false,
  ): Promise<void> {
    await query(
      "UPDATE devices SET status = ?, is_ready = ?, last_seen = NOW(), updated_at = NOW() WHERE id = ?",
      [status, isReady, id],
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM devices WHERE id = ?", [id]);
  }

  static async getActiveDevices(): Promise<Device[]> {
    return query<Device[]>(
      "SELECT * FROM devices WHERE status = 'AUTHENTICATED' AND is_ready = true",
    );
  }

  static async countByUser(userId: string): Promise<number> {
    const res = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM devices WHERE user_id = ?",
      [userId],
    );
    return res?.count || 0;
  }
}
