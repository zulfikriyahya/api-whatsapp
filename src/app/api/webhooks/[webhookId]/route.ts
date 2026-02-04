// src/app/api/webhooks/[webhookId]/route.ts
import { NextRequest } from "next/server";
import { WebhookService } from "@/lib/services/webhook.service";
import { updateWebhookSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    webhookId: string;
  }>;
};

// FIX: Ubah request jadi _request
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { webhookId } = await params;
    const webhook = await WebhookService.getWebhook(webhookId);

    if (!webhook) {
      return notFoundResponse("Webhook");
    }

    if (webhook.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    return successResponse(webhook);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  // PATCH tetap
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { webhookId } = await params;
    const body = await _request.json();

    const webhook = await WebhookService.getWebhook(webhookId);
    if (!webhook) {
      return notFoundResponse("Webhook");
    }

    if (webhook.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(updateWebhookSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await WebhookService.updateWebhook(webhookId, validation.data);

    const updated = await WebhookService.getWebhook(webhookId);
    return successResponse(updated);
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

    const { webhookId } = await params;
    const webhook = await WebhookService.getWebhook(webhookId);

    if (!webhook) {
      return notFoundResponse("Webhook");
    }

    if (webhook.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await WebhookService.deleteWebhook(webhookId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
