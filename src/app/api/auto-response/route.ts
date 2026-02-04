// src/app/api/auto-response/route.ts
import { NextRequest } from "next/server";
import { AutoResponseQueries } from "@/lib/db/queries/auto-response.queries";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { createAutoResponseSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse, // PERBAIKAN: Ditambahkan ke import
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID is required" },
      ]);
    }

    const device = await DeviceQueries.findById(deviceId);
    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const rules = await AutoResponseQueries.findByDeviceId(deviceId);
    return successResponse(rules);
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

    const validation = validate(createAutoResponseSchema, body);
    if (!validation.success) {
      // validation.errors dijamin ada berkat perbaikan schema sebelumnya
      return validationErrorResponse(validation.errors);
    }

    const device = await DeviceQueries.findById(validation.data.deviceId);
    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const rule = await AutoResponseQueries.create({
      keyword: validation.data.keyword,
      response: validation.data.response,
      device_id: validation.data.deviceId,
      priority: validation.data.priority,
      is_active: validation.data.isActive,
    });

    return successResponse(rule, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
