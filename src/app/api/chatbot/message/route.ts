// src/app/api/chatbot/message/route.ts
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function POST(_request: NextRequest) {
  try {
    const apiKey = _request.headers.get("x-api-key");

    if (!apiKey) {
      return unauthorizedResponse("API key is required");
    }

    const keyHash = ApiKeyQueries.hashApiKey(apiKey);
    const apiKeyRecord = await ApiKeyQueries.findByHash(keyHash);

    if (!apiKeyRecord || !apiKeyRecord.is_active) {
      return unauthorizedResponse("Invalid or inactive API key");
    }

    await ApiKeyQueries.updateLastUsed(apiKeyRecord.id);

    const body = await _request.json();

    if (!body.deviceId || !body.toNumber || !body.message) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID is required" },
        { field: "toNumber", message: "Phone number is required" },
        { field: "message", message: "Message is required" },
      ]);
    }

    const message = await MessageService.sendMessage({
      device_id: body.deviceId,
      user_id: apiKeyRecord.user_id,
      to_number: body.toNumber,
      message: body.message,
    });

    return successResponse({
      messageId: message.id,
      status: message.status,
      queuedAt: message.created_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
