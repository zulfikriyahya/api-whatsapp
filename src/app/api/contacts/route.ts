import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import { createContactSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
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
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const contacts = await ContactService.getUserContacts(session.user.id, {
      search,
      limit,
      offset,
    });

    const total = await ContactService.countUserContacts(session.user.id);

    return paginatedResponse(contacts, page, limit, total);
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

    const validation = validate(createContactSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const contact = await ContactService.createContact({
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      email: validation.data.email || null,
      tags: validation.data.tags || [],
      user_id: session.user.id,
    });

    return successResponse(contact, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
      return validationErrorResponse([
        { field: "ids", message: "Contact IDs are required" },
      ]);
    }

    const deleted = await ContactService.deleteMultipleContacts(ids);

    return successResponse({ deleted });
  } catch (error) {
    return handleApiError(error);
  }
}
