import { DashboardStats } from "@/types/database.types";
import {
  MessageSquare,
  Smartphone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: "Active Devices",
      value: stats.active_devices,
      total: stats.total_devices,
      icon: Smartphone,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
    },
    {
      title: "Messages Today",
      value: stats.total_messages_today,
      icon: MessageSquare,
      gradient: "from-emerald-500 to-green-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
    },
    {
      title: "Success Rate",
      value: `${stats.success_rate}%`,
      icon: CheckCircle,
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-500/10",
      text: "text-violet-500",
    },
    {
      title: "Failed",
      value: stats.total_messages_failed,
      icon: AlertCircle,
      gradient: "from-red-500 to-orange-500",
      bg: "bg-red-500/10",
      text: "text-red-500",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div
            className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${card.gradient} rounded-bl-3xl w-24 h-24 flex items-start justify-end`}>
            <card.icon className="h-10 w-10 text-white" />
          </div>

          <div className="flex flex-col space-y-4 relative z-10">
            <div className={`p-3 w-fit rounded-xl ${card.bg} ${card.text}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                  {card.value}
                </h3>
                {card.total !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    / {card.total}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
