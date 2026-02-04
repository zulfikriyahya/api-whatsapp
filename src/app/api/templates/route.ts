// src/app/api/templates/route.ts
import { NextRequest } from "next/server";
import { TemplateQueries } from "@/lib/db/queries/template.queries";
import { createTemplateSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const templates = await TemplateQueries.findByUserId(session.user.id);
    return successResponse(templates);
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

    const validation = validate(createTemplateSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const template = await TemplateQueries.create({
      ...validation.data,
      user_id: session.user.id,
    });

    return successResponse(template, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
