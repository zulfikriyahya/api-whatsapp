import * as fs from "fs";
import * as path from "path";

export class StorageService {
  private static uploadsDir = path.join(process.cwd(), "public", "uploads");
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

    // Return relative path for public access
    return `/uploads/${userId}/${filename}`;
  }

  static async deleteUpload(filepath: string): Promise<void> {
    // Convert relative public path to absolute system path if needed
    let absolutePath = filepath;
    if (filepath.startsWith("/uploads")) {
      absolutePath = path.join(process.cwd(), "public", filepath);
    }

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
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
          // Remove empty directories
          if (fs.readdirSync(filepath).length === 0) {
            fs.rmdirSync(filepath);
          }
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
