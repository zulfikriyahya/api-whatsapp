// src/app/api/auth/mfa/enable/route.ts
import { NextRequest } from "next/server";
import { MFAService } from "@/lib/auth/mfa";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

// PERBAIKAN: Ubah 'request' menjadi '_request' untuk menghindari error unused variable
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // PERBAIKAN LOGIKA:
    // MFAService.enableMFA membutuhkan (userId, email) dan mengembalikan { secret, qrCodeUrl }
    // Kode sebelumnya hanya mengirim userId dan menganggap return-nya string.
    const { secret, qrCodeUrl } = await MFAService.enableMFA(
      session.user.id,
      session.user.email,
    );

    // Gunakan qrCodeUrl dari service (atau buat manual jika service belum mengembalikan url yang diinginkan)
    const qrCodeData =
      qrCodeUrl ||
      `otpauth://totp/WhatsApp Dashboard:${session.user.email}?secret=${secret}&issuer=WhatsApp Dashboard`;

    return successResponse({
      secret,
      qrCodeData,
      message: "MFA enabled successfully. Please scan the QR code.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
