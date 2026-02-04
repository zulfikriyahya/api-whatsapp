// src/app/api/reports/export/route.ts
import { NextRequest } from "next/server";
import { PdfExportService } from "@/lib/services/pdf-export.service";
import { MessageQueries } from "@/lib/db/queries/message.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { unauthorizedResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId") || undefined;

    // Get messages (limit to last 500 for report to avoid timeouts)
    const messages = await MessageQueries.findByDeviceId(deviceId || "", {
      limit: 500,
    });

    const buffer = await PdfExportService.generateMessageReport(messages);

    // PERBAIKAN: Cast buffer ke 'any' atau 'BodyInit' untuk menghindari error tipe TypeScript
    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="report.pdf"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
