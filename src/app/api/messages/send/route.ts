import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { StorageService } from "@/lib/services/storage.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { DeviceQueries } from "@/lib/db/queries/device.queries";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        deviceId: formData.get("deviceId") as string,
        toNumber: formData.get("toNumber") as string,
        message: formData.get("message") as string,
        media: formData.get("media") as File | null,
        useRoundRobin: formData.get("useRoundRobin") === "true",
        contacts: formData.get("contacts")
          ? JSON.parse(formData.get("contacts") as string)
          : undefined,
      };
    } else {
      body = await req.json();
    }

    // Bulk Send Logic
    if (body.contacts && Array.isArray(body.contacts)) {
      const result = await MessageService.sendBulkMessages({
        userId: session.user.id,
        contacts: body.contacts,
        message: body.message,
        deviceIds: body.deviceId ? [body.deviceId] : undefined,
        useRoundRobin: body.useRoundRobin || false,
      });
      return successResponse(result, { status: 201 });
    }

    // Single Message Logic
    if (!body.deviceId && !body.useRoundRobin) {
      const devices = await DeviceQueries.getActiveDevices();
      const userDevices = devices.filter((d) => d.user_id === session.user.id);
      if (userDevices.length > 0) {
        body.deviceId = userDevices[0].id;
      } else {
        return validationErrorResponse([
          { field: "deviceId", message: "No active device found" },
        ]);
      }
    }

    let mediaPath = undefined;
    let mediaType = undefined;

    if (body.media && body.media.size > 0) {
      if (body.media.type.startsWith("image/")) mediaType = "image";
      else if (body.media.type.startsWith("video/")) mediaType = "video";
      else if (body.media.type.startsWith("audio/")) mediaType = "audio";
      else mediaType = "document";

      const saved = await StorageService.saveFile(body.media, "messages");
      mediaPath = saved.path;
    }

    const result = await MessageService.sendMessage({
      user_id: session.user.id,
      device_id: body.deviceId,
      to_number: body.toNumber?.replace(/\D/g, "") || "",
      message: body.message || "",
      media_path: mediaPath,
      // @ts-ignore
      media_type: mediaType,
    });

    return successResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
