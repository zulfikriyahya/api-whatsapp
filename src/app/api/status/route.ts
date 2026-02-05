import { NextRequest } from "next/server";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { StorageService } from "@/lib/services/storage.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const formData = await req.formData();
    const text = formData.get("text") as string;
    const file = formData.get("file") as File | null;
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID required" },
      ]);
    }

    const device = await DeviceQueries.findById(deviceId);
    if (!device || device.user_id !== session.user.id) {
      return validationErrorResponse([
        { field: "deviceId", message: "Invalid device" },
      ]);
    }

    let mediaPath = undefined;
    if (file) {
      const saved = await StorageService.saveFile(file, "status");
      mediaPath = saved.path;
    }

    await whatsappClientManager.postStatus(deviceId, text, mediaPath);

    return successResponse({ posted: true, timestamp: new Date() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  return successResponse([]);
}
