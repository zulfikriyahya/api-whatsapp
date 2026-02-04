// src/app/api/backup/route.ts
import { NextRequest } from "next/server";
import { BackupService } from "@/lib/services/backup.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

// PERBAIKAN: Ubah 'request' menjadi '_request'
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can create backups");
    }

    const filepath = await BackupService.createBackup();

    return successResponse({
      message: "Backup created successfully",
      filepath,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PERBAIKAN: Ubah 'request' menjadi '_request' juga di sini karena tidak dipakai
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can list backups");
    }

    const backups = await BackupService.listBackups();

    return successResponse(backups);
  } catch (error) {
    return handleApiError(error);
  }
}
