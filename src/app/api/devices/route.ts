// src/app/api/devices/route.ts
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import { createDeviceSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

// Hapus parameter request
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const devices = await DeviceService.getUserDevices(session.user.id);

    return successResponse(devices);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    // Validate request body
    const validation = validate(createDeviceSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    // Create device
    const device = await DeviceService.createDevice({
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      user_id: session.user.id,
    });

    return successResponse(device, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
      return validationErrorResponse([
        { field: "ids", message: "Device IDs are required" },
      ]);
    }

    // Delete devices
    await Promise.all(ids.map((id) => DeviceService.deleteDevice(id)));

    return successResponse({ deleted: ids.length });
  } catch (error) {
    return handleApiError(error);
  }
}
