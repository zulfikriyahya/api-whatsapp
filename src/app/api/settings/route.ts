// src/app/api/settings/route.ts
import { NextRequest } from "next/server";
import { SettingsService } from "@/lib/services/settings.service";
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

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const scope = searchParams.get("scope") || "user";

    if (scope === "system") {
      if (session.user.role !== UserRole.ADMIN) {
        return forbiddenResponse("Admin access required");
      }
      const settings = await SettingsService.getSystemSettings();
      return successResponse(settings);
    }

    const settings = await SettingsService.getUserSettings(session.user.id);
    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();
    const { scope, settings } = body;

    if (!settings) {
      return validationErrorResponse([
        { field: "settings", message: "Settings are required" },
      ]);
    }

    if (scope === "system") {
      if (session.user.role !== UserRole.ADMIN) {
        return forbiddenResponse("Admin access required");
      }
      await SettingsService.updateSystemSettings(settings);
    } else {
      await SettingsService.updateUserSettings(session.user.id, settings);
    }

    return successResponse({ message: "Settings updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
