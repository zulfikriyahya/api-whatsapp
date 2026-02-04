import { StatsCards } from "@/components/features/dashboard/stats-cards";
import { ActivityChart } from "@/components/features/dashboard/activity-chart"; // Import baru
import { MessageService } from "@/lib/services/message.service";
import { DeviceService } from "@/lib/services/device.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { DashboardStats } from "@/types/database.types";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const devices = await DeviceService.getUserDevices(session.user.id);
  const messageStats = await MessageService.getMessageStats();

  const stats: DashboardStats = {
    total_devices: devices.length,
    active_devices: devices.filter(
      (d) => d.status === "AUTHENTICATED" && d.is_ready,
    ).length,
    total_messages_today: messageStats.total,
    total_messages_sent: messageStats.sent,
    total_messages_failed: messageStats.failed,
    success_rate: messageStats.successRate,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground mt-2">
          Welcome back, here's what's happening today.
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section - Mengambil 2 kolom */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            Message Activity (24h)
          </h3>
          <ActivityChart />
        </div>

        {/* Recent Activity Section - Mengambil 1 kolom */}
        <div className="glass-card p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {/* Logic untuk recent activity bisa diambil dari Audit Logs atau Messages */}
            <div className="text-sm text-muted-foreground italic">
              System running normally.
            </div>
            {/* Contoh item statis (nanti bisa diganti dynamic dari API Audit Log) */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">System Status</p>
                <p className="text-xs text-muted-foreground">
                  All services operational
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
