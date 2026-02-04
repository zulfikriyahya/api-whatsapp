// src/app/api/messages/send/route.ts
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import {
  sendMessageSchema,
  sendBulkMessageSchema,
  validate,
} from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

/**
 * POST /api/messages/send
 * Send a single message or bulk messages
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    // Check if it's bulk send (has contacts array)
    if (body.contacts && Array.isArray(body.contacts)) {
      return handleBulkSend(body, session.user.id);
    }

    return handleSingleSend(body, session.user.id);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Handle single message send
 */
async function handleSingleSend(body: any, userId: string) {
  // Validate request body
  const validation = validate(sendMessageSchema, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors!);
  }

  const { deviceId, toNumber, message } = validation.data;

  // Send message
  const result = await MessageService.sendMessage({
    device_id: deviceId,
    user_id: userId,
    to_number: toNumber,
    message,
  });

  return successResponse(
    {
      messageId: result.id,
      status: result.status,
      queuedAt: result.created_at,
    },
    { status: 201 },
  );
}

/**
 * Handle bulk message send
 */
async function handleBulkSend(body: any, userId: string) {
  // Validate request body
  const validation = validate(sendBulkMessageSchema, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors!);
  }

  const { deviceId, deviceIds, contacts, message, useRoundRobin } =
    validation.data;

  // Send bulk messages
  const result = await MessageService.sendBulkMessages({
    userId,
    contacts: contacts.map((c) => ({
      phoneNumber: c.phoneNumber,
      name: c.name,
    })),
    message,
    deviceIds: deviceIds || (deviceId ? [deviceId] : undefined),
    useRoundRobin,
  });

  return successResponse(
    {
      queued: result.queued,
      failed: result.failed,
      total: contacts.length,
      messages: result.messages.map((m) => ({
        id: m.id,
        toNumber: m.to_number,
        status: m.status,
      })),
    },
    { status: 201 },
  );
}
