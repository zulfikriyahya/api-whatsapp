// src/app/api/devices/[deviceId]/qr/route.ts
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import QRCode from "qrcode";

type Params = {
  params: Promise<{
    deviceId: string;
  }>;
};

/**
 * GET /api/devices/[deviceId]/qr
 * Get QR code for device authentication
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { deviceId } = await params;

    // Check if device exists and user owns it
    const device = await DeviceService.getDevice(deviceId);

    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    // Get QR code
    const { qrCode, status } = await DeviceService.getQRCode(deviceId);

    if (!qrCode) {
      return successResponse({
        qrCode: null,
        status,
        message:
          "QR code not available. Device may be authenticated or still connecting.",
      });
    }

    // Check if client wants image format
    const { searchParams } = new URL(_request.url);
    const format = searchParams.get("format");

    if (format === "image") {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrCode, {
        errorCorrectionLevel: "H",
        width: 300,
        margin: 1,
      });

      return successResponse({
        qrCode: qrDataUrl,
        qrText: qrCode,
        status,
        format: "image",
      });
    }

    // Return text format
    return successResponse({
      qrCode,
      status,
      format: "text",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
