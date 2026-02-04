// src/app/api/health/route.ts
import { NextRequest } from "next/server";
import { healthCheck } from "@/lib/db";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";
import { messageQueue } from "@/lib/whatsapp/message-queue";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

// PERBAIKAN: Ubah 'request' menjadi '_request'
export async function GET(_request: NextRequest) {
  try {
    const dbHealthy = await healthCheck();
    const queueStatus = messageQueue.getStatus();
    const activeClients = whatsappClientManager.getActiveClients();

    const health = {
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealthy ? "up" : "down",
        },
        messageQueue: {
          status: "up",
          queueSize: queueStatus.queueSize,
          processing: queueStatus.processing,
          pendingMessages: queueStatus.pendingMessages,
        },
        whatsappClients: {
          status: "up",
          activeClients: activeClients.length,
          clients: activeClients,
        },
      },
    };

    return successResponse(health);
  } catch (error) {
    return handleApiError(error);
  }
}
