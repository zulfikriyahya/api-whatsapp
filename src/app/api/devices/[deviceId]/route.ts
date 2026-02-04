// src/app/api/devices/[deviceId]/route.ts
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    deviceId: string;
  }>;
};

// FIX: Ubah request jadi _request
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { deviceId } = await params;

    const deviceStatus = await DeviceService.getDeviceStatus(deviceId);

    if (!deviceStatus.device) {
      return notFoundResponse("Device");
    }

    // Check ownership
    if (deviceStatus.device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    return successResponse(deviceStatus);
  } catch (error) {
    return handleApiError(error);
  }
}

// FIX: Ubah request jadi _request
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { deviceId } = await params;

    // Check if device exists and user owns it
    const device = await DeviceService.getDevice(deviceId);

    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await DeviceService.deleteDevice(deviceId);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  // PATCH tetap menggunakan request untuk body
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { deviceId } = await params;
    const body = await _request.json();

    // Check if device exists and user owns it
    const device = await DeviceService.getDevice(deviceId);

    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    // Handle reconnect action
    if (body.action === "reconnect") {
      await DeviceService.reconnectDevice(deviceId);
      return successResponse({ message: "Device reconnecting" });
    }

    return validationErrorResponse([
      { field: "action", message: "Invalid action" },
    ]);
  } catch (error) {
    return handleApiError(error);
  }
}
