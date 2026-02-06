import { NextRequest } from "next/server";
import { healthCheck, getMetrics } from "@/lib/db";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";
import { messageQueue } from "@/lib/whatsapp/message-queue";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    messageQueue: ServiceHealth;
    whatsappClients: ServiceHealth;
    storage: ServiceHealth;
  };
  system: {
    memory: MemoryInfo;
    cpu: CpuInfo;
  };
}

interface ServiceHealth {
  status: "up" | "down" | "degraded";
  message?: string;
  metrics?: Record<string, any>;
  lastCheck?: string;
}

interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
}

interface CpuInfo {
  loadAverage: number[];
  cpuUsage: number;
}

export async function GET(_request: NextRequest) {
  try {
    const startTime = Date.now();

    const [dbHealth, queueStatus, clientMetrics, storageHealth] =
      await Promise.allSettled([
        checkDatabaseHealth(),
        checkQueueHealth(),
        checkWhatsAppClientsHealth(),
        checkStorageHealth(),
      ]);

    const health: HealthStatus = {
      status: determineOverallStatus([
        getResultValue(dbHealth)?.status,
        getResultValue(queueStatus)?.status,
        getResultValue(clientMetrics)?.status,
        getResultValue(storageHealth)?.status,
      ]),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      services: {
        database: getResultValue(dbHealth) || {
          status: "down",
          message: "Check failed",
        },
        messageQueue: getResultValue(queueStatus) || {
          status: "down",
          message: "Check failed",
        },
        whatsappClients: getResultValue(clientMetrics) || {
          status: "down",
          message: "Check failed",
        },
        storage: getResultValue(storageHealth) || {
          status: "down",
          message: "Check failed",
        },
      },
      system: {
        memory: getMemoryInfo(),
        cpu: getCpuInfo(),
      },
    };

    const responseTime = Date.now() - startTime;

    return successResponse({
      ...health,
      responseTime: `${responseTime}ms`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function HEAD(_request: NextRequest) {
  try {
    const dbHealthy = await healthCheck();

    if (!dbHealthy) {
      return new Response(null, { status: 503 });
    }

    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  try {
    const healthy = await healthCheck();
    const metrics = getMetrics();

    if (!healthy) {
      return {
        status: "down",
        message: "Database connection failed",
        lastCheck: new Date().toISOString(),
      };
    }

    const utilizationPercentage =
      metrics.activeConnections / metrics.totalConnections;

    return {
      status: utilizationPercentage > 0.8 ? "degraded" : "up",
      metrics: {
        totalConnections: metrics.totalConnections,
        activeConnections: metrics.activeConnections,
        idleConnections: metrics.idleConnections,
        queuedRequests: metrics.queuedRequests,
        utilizationPercentage: Math.round(utilizationPercentage * 100),
      },
      lastCheck: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: "down",
      message: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
}

async function checkQueueHealth(): Promise<ServiceHealth> {
  try {
    const status = messageQueue.getStatus();
    const metrics = await messageQueue.getDetailedMetrics();

    const queueUtilization = status.queueSize / 10000;

    return {
      status: queueUtilization > 0.8 ? "degraded" : "up",
      metrics: {
        queueSize: status.queueSize,
        processing: status.processing,
        pendingMessages: status.pendingMessages,
        completedToday: metrics.completedToday,
        failedToday: metrics.failedToday,
        successRate:
          metrics.completedToday > 0
            ? Math.round(
                (metrics.completedToday /
                  (metrics.completedToday + metrics.failedToday)) *
                  100,
              )
            : 100,
      },
      lastCheck: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: "down",
      message: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
}

async function checkWhatsAppClientsHealth(): Promise<ServiceHealth> {
  try {
    const activeClients = whatsappClientManager.getActiveClients();
    const clientMetrics = whatsappClientManager.getClientMetrics();

    return {
      status: clientMetrics.activeClients > 0 ? "up" : "degraded",
      metrics: {
        totalClients: clientMetrics.totalClients,
        activeClients: clientMetrics.activeClients,
        connectingClients: clientMetrics.connectingClients,
        clients: activeClients,
      },
      lastCheck: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: "down",
      message: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
}

async function checkStorageHealth(): Promise<ServiceHealth> {
  try {
    const { StorageService } = await import("@/lib/services/storage.service");
    const metrics = await StorageService.getStorageMetrics();

    const totalSizeGB = metrics.totalSize / (1024 * 1024 * 1024);

    return {
      status: totalSizeGB > 100 ? "degraded" : "up",
      metrics: {
        totalFiles: metrics.totalFiles,
        totalSizeGB: Math.round(totalSizeGB * 100) / 100,
        folders: Object.entries(metrics.folders).map(([name, data]) => ({
          name,
          files: data.files,
          sizeMB: Math.round((data.size / (1024 * 1024)) * 100) / 100,
        })),
      },
      lastCheck: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: "degraded",
      message: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
}

function getMemoryInfo(): MemoryInfo {
  const usage = process.memoryUsage();
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);

  return {
    used: usedMB,
    total: totalMB,
    percentage: Math.round((usedMB / totalMB) * 100),
  };
}

function getCpuInfo(): CpuInfo {
  const cpus = require("os").cpus();
  const usage =
    cpus.reduce((acc: number, cpu: any) => {
      const total = Object.values(cpu.times).reduce(
        (a: any, b: any) => a + b,
        0,
      );
      const idle = cpu.times.idle;
      return acc + (1 - idle / total);
    }, 0) / cpus.length;

  return {
    loadAverage: require("os").loadavg(),
    cpuUsage: Math.round(usage * 100),
  };
}

function determineOverallStatus(
  statuses: (string | undefined)[],
): "healthy" | "degraded" | "unhealthy" {
  const validStatuses = statuses.filter(Boolean);

  if (validStatuses.some((s) => s === "down")) {
    return "unhealthy";
  }

  if (validStatuses.some((s) => s === "degraded")) {
    return "degraded";
  }

  return "healthy";
}

function getResultValue<T>(result: PromiseSettledResult<T>): T | undefined {
  return result.status === "fulfilled" ? result.value : undefined;
}
