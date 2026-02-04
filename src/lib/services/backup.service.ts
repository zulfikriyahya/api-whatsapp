// src/lib/services/backup.service.ts
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { appConfig } from "@/config/app.config";

const execAsync = promisify(exec);

export class BackupService {
  private static backupsDir = path.join(process.cwd(), "backups");

  static ensureBackupsDirectory(): void {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  static async createBackup(): Promise<string> {
    this.ensureBackupsDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupsDir, filename);

    const command = `mysqldump -h ${appConfig.database.host} -P ${appConfig.database.port} -u ${appConfig.database.user} -p${appConfig.database.password} ${appConfig.database.database} > ${filepath}`;

    try {
      await execAsync(command);
      console.log(`Backup created: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("Backup failed:", error);
      throw new Error("Failed to create backup");
    }
  }

  static async restoreBackup(filepath: string): Promise<void> {
    if (!fs.existsSync(filepath)) {
      throw new Error("Backup file not found");
    }

    const command = `mysql -h ${appConfig.database.host} -P ${appConfig.database.port} -u ${appConfig.database.user} -p${appConfig.database.password} ${appConfig.database.database} < ${filepath}`;

    try {
      await execAsync(command);
      console.log(`Backup restored from: ${filepath}`);
    } catch (error) {
      console.error("Restore failed:", error);
      throw new Error("Failed to restore backup");
    }
  }

  // FIX: Perbaikan syntax generic type di sini
  static async listBackups(): Promise<
    Array<{
      filename: string;
      filepath: string;
      size: number;
      created_at: Date;
    }>
  > {
    this.ensureBackupsDirectory();

    const files = fs.readdirSync(this.backupsDir);
    const backups = files
      .filter((file) => file.endsWith(".sql"))
      .map((file) => {
        const filepath = path.join(this.backupsDir, file);
        const stats = fs.statSync(filepath);

        return {
          filename: file,
          filepath,
          size: stats.size,
          created_at: stats.mtime,
        };
      })
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return backups;
  }

  static async deleteBackup(filepath: string): Promise<void> {
    if (!fs.existsSync(filepath)) {
      throw new Error("Backup file not found");
    }

    fs.unlinkSync(filepath);
    console.log(`Backup deleted: ${filepath}`);
  }

  static async cleanupOldBackups(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const backups = await this.listBackups();
    let deleted = 0;

    for (const backup of backups) {
      if (backup.created_at < cutoffDate) {
        await this.deleteBackup(backup.filepath);
        deleted++;
      }
    }

    return deleted;
  }
}
