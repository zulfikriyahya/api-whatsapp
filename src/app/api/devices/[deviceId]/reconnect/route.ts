// src/app/api/devices/[deviceId]/reconnect/route.ts
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    deviceId: string;
  }>;
};

// PERBAIKAN: Ubah 'request' menjadi '_request'
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;

    const device = await DeviceService.getDevice(deviceId);
    if (!device) return notFoundResponse("Device");

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await DeviceService.reconnectDevice(deviceId);

    return successResponse({ message: "Reconnection initiated" });
  } catch (error) {
    return handleApiError(error);
  }
}
