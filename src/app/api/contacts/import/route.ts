// src/app/api/contacts/import/route.ts
import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const formData = await _request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return validationErrorResponse([
        { field: "file", message: "File is required" },
      ]);
    }

    const content = await file.text();
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    let result;

    if (fileExtension === "csv") {
      result = await ContactService.importFromCSV(content, session.user.id);
    } else if (fileExtension === "vcf") {
      result = await ContactService.importFromVCF(content, session.user.id);
    } else {
      return validationErrorResponse([
        { field: "file", message: "Only CSV and VCF files are supported" },
      ]);
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
