import { writeFile, mkdir, unlink, access, stat } from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { join, normalize, resolve, extname, basename } from "path";
import { v4 as uuidv4 } from "uuid";
import { pipeline } from "stream/promises";
import * as crypto from "crypto";

interface SaveFileResult {
  path: string;
  mimeType: string;
  size: number;
  hash: string;
}

interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export class StorageService {
  private static uploadDir = join(process.cwd(), "public", "uploads");
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  private static readonly ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "audio/mpeg",
    "audio/ogg",
    "application/pdf",
  ];

  private static readonly ALLOWED_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",
    ".mp3",
    ".ogg",
    ".pdf",
  ];

  static async saveFile(
    file: File,
    folder: string = "media",
    options?: FileValidationOptions,
  ): Promise<SaveFileResult> {
    await this.validateFile(file, options);

    const sanitizedFolder = this.sanitizePath(folder);
    const targetDir = join(this.uploadDir, sanitizedFolder);

    await this.ensureDirectory(targetDir);

    const fileExt = this.getSecureExtension(file.name, file.type);
    const filename = `${uuidv4()}${fileExt}`;
    const filepath = join(targetDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    await writeFile(filepath, buffer, { mode: 0o644 });

    return {
      path: `/uploads/${sanitizedFolder}/${filename}`,
      mimeType: file.type,
      size: file.size,
      hash,
    };
  }

  static async saveStream(
    stream: NodeJS.ReadableStream,
    filename: string,
    folder: string = "media",
  ): Promise<SaveFileResult> {
    const sanitizedFolder = this.sanitizePath(folder);
    const targetDir = join(this.uploadDir, sanitizedFolder);

    await this.ensureDirectory(targetDir);

    const fileExt = this.getSecureExtension(filename);
    const safeFilename = `${uuidv4()}${fileExt}`;
    const filepath = join(targetDir, safeFilename);

    const hash = crypto.createHash("sha256");
    let size = 0;

    const writeStream = createWriteStream(filepath, { mode: 0o644 });

    stream.on("data", (chunk) => {
      hash.update(chunk);
      size += chunk.length;

      if (size > this.MAX_FILE_SIZE) {
        stream.destroy();
        writeStream.destroy();
        throw new Error("File size exceeds maximum allowed");
      }
    });

    await pipeline(stream, writeStream);

    return {
      path: `/uploads/${sanitizedFolder}/${safeFilename}`,
      mimeType: "application/octet-stream",
      size,
      hash: hash.digest("hex"),
    };
  }

  static async deleteFile(relativePath: string): Promise<boolean> {
    try {
      const safePath = this.validatePath(relativePath);
      const absolutePath = join(process.cwd(), "public", safePath);

      await this.ensurePathSafety(absolutePath);
      await access(absolutePath);
      await unlink(absolutePath);

      return true;
    } catch (error) {
      console.error("Storage delete error:", error);
      return false;
    }
  }

  static async deleteMultiple(paths: string[]): Promise<{
    deleted: number;
    failed: number;
  }> {
    let deleted = 0;
    let failed = 0;

    await Promise.allSettled(
      paths.map(async (path) => {
        const success = await this.deleteFile(path);
        if (success) {
          deleted++;
        } else {
          failed++;
        }
      }),
    );

    return { deleted, failed };
  }

  static async fileExists(relativePath: string): Promise<boolean> {
    try {
      const safePath = this.validatePath(relativePath);
      const absolutePath = join(process.cwd(), "public", safePath);

      await this.ensurePathSafety(absolutePath);
      await access(absolutePath);

      return true;
    } catch {
      return false;
    }
  }

  static async getFileInfo(relativePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
  } | null> {
    try {
      const safePath = this.validatePath(relativePath);
      const absolutePath = join(process.cwd(), "public", safePath);

      await this.ensurePathSafety(absolutePath);
      const stats = await stat(absolutePath);

      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  static getAbsolutePath(relativePath: string): string {
    const safePath = this.validatePath(relativePath);
    return join(process.cwd(), "public", safePath);
  }

  static async cleanupOldFiles(
    folder: string,
    days: number = 7,
  ): Promise<number> {
    const sanitizedFolder = this.sanitizePath(folder);
    const targetDir = join(this.uploadDir, sanitizedFolder);

    let deleted = 0;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    try {
      const fs = await import("fs/promises");
      const files = await fs.readdir(targetDir);

      for (const file of files) {
        const filepath = join(targetDir, file);
        const stats = await stat(filepath);

        if (stats.isFile() && stats.mtimeMs < cutoffTime) {
          await unlink(filepath);
          deleted++;
        }
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }

    return deleted;
  }

  private static async validateFile(
    file: File,
    options?: FileValidationOptions,
  ): Promise<void> {
    const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
    const allowedMimeTypes =
      options?.allowedMimeTypes || this.ALLOWED_MIME_TYPES;
    const allowedExtensions =
      options?.allowedExtensions || this.ALLOWED_EXTENSIONS;

    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed (${maxSize} bytes)`);
    }

    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    const ext = extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`File extension ${ext} is not allowed`);
    }
  }

  private static sanitizePath(path: string): string {
    const normalized = normalize(path).replace(/^(\.\.(\/|\\|$))+/, "");

    return normalized
      .split(/[/\\]/)
      .filter((segment) => segment && segment !== "." && segment !== "..")
      .join("/");
  }

  private static validatePath(relativePath: string): string {
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;

    const sanitized = this.sanitizePath(cleanPath);

    if (sanitized.includes("..") || sanitized.startsWith("/")) {
      throw new Error("Invalid file path");
    }

    return sanitized;
  }

  private static async ensurePathSafety(absolutePath: string): Promise<void> {
    const uploadDir = resolve(this.uploadDir);
    const targetPath = resolve(absolutePath);

    if (!targetPath.startsWith(uploadDir)) {
      throw new Error("Path traversal attempt detected");
    }
  }

  private static getSecureExtension(
    filename: string,
    mimeType?: string,
  ): string {
    const ext = extname(filename).toLowerCase();

    if (this.ALLOWED_EXTENSIONS.includes(ext)) {
      return ext;
    }

    if (mimeType) {
      const mimeMap: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "application/pdf": ".pdf",
      };

      return mimeMap[mimeType] || ".bin";
    }

    return ".bin";
  }

  private static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await access(dirPath);
    } catch {
      await mkdir(dirPath, { recursive: true, mode: 0o755 });
    }
  }

  static async getStorageMetrics(): Promise<{
    totalFiles: number;
    totalSize: number;
    folders: Record<string, { files: number; size: number }>;
  }> {
    const fs = await import("fs/promises");
    const metrics = {
      totalFiles: 0,
      totalSize: 0,
      folders: {} as Record<string, { files: number; size: number }>,
    };

    try {
      const folders = await fs.readdir(this.uploadDir);

      for (const folder of folders) {
        const folderPath = join(this.uploadDir, folder);
        const folderStats = await stat(folderPath);

        if (folderStats.isDirectory()) {
          const files = await fs.readdir(folderPath);
          let folderSize = 0;
          let fileCount = 0;

          for (const file of files) {
            const filePath = join(folderPath, file);
            const fileStats = await stat(filePath);

            if (fileStats.isFile()) {
              folderSize += fileStats.size;
              fileCount++;
            }
          }

          metrics.folders[folder] = {
            files: fileCount,
            size: folderSize,
          };

          metrics.totalFiles += fileCount;
          metrics.totalSize += folderSize;
        }
      }
    } catch (error) {
      console.error("Error getting storage metrics:", error);
    }

    return metrics;
  }
}
