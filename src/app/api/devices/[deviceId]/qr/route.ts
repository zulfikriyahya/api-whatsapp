import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import QRCode from "qrcode";

type Params = { params: Promise<{ deviceId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;
    const device = await DeviceQueries.findById(deviceId);

    if (!device) return notFoundResponse("Device");
    if (device.user_id !== session.user.id) return forbiddenResponse();

    const { qrCode, status } = await DeviceService.getQRCode(deviceId);

    const { searchParams } = new URL(req.url);
    if (searchParams.get("format") === "image" && qrCode) {
      const qrImage = await QRCode.toDataURL(qrCode);
      return successResponse({ qrCode: qrImage, status, type: "image" });
    }

    return successResponse({ qrCode, status, type: "text" });
  } catch (error) {
    return handleApiError(error);
  }
}
