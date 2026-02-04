// src/app/api/auth/mfa/disable/route.ts
import { NextRequest } from "next/server";
import { MFAService } from "@/lib/auth/mfa";
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

    if (!body.otp) {
      return validationErrorResponse([
        { field: "otp", message: "OTP is required" },
      ]);
    }

    const isValid = await MFAService.verifyUserOTP(session.user.id, body.otp);

    if (!isValid) {
      return validationErrorResponse([
        { field: "otp", message: "Invalid OTP" },
      ]);
    }

    await MFAService.disableMFA(session.user.id);

    return successResponse({ message: "MFA disabled successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
