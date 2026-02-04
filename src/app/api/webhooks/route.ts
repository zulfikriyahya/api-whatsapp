// src/app/api/webhooks/route.ts
import { NextRequest } from "next/server";
import { WebhookService } from "@/lib/services/webhook.service";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    if (!body.url || !body.events) {
      return validationErrorResponse([
        { field: "url", message: "Webhook URL is required" },
        { field: "events", message: "Events array is required" },
      ]);
    }

    const webhook = await WebhookService.createWebhook({
      url: body.url,
      events: body.events,
      user_id: session.user.id,
      secret: body.secret,
      is_active: body.is_active !== undefined ? body.is_active : true,
    });

    return successResponse(webhook, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const webhooks = await WebhookService.getUserWebhooks(session.user.id);
    return successResponse(webhooks);
  } catch (error) {
    return handleApiError(error);
  }
}
