// src/app/api/backup/restore/route.ts
import { NextRequest } from "next/server";
import { BackupService } from "@/lib/services/backup.service";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can restore backups");
    }

    const body = await _request.json();

    if (!body.filepath) {
      return validationErrorResponse([
        { field: "filepath", message: "Backup filepath is required" },
      ]);
    }

    await BackupService.restoreBackup(body.filepath);

    return successResponse({
      message: "Backup restored successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
