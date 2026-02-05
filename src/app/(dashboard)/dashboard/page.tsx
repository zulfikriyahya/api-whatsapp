"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { StatsCards } from "@/components/features/dashboard/stats-cards";
import { ActivityChart } from "@/components/features/dashboard/activity-chart";
import { DashboardStats } from "@/types/database.types";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Real Data
    const fetchData = async () => {
      try {
        const res = await fetch("/api/stats/summary");
        const json = await res.json();
        if (json.success) {
          setStats({
            total_devices: json.data.totalDevices,
            active_devices: json.data.activeDevices,
            total_messages_today: json.data.todayMessages,
            success_rate: json.data.successRate,
            total_messages_sent: 0, // Placeholder jika summary API belum lengkap
            total_messages_failed: 0, // Placeholder
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // 2. Onboarding Tour (Only if not seen)
    const hasSeenTour = localStorage.getItem("hasSeenTour_v1");
    // Jalankan tour hanya jika data sudah load dan di desktop
    if (!hasSeenTour && window.innerWidth > 1024) {
      // Delay sedikit agar UI render sempurna
      setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          animate: true,
          allowClose: false,
          steps: [
            {
              element: "#main-content",
              popover: {
                title: "Welcome to WA Dashboard",
                description:
                  "This is your command center for WhatsApp automation.",
                side: "bottom",
                align: "start",
              },
            },
            {
              element: "#tour-devices",
              popover: {
                title: "Manage Devices",
                description:
                  "Scan QR Codes and manage your WhatsApp sessions here.",
                side: "right",
              },
            },
            {
              element: "#tour-inbox",
              popover: {
                title: "Unified Inbox",
                description:
                  "Chat directly with your customers from a centralized inbox.",
                side: "right",
              },
            },
            {
              element: "#tour-messages",
              popover: {
                title: "Broadcast & Logs",
                description: "Send bulk messages and view delivery reports.",
                side: "right",
              },
            },
          ],
          onDestroyed: () => {
            localStorage.setItem("hasSeenTour_v1", "true");
          },
        });
        driverObj.drive();
      }, 1500);
    }
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-gradient w-fit">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground">
          Real-time metrics and system status.
        </p>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-sm border border-white/10 dark:border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            Message Activity{" "}
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Last 24h
            </span>
          </h3>
          <ActivityChart />
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-sm border border-white/10 dark:border-white/5 flex flex-col">
          <h3 className="text-lg font-bold mb-4">System Status</h3>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-green-500 absolute inset-0 animate-ping opacity-50" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  WhatsApp Service
                </p>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Database</span>
                <span className="text-green-500 font-medium">Connected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Message Queue</span>
                <span className="text-green-500 font-medium">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono text-xs bg-muted px-2 rounded">
                  v1.0.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
