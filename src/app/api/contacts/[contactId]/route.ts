import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import { updateContactSchema, validate } from "@/lib/validations/schemas";
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
    contactId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { contactId } = await params;
    const contact = await ContactService.getContact(contactId);

    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    return successResponse(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { contactId } = await params;
    const body = await _request.json();

    const contact = await ContactService.getContact(contactId);
    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(updateContactSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    await ContactService.updateContact(contactId, {
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      email: validation.data.email,
      tags: validation.data.tags,
    });

    const updated = await ContactService.getContact(contactId);
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

    const { contactId } = await params;
    const contact = await ContactService.getContact(contactId);

    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await ContactService.deleteContact(contactId);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
