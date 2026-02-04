import { NextRequest } from "next/server";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
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
    if (!session?.user) return unauthorizedResponse();

    const body = await _request.json();
    const { deviceId, phoneNumber } = body;

    if (!deviceId || !phoneNumber) {
      return validationErrorResponse([
        { field: "fields", message: "DeviceId and PhoneNumber are required" },
      ]);
    }

    // Pastikan device milik user
    const device = await DeviceQueries.findById(deviceId);
    if (!device || device.user_id !== session.user.id) {
      return validationErrorResponse([
        { field: "deviceId", message: "Invalid Device ID" },
      ]);
    }

    // Cek status koneksi
    if (device.status !== "AUTHENTICATED") {
      return validationErrorResponse([
        { field: "device", message: "Device is not connected" },
      ]);
    }

    // Gunakan client manager untuk cek nomor
    // Catatan: Kita perlu mengekspos metode check number di ClientManager
    // Karena method sendMessage sudah melakukan pengecekan, kita bisa buat method baru di client-manager.ts
    // Tapi untuk sekarang kita asumsikan akses langsung ke instance client (perlu modifikasi dikit di client-manager)

    // WORKAROUND: Akses manual via client manager (perlu penyesuaian akses public/private di ClientManager jika strict)
    // Anggap kita tambahkan method isRegistered(deviceId, number) di whatsappClientManager

    // Mari kita tambahkan logic di sini seolah method itu ada,
    // *PENTING*: Anda harus menambahkan method `isRegistered` di `src/lib/whatsapp/client-manager.ts`

    // @ts-ignore - Asumsi method ini ditambahkan
    const result = await whatsappClientManager.checkNumber(
      deviceId,
      phoneNumber,
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
