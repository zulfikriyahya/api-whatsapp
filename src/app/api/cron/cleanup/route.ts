import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import * as fs from "fs";
import * as path from "path";
import { StorageService } from "@/lib/services/storage.service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    // Gunakan Environment Variable untuk Secret Key
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return unauthorizedResponse();
    }

    // 1. Hapus Pesan Lama (> 30 hari)
    const days = 30;
    const result: any = await query(
      `DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    // 2. Hapus File Media Lama (Temp files)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    let deletedFiles = 0;

    // Helper rekursif untuk scan folder
    const scanAndDelete = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 Hari

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          scanAndDelete(filePath);
          // Hapus direktori kosong
          if (fs.readdirSync(filePath).length === 0) {
            fs.rmdirSync(filePath);
          }
        } else {
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            deletedFiles++;
          }
        }
      }
    };

    scanAndDelete(uploadsDir);

    // 3. Optimize Tables (Optional, good for MySQL/MariaDB)
    await query("OPTIMIZE TABLE messages, message_queue, audit_logs");

    return successResponse({
      message: "Cleanup completed",
      deletedMessages: result.affectedRows,
      deletedFiles,
      note: "Old messages and temp files deleted.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
