// src/lib/utils/storage.ts
import * as fs from "fs";
import * as path from "path";
// import { appConfig } from "@/config/app.config";

export class StorageService {
  private static uploadsDir = path.join(process.cwd(), "uploads");
  private static backupsDir = path.join(process.cwd(), "backups");

  static ensureDirectories(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  static async saveUpload(file: File, userId: string): Promise<string> {
    this.ensureDirectories();

    const userDir = path.join(this.uploadsDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filepath = path.join(userDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    return filepath;
  }

  static async deleteUpload(filepath: string): Promise<void> {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  static async cleanupOldUploads(days: number = 7): Promise<number> {
    let deleted = 0;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const processDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);

        if (stats.isDirectory()) {
          processDir(filepath);
        } else if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filepath);
          deleted++;
        }
      }
    };

    processDir(this.uploadsDir);
    return deleted;
  }
}
