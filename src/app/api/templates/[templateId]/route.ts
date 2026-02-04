// src/app/api/templates/[templateId]/route.ts
import { NextRequest } from "next/server";
import { TemplateQueries } from "@/lib/db/queries/template.queries";
import { createTemplateSchema, validate } from "@/lib/validations/schemas";
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
    templateId: string;
  }>;
};

// FIX: Ubah request jadi _request
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { templateId } = await params;
    const template = await TemplateQueries.findById(templateId);

    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    return successResponse(template);
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

    const { templateId } = await params;
    const body = await _request.json();

    const template = await TemplateQueries.findById(templateId);
    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(createTemplateSchema.partial(), body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await TemplateQueries.update(templateId, validation.data);

    const updated = await TemplateQueries.findById(templateId);
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

    const { templateId } = await params;
    const template = await TemplateQueries.findById(templateId);

    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await TemplateQueries.delete(templateId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
