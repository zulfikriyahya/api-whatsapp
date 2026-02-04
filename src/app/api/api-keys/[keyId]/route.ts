// src/app/api/api-keys/[keyId]/route.ts
import { NextRequest } from "next/server";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
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
    keyId: string;
  }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { keyId } = await params;
    const body = await _request.json();

    const apiKey = await ApiKeyQueries.findById(keyId);
    if (!apiKey) {
      return notFoundResponse("API key");
    }

    if (apiKey.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    if (body.is_active !== undefined) {
      await ApiKeyQueries.toggleActive(keyId, body.is_active);
    }

    const updated = await ApiKeyQueries.findById(keyId);
    return successResponse({
      id: updated!.id,
      name: updated!.name,
      is_active: updated!.is_active,
      last_used: updated!.last_used,
    });
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

    const { keyId } = await params;
    const apiKey = await ApiKeyQueries.findById(keyId);

    if (!apiKey) {
      return notFoundResponse("API key");
    }

    if (apiKey.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await ApiKeyQueries.delete(keyId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
