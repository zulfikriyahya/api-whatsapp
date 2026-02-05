import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export class StorageService {
  private static uploadDir = join(process.cwd(), "public", "uploads");

  static async saveFile(
    file: File,
    folder: string = "media",
  ): Promise<{ path: string; mimeType: string; size: number }> {
    try {
      const targetDir = join(this.uploadDir, folder);
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const originalName = file.name || "unknown";
      const extension = originalName.split(".").pop()?.toLowerCase() || "bin";
      const allowedExts = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "mp4",
        "pdf",
        "mp3",
        "ogg",
        "webp",
      ];
      const safeExt = allowedExts.includes(extension) ? extension : "bin";

      const filename = `${uuidv4()}.${safeExt}`;
      const filepath = join(targetDir, filename);

      await writeFile(filepath, buffer);

      return {
        path: `/uploads/${folder}/${filename}`,
        mimeType: file.type,
        size: file.size,
      };
    } catch (error) {
      console.error("Storage save error:", error);
      throw new Error("Failed to save file");
    }
  }

  static async deleteFile(relativePath: string): Promise<boolean> {
    try {
      const cleanPath = relativePath.startsWith("/")
        ? relativePath.substring(1)
        : relativePath;
      const absolutePath = join(process.cwd(), "public", cleanPath);

      if (existsSync(absolutePath)) {
        await unlink(absolutePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Storage delete error:", error);
      return false;
    }
  }

  static getAbsolutePath(relativePath: string): string {
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;
    return join(process.cwd(), "public", cleanPath);
  }
}
