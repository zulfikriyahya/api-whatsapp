import { NextRequest } from "next/server";
import { AutoResponseQueries } from "@/lib/db/queries/auto-response.queries";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { createAutoResponseSchema, validate } from "@/lib/validations/schemas";
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
    ruleId: string;
  }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { ruleId } = await params;
    const body = await _request.json();

    const rule = await AutoResponseQueries.findById(ruleId);
    if (!rule) {
      return notFoundResponse("Auto-response rule");
    }

    const device = await DeviceQueries.findById(rule.device_id);
    if (!device || device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(createAutoResponseSchema.partial(), body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await AutoResponseQueries.update(ruleId, validation.data);

    const updated = await AutoResponseQueries.findById(ruleId);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { ruleId } = await params;
    const rule = await AutoResponseQueries.findById(ruleId);

    if (!rule) {
      return notFoundResponse("Auto-response rule");
    }

    const device = await DeviceQueries.findById(rule.device_id);
    if (!device || device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await AutoResponseQueries.delete(ruleId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
