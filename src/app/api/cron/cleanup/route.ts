import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import * as fs from "fs";
import * as path from "path";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return unauthorizedResponse();
    }

    const days = 30;
    const result: any = await query(
      `DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    let deletedFiles = 0;

    const scanAndDelete = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          scanAndDelete(filePath);
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

    await query("OPTIMIZE TABLE messages, message_queue, audit_logs");

    return successResponse({
      message: "Cleanup completed",
      deletedMessages: result.affectedRows,
      deletedFiles,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
