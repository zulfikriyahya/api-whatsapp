import { NextRequest } from "next/server";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
import { createApiKeySchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const apiKeys = await ApiKeyQueries.findByUserId(session.user.id);

    return successResponse(
      apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        is_active: key.is_active,
        last_used: key.last_used,
        created_at: key.created_at,
      })),
    );
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

    const validation = validate(createApiKeySchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { apiKey, plainKey } = await ApiKeyQueries.create({
      name: validation.data!.name,
      user_id: session.user.id,
    });

    return successResponse(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: plainKey,
        created_at: apiKey.created_at,
        warning: "Save this key securely. It will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
