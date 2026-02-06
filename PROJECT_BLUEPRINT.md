# PROJECT BLUEPRINT
Generated: 6/2/2026, 21.52.52

## FRONTEND

### Description
UI components, pages, layouts, styling, and client-side logic.

### Path: src/app/(auth)/layout.tsx
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/30 blur-[100px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-400/30 blur-[100px] animate-pulse-slow" />
      <div className="w-full max-w-md z-10 p-4">{children}</div>
    </div>
  );
}

```

### Path: src/app/(auth)/login/page.tsx
```typescript
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Smartphone } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="glass p-8 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 mb-6 shadow-lg">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gradient">Welcome Back</h1>
        <p className="text-muted-foreground">
          Sign in to manage your WhatsApp devices
        </p>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-6 py-4 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
    </div>
  );
}

```

### Path: src/app/(dashboard)/admin/audit-logs/page.tsx
```typescript
import { AuditLogViewer } from "@/components/features/audit-logs/audit-log-viewer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";
import { redirect } from "next/navigation";

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.DST)
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          System Audit Logs
        </h2>
        <p className="text-muted-foreground mt-1">
          Track system activities and security events.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <AuditLogViewer />
      </div>
    </div>
  );
}

```

### Path: src/app/(dashboard)/admin/users/page.tsx
```typescript
import { UserManagement } from "@/components/features/admin/user-management";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          User Administration
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage system users, roles and access.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <UserManagement />
      </div>
    </div>
  );
}

```

### Path: src/app/(dashboard)/contacts/page.tsx
```typescript
import { ContactManager } from "@/components/features/contacts/contact-manager";

export default function ContactsPage() {
  return (
    <div className="w-full">
      <ContactManager />
    </div>
  );
}

```

### Path: src/app/(dashboard)/dashboard/loading.tsx
```typescript
export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

```

### Path: src/app/(dashboard)/dashboard/page.tsx
```typescript
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
            total_messages_sent: 0,
            total_messages_failed: 0,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const hasSeenTour = localStorage.getItem("hasSeenTour_v1");
    if (!hasSeenTour && window.innerWidth > 1024) {
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

```

### Path: src/app/(dashboard)/developer/api-docs/page.tsx
```typescript
import { Code, Lock } from "lucide-react";

export default function ApiDocsPage() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/messages/send",
      desc: "Send a message via specific device.",
      auth: "API Key Header (x-api-key)",
      body: {
        deviceId: "uuid",
        toNumber: "string (phone)",
        message: "string",
      },
    },
    {
      method: "POST",
      path: "/api/tools/validate-number",
      desc: "Check if a number is registered.",
      auth: "Session / API Key",
      body: {
        deviceId: "uuid",
        phoneNumber: "string",
      },
    },
    {
      method: "GET",
      path: "/api/devices",
      desc: "List all connected devices.",
      auth: "API Key",
      body: null,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          API Documentation
        </h2>
        <p className="text-muted-foreground mt-1">
          Integration guide for Chatbots and External Apps.
        </p>
      </div>

      <div className="grid gap-6">
        {endpoints.map((ep, idx) => (
          <div
            key={idx}
            className="glass-card p-6 rounded-2xl border-l-4 border-l-primary relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-mono font-bold text-sm">
                {ep.method}
              </span>
              <span className="font-mono text-lg font-medium">{ep.path}</span>
            </div>

            <p className="text-muted-foreground mb-4">{ep.desc}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-xl border border-border">
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <Lock size={12} /> Authentication
                </h4>
                <code className="text-sm font-mono text-foreground">
                  {ep.auth}
                </code>
              </div>

              {ep.body && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-50">
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                    <Code size={12} /> Payload (JSON)
                  </h4>
                  <pre className="text-xs font-mono">
                    {JSON.stringify(ep.body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

```

### Path: src/app/(dashboard)/devices/[deviceId]/settings/page.tsx
```typescript
import { AutoResponseList } from "@/components/features/auto-response/auto-response-list";
import { DeviceService } from "@/lib/services/device.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { notFound, redirect } from "next/navigation";
import { Smartphone, ChevronLeft } from "lucide-react";
import Link from "next/link";

type Params = {
  params: Promise<{
    deviceId: string;
  }>;
};

export default async function DeviceSettingsPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { deviceId } = await params;
  const device = await DeviceService.getDevice(deviceId);

  if (!device) notFound();
  if (device.user_id !== session.user.id) redirect("/devices");

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <Link
          href="/devices"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit mb-2 group">
          <ChevronLeft
            size={16}
            className="mr-1 group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to Devices
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg text-white">
              <Smartphone size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                {device.name}
              </h2>
              <p className="text-muted-foreground font-mono text-sm mt-1">
                {device.phone_number}
              </p>
            </div>
          </div>

          <div
            className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border shadow-sm ${
              device.status === "AUTHENTICATED"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
            }`}>
            {device.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-border/50">
            <AutoResponseList deviceId={deviceId} />
          </div>
        </div>
      </div>
    </div>
  );
}

```

### Path: src/app/(dashboard)/devices/page.tsx
```typescript
"use client";

import { useState } from "react";
import { DeviceList } from "@/components/features/devices/device-list";
import { AddDeviceModal } from "@/components/features/devices/add-device-modal";
import { Plus } from "lucide-react";

export default function DevicesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDeviceAdded = () => {
    setIsAddModalOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Device Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Connect and manage your WhatsApp instances
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all font-medium">
          <Plus size={18} /> Add Device
        </button>
      </div>

      <DeviceList refreshTrigger={refreshTrigger} />

      {isAddModalOpen && (
        <AddDeviceModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleDeviceAdded}
        />
      )}
    </div>
  );
}

```

### Path: src/app/(dashboard)/inbox/page.tsx
```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Loader2,
  MessageSquare,
  Phone,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ChatItem {
  id: string; // Group ID (remote number)
  name: string;
  number: string;
  lastMessage: string;
  time: string;
  isGroup: boolean;
  unreadCount: number;
}

interface MessageItem {
  id: string;
  text: string;
  isMe: boolean;
  time: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "READ";
}

export default function InboxPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"private" | "group">("private");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/inbox/conversations");
      const json = await res.json();
      if (json.success) setChats(json.data);
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Polling inbox list
    return () => clearInterval(interval);
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    setLoadingMessages(true);
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/inbox/messages?chatId=${selectedChat}`);
        const json = await res.json();
        if (json.success) setMessages(json.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMsgs();
    // Realtime polling for active chat
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = chats.filter((c) =>
    activeTab === "group" ? c.isGroup : !c.isGroup,
  );

  const handleSend = async () => {
    if (!inputText.trim() || !selectedChat) return;

    const textToSend = inputText;
    setInputText(""); // Clear input immediately (Optimistic)

    // Optimistic Update
    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: textToSend,
        isMe: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "PENDING",
      },
    ]);

    try {
      // Send API Request
      // Note: For simplicity, we assume the backend finds the best device or last used device for this chat
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // In a real scenario, you'd pass the specific deviceId associated with this chat thread
          // Here we might rely on backend logic to pick active device for the user
          toNumber: selectedChat,
          message: textToSend,
          // deviceId: "auto" // Backend handles this
        }),
      });

      // Refresh messages to get real ID and status
      const res = await fetch(`/api/inbox/messages?chatId=${selectedChat}`);
      const json = await res.json();
      if (json.success) setMessages(json.data);
    } catch (e) {
      console.error("Send failed", e);
      // Handle error state visually if needed
    }
  };

  const selectedChatData = chats.find((c) => c.id === selectedChat);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Sidebar List */}
      <div
        className={cn(
          "w-full md:w-80 flex flex-col glass-card rounded-2xl overflow-hidden transition-all",
          selectedChat ? "hidden md:flex" : "flex",
        )}>
        <div className="p-4 border-b border-border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Inbox
          </h2>
          <div className="flex bg-muted/50 p-1 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab("private")}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
                activeTab === "private"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}>
              Private
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
                activeTab === "group"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}>
              Groups
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/30 border border-input text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Search conversations..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loadingChats ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading chats...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 p-4 text-center">
              <MessageSquare size={40} className="mb-2" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={cn(
                  "p-4 flex gap-3 cursor-pointer transition-all hover:bg-muted/40 border-b border-border/30 last:border-0",
                  selectedChat === chat.id &&
                    "bg-primary/10 border-l-4 border-l-primary pl-3",
                )}>
                <Avatar className="h-10 w-10 border border-border/50">
                  <AvatarFallback
                    className={cn(
                      "font-bold text-white",
                      selectedChat === chat.id
                        ? "bg-primary"
                        : "bg-gradient-to-br from-gray-400 to-gray-500",
                    )}>
                    {chat.name?.substring(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-semibold truncate text-sm text-foreground">
                      {chat.name || chat.number}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground truncate w-full pr-2">
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div
        className={cn(
          "flex-1 flex flex-col glass-card rounded-2xl overflow-hidden transition-all",
          !selectedChat ? "hidden md:flex" : "flex",
        )}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-border flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 -ml-2 mr-1 hover:bg-muted rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {selectedChatData?.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    {selectedChatData?.name || selectedChat}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedChatData?.number}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors">
                  <Phone size={18} />
                </button>
                <button className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors">
                  <Video size={18} />
                </button>
                <button className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-[url('/chat-bg-pattern.png')] bg-repeat bg-[length:400px] bg-opacity-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-background/90 backdrop-blur-[2px]" />{" "}
              {/* Overlay for better text readability */}
              <div className="relative h-full overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center pt-10">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full animate-in slide-in-from-bottom-2 duration-300",
                        msg.isMe ? "justify-end" : "justify-start",
                      )}>
                      <div
                        className={cn(
                          "px-4 py-2 rounded-2xl shadow-sm max-w-[85%] md:max-w-[70%] relative group",
                          msg.isMe
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-white dark:bg-slate-800 border border-border/50 rounded-tl-sm",
                        )}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </p>
                        <div
                          className={cn(
                            "text-[10px] mt-1 flex justify-end items-center gap-1 opacity-70",
                            msg.isMe
                              ? "text-primary-foreground"
                              : "text-muted-foreground",
                          )}>
                          <span>{msg.time}</span>
                          {msg.isMe && (
                            <span>
                              {msg.status === "READ"
                                ? "✓✓"
                                : msg.status === "DELIVERED"
                                  ? "✓✓"
                                  : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t border-border bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-10">
              <div className="flex items-end gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                <button className="p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <Paperclip size={20} />
                </button>
                <textarea
                  className="flex-1 max-h-32 min-h-[44px] py-2.5 px-2 bg-transparent outline-none text-sm resize-none scrollbar-hide"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="p-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none shrink-0">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-40 select-none">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6 animate-pulse">
              <MessageSquare size={48} />
            </div>
            <h3 className="text-xl font-bold mb-2">Welcome to Inbox</h3>
            <p className="text-sm max-w-xs text-center">
              Select a conversation from the sidebar to start chatting or view
              messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

```

### Path: src/app/(dashboard)/layout.tsx
```typescript
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { GlowingCursor } from "@/components/ui/glowing-cursor";
import { Footer } from "@/components/layout/footer";
import Lenis from "@studio-freight/lenis";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Initialize Smooth Scrolling (Lenis)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Visual Effect */}
      <GlowingCursor />

      {/* Sidebar Layout */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 z-50 shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto scrollbar-hide relative"
        id="main-content">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 w-full glass border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-end md:justify-end min-h-[64px] transition-all">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 p-4 md:p-8 w-full max-w-[1600px] mx-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>

        {/* Sticky Footer (at bottom of content) */}
        <Footer />
      </main>
    </div>
  );
}

```

### Path: src/app/(dashboard)/messages/bulk/page.tsx
```typescript
import { BulkSender } from "@/components/features/messages/bulk-sender";

export default function BulkMessagesPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          Bulk Sender
        </h2>
        <p className="text-muted-foreground mt-1">
          Broadcast messages to multiple contacts efficiently.
        </p>
      </div>
      <BulkSender />
    </div>
  );
}

```

### Path: src/app/(dashboard)/messages/page.tsx
```typescript
"use client";

import { useState } from "react";
import { MessageList } from "@/components/features/messages/message-list";
import { NewMessageModal } from "@/components/features/messages/new-message-modal";
import { Send } from "lucide-react";

export default function MessagesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMessageSent = () => {
    setIsModalOpen(false);
    // Trigger refresh pada list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Messages
          </h2>
          <p className="text-muted-foreground mt-1">
            View history and send new messages
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium">
          <Send size={18} />
          New Message
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <MessageList refreshTrigger={refreshTrigger} />
      </div>

      {isModalOpen && (
        <NewMessageModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleMessageSent}
        />
      )}
    </div>
  );
}

```

### Path: src/app/(dashboard)/settings/page.tsx
```typescript
import { UserSettings } from "@/components/features/settings/user-settings";

export default function SettingsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          Account Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage your security preferences and API keys.
        </p>
      </div>
      <UserSettings />
    </div>
  );
}

```

### Path: src/app/(dashboard)/status/page.tsx
```typescript
"use client";

import { useState } from "react";
import {
  Plus,
  Eye,
  Image as ImageIcon,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";

interface StatusItem {
  id: number;
  text: string;
  time: Date;
  views: number;
  type: "text" | "image" | "video";
  mediaUrl?: string;
}

export default function StatusPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>([
    // Contoh data awal (nantinya fetch API)
    {
      id: 1,
      text: "Special Offer Today!",
      time: new Date(Date.now() - 1000 * 60 * 10),
      views: 24,
      type: "text",
    },
    {
      id: 2,
      text: "Product Launch.jpg",
      time: new Date(Date.now() - 1000 * 60 * 60),
      views: 56,
      type: "image",
    },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          WhatsApp Status
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage and post status updates to your connected devices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Add New Status Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center border-dashed border-2 border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all group h-[200px]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <Plus size={28} />
          </div>
          <h3 className="font-bold text-foreground">Add New Status</h3>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Post text or media to all active devices
          </p>
        </div>

        {/* Status Cards */}
        {statuses.map((status) => (
          <div
            key={status.id}
            className="glass-card p-5 rounded-2xl relative overflow-hidden group h-[200px] flex flex-col justify-between hover:shadow-lg transition-all border border-white/10">
            <div className="flex justify-between items-start">
              <div
                className={`p-2 rounded-xl ${
                  status.type === "text"
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-purple-500/10 text-purple-600"
                }`}>
                {status.type === "text" ? (
                  <FileText size={20} />
                ) : (
                  <ImageIcon size={20} />
                )}
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="flex-1 flex items-center">
              <h3 className="font-bold text-lg line-clamp-2 leading-tight">
                {status.text}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
              <span>{format(status.time, "HH:mm")}</span>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Eye size={14} /> {status.views}
              </div>
            </div>

            {/* Decorative background blur */}
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}

```

### Path: src/app/(dashboard)/templates/page.tsx
```typescript
import { TemplateManager } from "@/components/features/templates/template-manager";

export default function TemplatesPage() {
  return (
    <div className="w-full">
      <TemplateManager />
    </div>
  );
}

```

### Path: src/app/(dashboard)/tools/validator/page.tsx
```typescript
"use client";

import { useState, useEffect } from "react";
import { DeviceViewModel } from "@/types/database.types";
import {
  Search,
  CheckCircle,
  XCircle,
  Smartphone,
  Loader2,
} from "lucide-react";

export default function ValidatorPage() {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{
    registered: boolean;
    formattedNumber?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/devices")
      .then((r) => r.json())
      .then((data) => {
        if (data.success)
          setDevices(
            data.data.filter((d: any) => d.status === "AUTHENTICATED"),
          );
      });
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !phone) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/tools/validate-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: selectedDevice, phoneNumber: phone }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          Number Validator
        </h2>
        <p className="text-muted-foreground mt-1">
          Check if a phone number is registered on WhatsApp.
        </p>
      </div>

      <div className="glass-card p-8 rounded-2xl shadow-sm">
        <form onSubmit={handleCheck} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Active Device (Checker)
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <select
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                required>
                <option value="">-- Select Device --</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone_number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Target Phone Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="e.g. 62812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedDevice}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : "Check Number"}
          </button>
        </form>

        {result !== null && (
          <div
            className={`mt-8 p-6 rounded-xl border flex items-center gap-4 ${result.registered ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
            {result.registered ? (
              <div className="p-3 bg-green-500 rounded-full text-white shadow-lg shadow-green-500/30">
                <CheckCircle size={32} />
              </div>
            ) : (
              <div className="p-3 bg-red-500 rounded-full text-white shadow-lg shadow-red-500/30">
                <XCircle size={32} />
              </div>
            )}
            <div>
              <h4 className="text-xl font-bold">
                {result.registered
                  ? "Registered on WhatsApp"
                  : "Not Registered"}
              </h4>
              <p className="text-muted-foreground font-mono mt-1">
                Formatted: {result.formattedNumber || phone}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

```

### Path: src/components/features/admin/user-management.tsx
```typescript
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { User } from "@/types/database.types";
import { format } from "date-fns";
import { Shield, Ban, CheckCircle, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users?limit=50");
    const json = await res.json();
    if (json.success) setUsers(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (user: User) => {
    const newStatus = !user.is_active;
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newStatus }),
    });
    fetchUsers();
  };

  const columns = [
    {
      header: "User",
      cell: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
            {user.name?.[0]?.toUpperCase() || <UserIcon size={16} />}
          </div>
          <div>
            <div className="font-semibold text-foreground">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (user: User) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border",
            user.role === "ADMIN"
              ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
              : "bg-blue-500/10 text-blue-600 border-blue-500/20",
          )}>
          <Shield size={12} /> {user.role}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (user: User) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
            user.is_active
              ? "bg-green-500/10 text-green-600 border-green-500/20"
              : "bg-red-500/10 text-red-600 border-red-500/20",
          )}>
          {user.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Joined",
      cell: (user: User) => (
        <span className="text-sm text-muted-foreground font-mono">
          {format(new Date(user.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (user: User) => (
        <div className="flex justify-end">
          <button
            onClick={() => toggleStatus(user)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              user.is_active
                ? "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
            )}>
            {user.is_active ? (
              <>
                <Ban size={14} /> Deactivate
              </>
            ) : (
              <>
                <CheckCircle size={14} /> Activate
              </>
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-border/50">
        <div className="text-sm font-medium text-muted-foreground">
          Total Users:{" "}
          <span className="text-foreground font-bold">{users.length}</span>
        </div>
      </div>
      <DataTable data={users} columns={columns} isLoading={loading} />
    </div>
  );
}

```

### Path: src/components/features/audit-logs/audit-log-viewer.tsx
```typescript
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { AuditLog } from "@/types/database.types";
import { format } from "date-fns";
import { Eye, Clock, Activity, Server } from "lucide-react";

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await fetch(`/api/audit-logs?page=${page}&limit=20`);
    const json = await res.json();
    if (json.success) {
      setLogs(json.data);
      setTotal(json.meta?.pagination?.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const columns = [
    {
      header: "Timestamp",
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <Clock size={14} />
          {format(new Date(row.created_at), "MMM d, HH:mm:ss")}
        </div>
      ),
    },
    {
      header: "Action",
      accessorKey: "action" as keyof AuditLog,
      cell: (row: AuditLog) => (
        <span className="font-semibold text-foreground">{row.action}</span>
      ),
    },
    {
      header: "Entity",
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-muted text-xs font-medium text-muted-foreground uppercase">
            {row.entity_type}
          </span>
          <span className="text-xs font-mono text-muted-foreground opacity-70">
            {row.entity_id ? row.entity_id.substring(0, 8) : "-"}
          </span>
        </div>
      ),
    },
    {
      header: "IP Address",
      accessorKey: "ip_address" as keyof AuditLog,
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Server size={12} />
          {row.ip_address || "N/A"}
        </div>
      ),
    },
    {
      header: "Details",
      className: "text-right",
      cell: (row: AuditLog) => (
        <div className="flex justify-end">
          <button
            onClick={() => setSelectedLog(row)}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable data={logs} columns={columns} isLoading={loading} />

      <div className="flex justify-between items-center text-sm pt-4 border-t border-border/50">
        <div className="text-muted-foreground">
          Total: <span className="font-bold text-foreground">{total}</span> logs
        </div>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
            Previous
          </button>
          <button
            disabled={logs.length < 20}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
            Next
          </button>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Log Details</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedLog.id}
                </p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Action
                  </label>
                  <p className="font-medium text-foreground">
                    {selectedLog.action}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    User Agent
                  </label>
                  <p
                    className="text-sm text-muted-foreground truncate"
                    title={selectedLog.user_agent || ""}>
                    {selectedLog.user_agent || "-"}
                  </p>
                </div>
              </div>

              {selectedLog.old_value && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Old
                    Value
                  </label>
                  <pre className="rounded-xl bg-slate-950 text-slate-50 p-4 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-green-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> New
                    Value
                  </label>
                  <pre className="rounded-xl bg-slate-950 text-slate-50 p-4 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

### Path: src/components/features/auto-response/auto-response-list.tsx
```typescript
"use client";

import { useState, useEffect } from "react";
import { AutoResponseRule } from "@/types/database.types";
import { Trash2, Edit2, Plus, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AutoResponseListProps {
  deviceId: string;
}

export function AutoResponseList({ deviceId }: AutoResponseListProps) {
  const [rules, setRules] = useState<AutoResponseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    keyword: "",
    response: "",
    priority: 0,
    isActive: true,
  });

  const fetchRules = async () => {
    const res = await fetch(`/api/auto-response?deviceId=${deviceId}`);
    const json = await res.json();
    if (json.success) setRules(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, [deviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId
      ? `/api/auto-response/${editingId}`
      : "/api/auto-response";
    const method = editingId ? "PATCH" : "POST";
    const body = editingId ? formData : { ...formData, deviceId };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    closeModal();
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    await fetch(`/api/auto-response/${id}`, { method: "DELETE" });
    fetchRules();
  };

  const openModal = (rule?: AutoResponseRule) => {
    if (rule) {
      setEditingId(rule.id);
      setFormData({
        keyword: rule.keyword,
        response: rule.response,
        priority: rule.priority,
        isActive: rule.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({ keyword: "", response: "", priority: 0, isActive: true });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  if (loading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Zap className="text-yellow-500" size={20} /> Auto-Reply Rules
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure automated responses for incoming messages.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
          <Plus size={16} /> Add Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">
              No auto-reply rules configured.
            </p>
          </div>
        )}
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 group hover:border-primary/30 transition-all">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm font-bold bg-muted px-3 py-1 rounded-lg border border-border text-foreground">
                  {rule.keyword}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border",
                    rule.is_active
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-gray-500/10 text-gray-500 border-gray-500/20",
                  )}>
                  {rule.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-md">
                  Priority: {rule.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-1 border-l-2 border-primary/20">
                {rule.response}
              </p>
            </div>

            <div className="flex gap-2 self-start sm:self-center opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openModal(rule)}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-xl mb-1">
              {editingId ? "Edit Rule" : "New Rule"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Define keyword triggers and responses.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Keyword Trigger
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formData.keyword}
                  onChange={(e) =>
                    setFormData({ ...formData, keyword: e.target.value })
                  }
                  placeholder="e.g. !help, info"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Response Message
                </label>
                <textarea
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 h-32 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  value={formData.response}
                  onChange={(e) =>
                    setFormData({ ...formData, response: e.target.value })
                  }
                  placeholder="Enter the automated reply..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Priority
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center",
                        formData.isActive ? "bg-primary" : "bg-muted",
                      )}>
                      <div
                        className={cn(
                          "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                          formData.isActive ? "translate-x-6" : "translate-x-0",
                        )}
                      />
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                      Active
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-muted-foreground font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

### Path: src/components/features/contacts/contact-manager.tsx
```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Contact } from "@/types/database.types";
import {
  Plus,
  Trash2,
  Upload,
  User,
  Phone,
  Tag,
  Loader2,
  Mail,
  Download,
  MoreHorizontal,
  Edit,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isAllSelected, setIsAllSelected] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    tags: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      const json = await res.json();
      if (json.success) setContacts(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle Select All
  useEffect(() => {
    if (isAllSelected) {
      const newSelection: Record<string, boolean> = {};
      contacts.forEach((c) => (newSelection[c.id] = true));
      setSelectedRows(newSelection);
    } else {
      // Hanya reset jika trigger dari checkbox header, bukan update manual row
      if (
        Object.keys(selectedRows).length === contacts.length &&
        contacts.length > 0
      ) {
        setSelectedRows({});
      }
    }
  }, [isAllSelected]);

  // Handle manual row selection update to sync header checkbox
  useEffect(() => {
    const selectedCount = Object.values(selectedRows).filter(Boolean).length;
    if (selectedCount === contacts.length && contacts.length > 0) {
      setIsAllSelected(true);
    } else if (selectedCount < contacts.length) {
      setIsAllSelected(false);
    }
  }, [selectedRows, contacts.length]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create");

      setShowModal(false);
      setFormData({ name: "", phoneNumber: "", email: "", tags: "" });
      fetchContacts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Object.keys(selectedRows).filter((k) => selectedRows[k]);
    if (ids.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${ids.length} contacts? This action cannot be undone.`,
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?ids=${ids.join(",")}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setSelectedRows({});
        setIsAllSelected(false);
        fetchContacts();
      } else {
        alert("Failed to delete contacts");
      }
    } catch (e) {
      alert("Network error during deletion");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // CSV Template
    const csvContent =
      'data:text/csv;charset=utf-8,name,phone_number,email,tags\nJohn Doe,62812345678,john@example.com,"vip,new customer"';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "contact_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        alert(
          `Successfully imported: ${json.data.imported} contacts.\nFailed: ${json.data.failed}`,
        );
        fetchContacts();
      } else {
        alert(json.error?.message || "Import failed");
      }
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
          checked={isAllSelected}
          onChange={(e) => setIsAllSelected(e.target.checked)}
        />
      ),
      cell: (row: Contact) => (
        <input
          type="checkbox"
          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
          checked={!!selectedRows[row.id]}
          onChange={(e) =>
            setSelectedRows((prev) => ({ ...prev, [row.id]: e.target.checked }))
          }
        />
      ),
      className: "w-[50px]",
    },
    {
      header: "Avatar",
      cell: (row: Contact) => (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-sm text-blue-600 dark:text-blue-400">
          {row.name.substring(0, 1).toUpperCase()}
        </div>
      ),
      className: "w-[60px]",
    },
    {
      header: "Name",
      accessorKey: "name" as keyof Contact,
      className: "font-medium text-foreground",
    },
    {
      header: "Phone",
      cell: (row: Contact) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm">{row.phone_number}</span>
          {row.email && (
            <span className="text-[10px] text-muted-foreground">
              {row.email}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Tags",
      cell: (row: Contact) => {
        const tags = Array.isArray(row.tags) ? row.tags : [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                {t}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row: Contact) => (
        <div className="flex justify-end gap-2">
          <button className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this contact?")) {
                // Single delete logic
                fetch(`/api/contacts?ids=${row.id}`, { method: "DELETE" }).then(
                  fetchContacts,
                );
              }
            }}
            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Contacts
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.vcf"
            onChange={handleFileChange}
          />

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-border hover:bg-muted transition-colors font-medium text-sm shadow-sm">
            <Download size={16} /> Template
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-border hover:bg-muted transition-colors font-medium text-sm shadow-sm">
            <Upload size={16} /> Import
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium text-sm shadow-md shadow-primary/20">
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-1 shadow-sm overflow-hidden">
        <DataTable data={contacts} columns={columns} isLoading={loading} />
      </div>

      {/* Sticky Bulk Action Bar */}
      {Object.values(selectedRows).filter(Boolean).length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass bg-foreground/90 text-background backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl animate-in slide-in-from-bottom-4 border border-white/10">
          <div className="flex items-center gap-2 border-r border-white/20 pr-6">
            <span className="font-bold text-sm bg-white/20 px-2 py-0.5 rounded text-white">
              {Object.values(selectedRows).filter(Boolean).length}
            </span>
            <span className="text-sm font-medium text-white/90">Selected</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedRows({});
                setIsAllSelected(false);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg shadow-red-500/30">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="text-xl font-bold">Add New Contact</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Manual entry
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} className="text-primary" /> Full Name
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone size={16} className="text-primary" /> Phone Number
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. 62812345678"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  required
                />
                <p className="text-[10px] text-muted-foreground ml-1">
                  Must include country code (e.g., 62)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail size={16} className="text-primary" /> Email Address
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="optional@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag size={16} className="text-primary" /> Tags
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. vip, new lead (comma separated)"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-muted-foreground font-medium hover:bg-muted transition-colors text-sm"
                  disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm flex items-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

### Path: src/components/features/dashboard/activity-chart.tsx
```typescript
"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface ChartData {
  hour: string;
  count: number;
}

export function ActivityChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data 24 jam terakhir
    fetch("/api/stats?groupBy=hour")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.hourlyStats) {
          // Format data agar sesuai dengan Recharts
          const formatted = json.data.hourlyStats.map((item: any) => ({
            hour: item.hour, // Format jam dari API
            count: item.count,
          }));
          setData(formatted);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-muted/10 rounded-xl animate-pulse">
        <div className="text-muted-foreground">Loading statistics...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center glass-card rounded-xl">
        <div className="text-muted-foreground">No activity data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis
            dataKey="hour"
            tickFormatter={(str) => format(new Date(str), "HH:mm")}
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
            }}
            labelFormatter={(label) => format(new Date(label), "PPP HH:mm")}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="url(#colorCount)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

```

### Path: src/components/features/dashboard/stats-cards.tsx
```typescript
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

```

### Path: src/components/features/devices/add-device-modal.tsx
```typescript
"use client";

import { useState } from "react";
import { X, Smartphone, Loader2, Phone } from "lucide-react";

interface AddDeviceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddDeviceModal({ onClose, onSuccess }: AddDeviceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to add device");
      }

      // Berhasil
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-bold text-xl">Add New Device</h3>
            <p className="text-sm text-muted-foreground">
              Register a WhatsApp number.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Smartphone size={16} className="text-muted-foreground" /> Device
              Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g. Sales CS 1"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone size={16} className="text-muted-foreground" /> Phone Number
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g. 62812345678"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phoneNumber: e.target.value.replace(/\D/g, ""),
                })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter number with country code (e.g., 62 for Indonesia).
            </p>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

```

### Path: src/components/features/devices/device-list.tsx
```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { DeviceViewModel, DeviceStatus } from "@/types/database.types";
import { Trash2, RefreshCcw, QrCode, Smartphone, Loader2 } from "lucide-react";
import { DeviceQRModal } from "./device-qr-modal";
import { cn } from "@/lib/utils/cn";

export function DeviceList() {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalDevice, setQrModalDevice] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const json = await res.json();
      if (json.success) setDevices(json.data);
    } catch (e) {
      console.error("Failed to fetch devices", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling status setiap 5 detik agar realtime
  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus device ini? Sesi WhatsApp akan terputus.")) return;
    try {
      await fetch(`/api/devices/${id}`, { method: "DELETE" });
      fetchDevices(); // Refresh list immediate
    } catch (e) {
      alert("Gagal menghapus device");
    }
  };

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.AUTHENTICATED:
        return "bg-green-500";
      case DeviceStatus.CONNECTED:
        return "bg-emerald-400";
      case DeviceStatus.QR_READY:
        return "bg-yellow-400";
      case DeviceStatus.DISCONNECTED:
        return "bg-gray-400";
      case DeviceStatus.ERROR:
        return "bg-red-500";
      default:
        return "bg-blue-400";
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="animate-spin mx-auto mb-2" />
        Loading devices...
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center p-10 glass-card rounded-2xl border-dashed border-2">
        <Smartphone className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Belum ada device</h3>
        <p className="text-muted-foreground">
          Tambahkan device baru untuk mulai mengirim pesan.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
                    device.status === DeviceStatus.AUTHENTICATED
                      ? "bg-green-500"
                      : "bg-slate-400",
                  )}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-base truncate max-w-[150px]">
                    {device.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {device.phone_number}
                  </p>
                </div>
              </div>
              <div
                title={device.status}
                className={cn(
                  "w-3 h-3 rounded-full shadow-sm animate-pulse",
                  getStatusColor(device.status),
                )}
              />
            </div>

            <div className="space-y-4 mt-2">
              <div className="flex justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                <span>
                  Status: <b>{device.status}</b>
                </span>
                {device.message_count !== undefined && (
                  <span>{device.message_count} Pesan</span>
                )}
              </div>

              <div className="flex gap-2">
                {device.status !== DeviceStatus.AUTHENTICATED && (
                  <button
                    onClick={() =>
                      setQrModalDevice({ id: device.id, name: device.name })
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                    <QrCode size={14} /> Scan QR
                  </button>
                )}

                {device.status === DeviceStatus.AUTHENTICATED && (
                  <button
                    onClick={() =>
                      fetch(`/api/devices/${device.id}/reconnect`, {
                        method: "POST",
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80">
                    <RefreshCcw size={14} /> Re-Sync
                  </button>
                )}

                <button
                  onClick={() => handleDelete(device.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Hapus Device">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {qrModalDevice && (
        <DeviceQRModal
          deviceId={qrModalDevice.id}
          deviceName={qrModalDevice.name}
          onClose={() => setQrModalDevice(null)}
          onConnected={() => {
            setQrModalDevice(null);
            fetchDevices();
          }}
        />
      )}
    </>
  );
}

```

### Path: src/components/features/devices/device-qr-modal.tsx
```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { DeviceStatus } from "@/types/database.types";
import Image from "next/image";

interface Props {
  deviceId: string;
  deviceName: string;
  onClose: () => void;
  onConnected: () => void;
}

export function DeviceQRModal({
  deviceId,
  deviceName,
  onClose,
  onConnected,
}: Props) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [status, setStatus] = useState<DeviceStatus>(DeviceStatus.CONNECTING);
  const [error, setError] = useState("");

  const fetchQR = useCallback(async () => {
    try {
      // Panggil API dengan format=image agar dapat base64 langsung
      const res = await fetch(`/api/devices/${deviceId}/qr?format=image`);
      const json = await res.json();

      if (json.success) {
        setStatus(json.data.status);

        // Jika status authenticated, trigger success
        if (
          json.data.status === DeviceStatus.AUTHENTICATED ||
          json.data.status === DeviceStatus.CONNECTED
        ) {
          onConnected();
          return true; // Stop polling
        }

        // Update QR Image jika ada
        if (json.data.qrCode) {
          setQrImage(json.data.qrCode);
        }
      } else {
        setError(json.error?.message || "Gagal mengambil QR");
      }
    } catch (e) {
      console.error(e);
      setError("Koneksi terputus");
    }
    return false;
  }, [deviceId, onConnected]);

  // Polling QR setiap 3 detik
  useEffect(() => {
    fetchQR();
    const interval = setInterval(async () => {
      const stop = await fetchQR();
      if (stop) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchQR]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full z-10">
          <X size={20} />
        </button>

        <div className="p-6 text-center">
          <h3 className="font-bold text-xl mb-1">Link Device</h3>
          <p className="text-sm text-muted-foreground mb-6">{deviceName}</p>

          <div className="min-h-[250px] flex items-center justify-center bg-muted/20 rounded-xl border border-dashed border-muted mb-4 relative">
            {status === DeviceStatus.AUTHENTICATED ? (
              <div className="text-green-500 flex flex-col items-center animate-in zoom-in">
                <CheckCircle size={64} className="mb-2" />
                <span className="font-bold">Connected!</span>
              </div>
            ) : qrImage ? (
              <div className="p-4 bg-white rounded-xl shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImage}
                  alt="Scan QR"
                  className="w-56 h-56 object-contain"
                />
              </div>
            ) : error ? (
              <div className="text-red-500 flex flex-col items-center px-4">
                <AlertTriangle size={48} className="mb-2 opacity-50" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <Loader2 size={40} className="animate-spin mb-2 text-primary" />
                <span className="text-xs">
                  Menunggu QR Code dari WhatsApp...
                </span>
              </div>
            )}
          </div>

          <div className="text-left text-sm space-y-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
            <p className="font-semibold text-blue-700 dark:text-blue-300">
              Cara Scan:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground text-xs">
              <li>Buka WhatsApp di HP Anda</li>
              <li>Menu &gt; Perangkat Tertaut &gt; Tautkan Perangkat</li>
              <li>Arahkan kamera ke QR Code di atas</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

```

### Path: src/components/features/messages/bulk-sender.tsx
```typescript
"use client";

import { useState, useEffect } from "react";
import {
  DeviceViewModel,
  Contact,
  MessageTemplate,
} from "@/types/database.types";
import { Send, Users, FileText, Loader2, Tag, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function BulkSender() {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: string; text: string } | null>(
    null,
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/devices").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ]).then(([d, c, t]) => {
      if (d.success)
        setDevices(d.data.filter((dev: any) => dev.status === "AUTHENTICATED"));
      if (c.success) setContacts(c.data);
      if (t.success) setTemplates(t.data);
    });
  }, []);

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  const filteredContacts =
    selectedTags.length > 0
      ? contacts.filter(
          (c) => c.tags && c.tags.some((tag) => selectedTags.includes(tag)),
        )
      : [];

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tpl = templates.find((t) => t.id === e.target.value);
    if (tpl) setMessage(tpl.content);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSend = async () => {
    if (!selectedDevice || filteredContacts.length === 0 || !message) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDevice,
          contacts: filteredContacts.map((c) => ({
            phoneNumber: c.phone_number,
            name: c.name,
          })),
          message: message,
          useRoundRobin: false,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatus({
          type: "success",
          text: `Successfully queued ${json.data.queued} messages`,
        });
        setMessage("");
        setSelectedTags([]);
      } else {
        setStatus({
          type: "error",
          text: json.error?.message || "Failed to send",
        });
      }
    } catch (e) {
      setStatus({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-8">
        <div className="glass-card p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-border pb-4">
            <Users size={20} className="text-primary" /> Target Audience
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2">
              <Tag size={14} className="text-muted-foreground" /> Filter by Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                    selectedTags.includes(tag)
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-background border-input text-muted-foreground hover:bg-muted hover:border-border",
                  )}>
                  {tag}
                </button>
              ))}
              {allTags.length === 0 && (
                <span className="text-sm text-muted-foreground italic">
                  No tags found in contacts.
                </span>
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Total Recipients
            </span>
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {filteredContacts.length}
            </span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-border pb-4">
            <FileText size={20} className="text-primary" /> Message Content
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Load Template
            </label>
            <select
              className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              onChange={handleTemplateSelect}>
              <option value="">-- Select Template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="w-full rounded-xl bg-muted/50 border border-input px-4 py-3 h-48 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono resize-none"
            placeholder="Type your broadcast message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            {["{{name}}", "{{phone}}"].map((v) => (
              <span
                key={v}
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-mono cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setMessage((prev) => prev + v)}>
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass-card p-6 rounded-2xl shadow-sm h-full flex flex-col">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-border pb-4">
            <Send size={20} className="text-primary" /> Configuration
          </h3>

          <div className="mb-8">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Smartphone size={14} className="text-muted-foreground" /> Sender
              Device
            </label>
            <select
              className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}>
              <option value="">-- Select Active Device --</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone_number})
                </option>
              ))}
            </select>
            {devices.length === 0 && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                No active devices found. Please connect a device first.
              </p>
            )}
          </div>

          {status && (
            <div
              className={cn(
                "p-4 rounded-xl mb-6 text-sm font-medium border animate-in fade-in zoom-in-95",
                status.type === "success"
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-red-500/10 text-red-600 border-red-500/20",
              )}>
              {status.text}
            </div>
          )}

          <div className="mt-auto">
            <button
              onClick={handleSend}
              disabled={
                loading ||
                filteredContacts.length === 0 ||
                !selectedDevice ||
                !message
              }
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex justify-center items-center gap-3">
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              Send Broadcast
            </button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Messages will be queued and sent sequentially to avoid spam
              detection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

```

### Path: src/components/features/messages/message-list.tsx
```typescript
"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Message, MessageStatus } from "@/types/database.types";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { RefreshCcw, Search } from "lucide-react";

// Update Interface Props
interface MessageListProps {
  refreshTrigger?: number;
}

export function MessageList({ refreshTrigger = 0 }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchMessages = async () => {
    // setLoading(true); // Opsional: disable agar tidak flash saat auto-refresh
    try {
      let url = `/api/messages?page=${page}&limit=10`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setMessages(json.data);
        setTotal(json.meta?.pagination?.total || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Effect untuk refresh trigger & pagination
  useEffect(() => {
    fetchMessages();
  }, [page, refreshTrigger]); // Hapus 'search' dari sini jika ingin search hanya via tombol/enter

  // Effect khusus untuk debounce search (opsional) atau search on enter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchMessages();
      else setPage(1); // Ini akan trigger effect pertama
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const columns = [
    {
      header: "Date",
      cell: (row: Message) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">
            {format(new Date(row.created_at), "MMM d")}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {format(new Date(row.created_at), "HH:mm")}
          </span>
        </div>
      ),
    },
    {
      header: "Device",
      cell: (row: any) => (
        <span
          className="text-xs text-muted-foreground max-w-[100px] truncate block"
          title={row.device_name}>
          {row.device_name || "Unknown"}
        </span>
      ),
    },
    {
      header: "To",
      accessorKey: "to_number" as keyof Message,
      className: "font-mono text-xs",
    },
    {
      header: "Message",
      cell: (row: Message) => (
        <span
          className="block max-w-[200px] md:max-w-xs truncate text-sm text-foreground/80"
          title={row.message}>
          {row.message}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: Message) => {
        const colors: Record<string, string> = {
          [MessageStatus.PENDING]:
            "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
          [MessageStatus.QUEUED]:
            "text-orange-600 bg-orange-500/10 border-orange-500/20",
          [MessageStatus.SENDING]:
            "text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse",
          [MessageStatus.SENT]:
            "text-blue-600 bg-blue-600/10 border-blue-600/20",
          [MessageStatus.DELIVERED]:
            "text-indigo-600 bg-indigo-600/10 border-indigo-600/20",
          [MessageStatus.READ]:
            "text-green-600 bg-green-600/10 border-green-600/20",
          [MessageStatus.FAILED]:
            "text-red-600 bg-red-600/10 border-red-600/20",
        };
        const colorClass =
          colors[row.status] ||
          "text-gray-600 bg-gray-500/10 border-gray-500/20";
        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
              colorClass,
            )}>
            {row.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar & Manual Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-input text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={fetchMessages}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground"
          title="Refresh">
          <RefreshCcw size={18} />
        </button>
      </div>

      <DataTable data={messages} columns={columns} isLoading={loading} />

      {/* Pagination */}
      <div className="flex justify-between items-center pt-2">
        <p className="text-xs text-muted-foreground">Total: {total} messages</p>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button
            disabled={messages.length < 10}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

```

### Path: src/components/features/messages/new-message-modal.tsx
```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Loader2,
  Smartphone,
  User,
  FileText,
  MessageSquare,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";
import {
  DeviceViewModel,
  Contact,
  MessageTemplate,
} from "@/types/database.types";

interface NewMessageModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewMessageModal({ onClose, onSuccess }: NewMessageModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const [selectedDevice, setSelectedDevice] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, conRes, tplRes] = await Promise.all([
          fetch("/api/devices"),
          fetch("/api/contacts"),
          fetch("/api/templates"),
        ]);
        const devJson = await devRes.json();
        const conJson = await conRes.json();
        const tplJson = await tplRes.json();

        if (devJson.success) {
          const active = devJson.data.filter(
            (d: any) => d.status === "AUTHENTICATED",
          );
          setDevices(active);
          if (active.length === 1) setSelectedDevice(active[0].id);
        }
        if (conJson.success) setContacts(conJson.data);
        if (tplJson.success) setTemplates(tplJson.data);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data.");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tpl = templates.find((t) => t.id === e.target.value);
    if (tpl) setMessage(tpl.content);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !toNumber) {
      setError("Device dan Nomor Tujuan wajib diisi.");
      return;
    }
    if (!message && !selectedFile) {
      setError("Isi pesan atau pilih file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // PENTING: Gunakan FormData untuk support File Upload
      const formData = new FormData();
      formData.append("deviceId", selectedDevice);
      formData.append("toNumber", toNumber.replace(/\D/g, ""));
      formData.append("message", message);

      if (selectedFile) {
        formData.append("media", selectedFile);
      }

      // API Routes akan membaca ini dengan req.formData()
      const res = await fetch("/api/messages/send", {
        method: "POST",
        body: formData,
        // Jangan set Content-Type header manual saat pakai FormData, browser akan handle boundary-nya
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message || "Gagal mengirim pesan");

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-bold text-xl">Kirim Pesan</h3>
            <p className="text-sm text-muted-foreground">
              Kirim pesan teks atau media.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {fetching ? (
            <div className="py-10 text-center">
              <Loader2 className="animate-spin mx-auto text-primary" />
            </div>
          ) : (
            <form id="msg-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Smartphone size={16} /> Sender Device
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  required>
                  <option value="">-- Pilih Device --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} /> Nomor Tujuan
                </label>
                <input
                  list="contacts-list"
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="08123xxxxx"
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                  required
                />
                <datalist id="contacts-list">
                  {contacts.map((c) => (
                    <option key={c.id} value={c.phone_number}>
                      {c.name}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText size={16} /> Template
                </label>
                <select
                  className="w-full px-4 py-2 rounded-xl bg-muted/30 border border-input text-sm"
                  onChange={handleTemplateChange}
                  defaultValue="">
                  <option value="" disabled>
                    -- Load Template --
                  </option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare size={16} /> Pesan / Caption
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
                  placeholder="Ketik pesan..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Media Upload Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Paperclip size={16} /> Lampiran Media (Opsional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,application/pdf"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                  {selectedFile ? (
                    <div className="flex items-center gap-3 text-sm text-primary font-medium">
                      <ImageIcon size={20} /> {selectedFile.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-red-500 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm">
                      <span className="font-semibold text-primary">
                        Klik upload
                      </span>{" "}
                      atau drag file
                      <br />
                      <span className="text-xs">
                        (Gambar, Video, PDF max 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted"
            disabled={loading}>
            Batal
          </button>
          <button
            form="msg-form"
            type="submit"
            disabled={loading || fetching || !selectedDevice}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg flex items-center gap-2">
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}{" "}
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}

```

### Path: src/components/features/messages/send-message-form.tsx
```typescript
"use client";

import { useState, useEffect } from "react";
import { DeviceViewModel } from "@/types/database.types";
import { Send, Loader2, Smartphone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SendMessageForm() {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/devices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDevices(
            data.data.filter(
              (d: DeviceViewModel) => d.status === "AUTHENTICATED",
            ),
          );
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDevice,
          toNumber: phone,
          message: message,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setStatus({ type: "success", text: "Message queued successfully" });
        setMessage("");
        setPhone("");
      } else {
        setStatus({
          type: "error",
          text: json.error?.message || "Failed to send",
        });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm border border-border/50">
      <h3 className="mb-6 text-xl font-bold flex items-center gap-2 border-b border-border pb-4">
        <Send className="text-primary" size={20} /> Quick Send
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium flex items-center gap-2">
            <Smartphone size={14} className="text-muted-foreground" /> Select
            Device
          </label>
          <select
            className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            required
          >
            <option value="">-- Choose a device --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.phone_number})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Phone Number
          </label>
          <input
            type="text"
            className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            placeholder="e.g. 628123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Include country code (e.g. 62)
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium flex items-center gap-2">
            <MessageSquare size={14} className="text-muted-foreground" />{" "}
            Message
          </label>
          <textarea
            className="w-full rounded-xl bg-muted/50 border border-input px-4 py-3 h-32 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {status && (
          <div
            className={cn(
              "rounded-xl p-4 text-sm font-medium border animate-in fade-in slide-in-from-top-2",
              status.type === "success"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-red-500/10 text-red-600 border-red-500/20",
            )}
          >
            {status.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedDevice}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 text-white font-medium hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
          Send Message
        </button>
      </form>
    </div>
  );
}

```

### Path: src/components/features/settings/user-settings.tsx
```typescript
"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  RefreshCw,
  Shield,
  Key,
  Check,
  Save,
  Loader2,
  Bell,
  Lock,
  Globe,
} from "lucide-react";
import { format } from "date-fns";

interface UserPreferences {
  notifications_enabled?: boolean;
  mfa_enabled?: boolean;
  timezone?: string;
  theme?: "light" | "dark" | "system";
}

interface ApiKey {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used?: string;
}

export function UserSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<UserPreferences>({});
  const [saving, setSaving] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchKeys();
    fetchSettings();
  }, []);

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/api-keys");
      const json = await res.json();
      if (json.success) setApiKeys(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) setSettings(json.data || {});
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "user",
          settings: settings,
        }),
      });
      // Optional: Add toast notification here
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setSaving(false);
    }
  };

  const createKey = async () => {
    const name = prompt(
      "Enter a name for this API Key (e.g. Zapier Integration):",
    );
    if (!name) return;

    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (json.success) {
      setNewKey(json.data.key);
      fetchKeys();
    }
  };

  const revokeKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API Key? Any application using it will stop working.",
      )
    )
      return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    fetchKeys();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      {/* SECTION 1: General Preferences */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-primary" size={20} /> General Preferences
          </h3>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium text-sm shadow-lg shadow-primary/20 disabled:opacity-50 hover:-translate-y-0.5">
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Notifications */}
          <div className="flex items-center justify-between pb-6 border-b border-border/50">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 h-fit">
                <Bell size={20} />
              </div>
              <div>
                <p className="font-semibold text-lg">Email Notifications</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Receive email alerts for new logins, failed message queues,
                  and system updates.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notifications_enabled || false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications_enabled: e.target.checked,
                  })
                }
              />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* MFA */}
          <div className="flex items-center justify-between pb-6 border-b border-border/50">
            <div className="flex gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 h-fit">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-semibold text-lg">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Secure your account with TOTP (Google Authenticator/Authy).
                </p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors">
              Configure
            </button>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl text-green-600 h-fit">
                <Globe size={20} />
              </div>
              <div>
                <p className="font-semibold text-lg">Timezone</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Set your local timezone for accurate reporting and scheduling.
                </p>
              </div>
            </div>
            <select
              className="px-4 py-2 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={
                settings.timezone ||
                Intl.DateTimeFormat().resolvedOptions().timeZone
              }
              onChange={(e) =>
                setSettings({ ...settings, timezone: e.target.value })
              }>
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: API Keys Management */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Key className="text-primary" size={20} /> API Keys
          </h3>
          <button
            onClick={createKey}
            className="flex items-center gap-2 bg-white dark:bg-white/5 border border-border px-4 py-2 rounded-xl hover:bg-muted transition-colors text-sm font-medium hover:shadow-sm">
            <RefreshCw size={14} /> Generate New Key
          </button>
        </div>

        <div className="p-6 space-y-6">
          {newKey && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 animate-in slide-in-from-top-2 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500 rounded-full text-white mt-1">
                  <Check size={16} />
                </div>
                <div className="flex-1">
                  <p className="mb-2 text-base font-bold text-green-700 dark:text-green-400">
                    New API Key Generated!
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please copy this key immediately. For security reasons, it
                    will not be shown again.
                  </p>
                  <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-input shadow-inner">
                    <code className="flex-1 overflow-hidden text-ellipsis font-mono text-sm text-primary font-bold">
                      {newKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newKey)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
                      title="Copy to clipboard">
                      {copied ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {loadingKeys ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-muted rounded-xl">
                <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  No API keys found. Create one to integrate external apps.
                </p>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border p-4 bg-background/50 hover:bg-background transition-colors group">
                  <div className="mb-3 sm:mb-0">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{key.name}</p>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${key.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                        {key.is_active ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground font-mono">
                      <span>
                        Created:{" "}
                        {format(new Date(key.created_at), "MMM d, yyyy")}
                      </span>
                      {key.last_used && (
                        <span>
                          Last Used:{" "}
                          {format(new Date(key.last_used), "MMM d, HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors">
                      Revoke
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

```

### Path: src/components/features/templates/template-manager.tsx
```typescript
"use client";

import { useState, useEffect } from "react";
import { MessageTemplate } from "@/types/database.types";
import { Plus, Trash2, Edit2, FileText, Code } from "lucide-react";

export function TemplateManager() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await fetch("/api/templates");
    const json = await res.json();
    if (json.success) setTemplates(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/templates/${editing.id}` : "/api/templates";
    const method = editing ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });

    closeModal();
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  const openModal = (tpl?: MessageTemplate) => {
    if (tpl) {
      setEditing(tpl);
      setName(tpl.name);
      setContent(tpl.content);
    } else {
      setEditing(null);
      setName("");
      setContent("");
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  if (loading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Message Templates
          </h2>
          <p className="text-muted-foreground mt-1">
            Create reusable message patterns
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium"
        >
          <Plus size={18} /> New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="glass-card rounded-2xl p-6 flex flex-col group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText size={100} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText size={16} />
                </span>
                {tpl.name}
              </h3>

              <div className="flex-grow bg-muted/50 rounded-xl p-3 mb-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono border border-border">
                {tpl.content}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  onClick={() => openModal(tpl)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold">
                {editing ? "Edit Template" : "New Template"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome Message"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex justify-between">
                  Content
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Code size={12} /> Supports {"{{variables}}"}
                  </span>
                </label>
                <textarea
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-3 h-40 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hello {{name}}, welcome to our service!"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-muted-foreground font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

### Path: src/components/layout/footer.tsx
```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [timezone, setTimezone] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Set Timezone di Client Side untuk menghindari Hydration Error
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="w-full py-4 px-6 md:px-8 border-t border-white/10 glass mt-auto z-40 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
      <div className="flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-3 md:gap-0">
        <div className="flex items-center gap-2">
          <p>&copy; {currentYear} WhatsApp Dashboard.</p>
          <span className="hidden md:inline text-muted-foreground/30">|</span>
          <p>Version 1.0.0</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono bg-background/50 px-3 py-1 rounded-full border border-border/50">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>{timezone}</span>
            <span className="text-foreground font-bold">{currentTime}</span>
          </div>

          <div className="flex gap-4">
            <Link
              href="#"
              className="hover:text-primary transition-colors hover:underline">
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="hover:text-primary transition-colors hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

```

### Path: src/components/layout/sidebar.tsx
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { UserRole } from "@/types/database.types";
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Users,
  FileText,
  Settings,
  ShieldAlert,
  LogOut,
  Wrench,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Radio,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState, useEffect } from "react";
import { useWindowSize } from "react-use";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { width } = useWindowSize();

  // Auto hide (icon only) on medium screens
  useEffect(() => {
    if (width < 1024) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
    // Close mobile sidebar on resize
    if (width >= 768) {
      setIsMobileOpen(false);
    }
  }, [width]);

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-blue-500",
    },
    { label: "Inbox", icon: Inbox, href: "/inbox", color: "text-green-500" },
    {
      label: "Devices",
      icon: Smartphone,
      href: "/devices",
      color: "text-violet-500",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/messages",
      color: "text-pink-500",
    },
    { label: "Status", icon: Radio, href: "/status", color: "text-yellow-500" },
    {
      label: "Contacts",
      icon: Users,
      href: "/contacts",
      color: "text-orange-500",
    },
    {
      label: "Templates",
      icon: FileText,
      href: "/templates",
      color: "text-emerald-500",
    },
    {
      label: "Tools",
      icon: Wrench,
      href: "/tools/validator",
      color: "text-cyan-500",
    },
    {
      label: "API Docs",
      icon: BookOpen,
      href: "/developer/api-docs",
      color: "text-indigo-500",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      color: "text-gray-500",
    },
  ];

  if (userRole === UserRole.ADMIN) {
    routes.push({
      label: "Admin Users",
      icon: ShieldAlert,
      href: "/admin/users",
      color: "text-red-500",
    });
  }

  // Mobile Overlay
  const MobileOverlay = () => (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300",
        isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      onClick={() => setIsMobileOpen(false)}
    />
  );

  return (
    <>
      <MobileOverlay />

      {/* Mobile Toggle Button (Visible only on mobile) */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-background border border-border rounded-lg shadow-lg">
        <Menu size={20} />
      </button>

      <div
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col h-full bg-sidebar border-r border-sidebar-border shadow-xl transition-all duration-300 ease-in-out",
          // Mobile Width Logic
          isMobileOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full md:translate-x-0",
          // Desktop Collapse Logic
          !isMobileOpen && (isCollapsed ? "md:w-20" : "md:w-72"),
        )}>
        <div className="h-16 px-4 flex items-center justify-between border-b border-sidebar-border/50">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 group transition-all duration-300",
              isCollapsed && "md:justify-center md:w-full",
            )}>
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 shadow-lg group-hover:shadow-blue-500/25 transition-all">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 whitespace-nowrap animate-in fade-in duration-300">
                WA Dash
              </h1>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-8 bg-background border border-border rounded-full p-1 shadow-md hover:bg-accent hover:text-accent-foreground transition-all z-50">
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 scrollbar-hide">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsMobileOpen(false)} // Close mobile menu on click
              id={`tour-${route.label.toLowerCase().replace(" ", "-")}`}
              className={cn(
                "flex items-center p-3 rounded-xl transition-all duration-200 group relative",
                pathname === route.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                isCollapsed && !isMobileOpen ? "justify-center" : "",
              )}
              title={isCollapsed && !isMobileOpen ? route.label : undefined}>
              <route.icon
                className={cn(
                  "h-5 w-5 transition-colors shrink-0",
                  route.color,
                  (!isCollapsed || isMobileOpen) && "mr-3",
                )}
              />
              {(!isCollapsed || isMobileOpen) && (
                <span className="text-sm font-medium truncate animate-in fade-in slide-in-from-left-2 duration-300">
                  {route.label}
                </span>
              )}
              {isCollapsed && !isMobileOpen && pathname === route.href && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/50">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex items-center w-full p-3 rounded-xl transition-all hover:bg-red-500/10 hover:text-red-500 text-muted-foreground group",
              isCollapsed && !isMobileOpen ? "justify-center" : "",
            )}
            title="Sign Out">
            <LogOut
              className={cn(
                "h-5 w-5 shrink-0 group-hover:scale-110 transition-transform",
                (!isCollapsed || isMobileOpen) && "mr-3",
              )}
            />
            {(!isCollapsed || isMobileOpen) && (
              <span className="font-medium text-sm">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

```

### Path: src/components/layout/user-nav.tsx
```typescript
"use client";

import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, CreditCard } from "lucide-react";
import Link from "next/link";

export function UserNav() {
  const { data: session } = useSession();

  // Ambil inisial nama jika tidak ada foto
  const initials = session?.user?.name
    ? session.user.name.substring(0, 2).toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all hover:scale-105 active:scale-95 shadow-sm overflow-hidden border-2 border-white/20">
          <Avatar className="h-full w-full">
            <AvatarImage
              src={session?.user?.image || ""}
              alt={session?.user?.name || "User"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-violet-600 text-white font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 p-2 glass bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-white/20"
        align="end"
        forceMount>
        <DropdownMenuLabel className="font-normal p-3 bg-muted/40 rounded-lg mb-1">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-foreground truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground font-medium truncate">
              {session?.user?.email}
            </p>
            <div className="pt-1 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase border border-primary/20">
                {session?.user?.role}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2 bg-border/50" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/billing" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2 bg-border/50" />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-600 dark:focus:text-red-400 font-medium cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

```

### Path: src/components/ui/avatar.tsx
```typescript
"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils/cn";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

```

### Path: src/components/ui/badge.tsx
```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25",
        warning:
          "border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/25",
        info: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

```

### Path: src/components/ui/button.tsx
```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg shadow-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg shadow-destructive/20",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 border border-white/10 text-foreground backdrop-blur-md shadow-sm",
        gradient:
          "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-lg hover:shadow-blue-500/25 border-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

```

### Path: src/components/ui/data-table.tsx
```typescript
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
}

export function DataTable<T>({ data, columns, isLoading }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center glass-card rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center glass-card rounded-xl border-dashed">
        <p className="text-muted-foreground font-medium">No records found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/20 dark:border-white/10 overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-white/10">
            {columns.map((col, idx) => (
              <TableHead
                key={idx}
                className={cn(
                  "font-semibold text-foreground/80",
                  col.className,
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow
              key={rowIdx}
              className="border-white/10 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <TableCell key={colIdx} className={col.className}>
                  {col.cell
                    ? col.cell(row)
                    : col.accessorKey
                      ? (row[col.accessorKey] as ReactNode)
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

```

### Path: src/components/ui/dropdown-menu.tsx
```typescript
"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl p-1 text-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl p-1 text-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent/50 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-muted/50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border/50", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};

```

### Path: src/components/ui/error-boundary.tsx
```typescript
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6 mb-6 shadow-xl shadow-red-500/10">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            Something went wrong
          </h2>
          <p className="max-w-md text-muted-foreground mb-8 text-lg">
            {this.state.error?.message ||
              "An unexpected error occurred while processing your request."}
          </p>
          <button
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5"
            onClick={() => this.setState({ hasError: false })}
          >
            <RefreshCw size={18} /> Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

```

### Path: src/components/ui/glass-card.tsx
```typescript
import { cn } from "@/lib/utils/cn";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export function GlassCard({
  children,
  className,
  gradient,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl border border-white/20 dark:border-white/5 shadow-lg backdrop-blur-md transition-all duration-300",
        gradient &&
          "bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-900/40 dark:to-slate-900/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

```

### Path: src/components/ui/glowing-cursor.tsx
```typescript
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function GlowingCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pastikan kode hanya berjalan di client-side
    if (typeof window === "undefined") return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    // Disable pada perangkat touch/mobile
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (!cursor || !follower || isTouchDevice) return;

    const onMouseMove = (e: MouseEvent) => {
      // Cursor utama bergerak instan
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0,
      });
      // Follower bergerak dengan delay (smooth)
      gsap.to(follower, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.4,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", onMouseMove);

    // Hide cursor saat meninggalkan window
    const onMouseLeave = () => {
      gsap.to([cursor, follower], { opacity: 0, duration: 0.2 });
    };

    // Show cursor saat masuk window
    const onMouseEnter = () => {
      gsap.to([cursor, follower], { opacity: 1, duration: 0.2 });
    };

    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block overflow-hidden">
      <div
        ref={cursorRef}
        className="absolute w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
      />
      <div
        ref={followerRef}
        className="absolute w-8 h-8 border border-primary/40 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[1px]"
      />
    </div>
  );
}

```

### Path: src/components/ui/table.tsx
```typescript
import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

```

### Path: src/components/ui/theme-toggle.tsx
```typescript
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative rounded-full p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
      title="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

```

### Path: src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.75rem;

    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased transition-colors duration-300;
  }
  html {
    scroll-behavior: smooth;
  }
}

@layer utilities {
  .glass {
    @apply bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg supports-[backdrop-filter]:bg-white/60;
  }

  .glass-card {
    @apply bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300;
  }

  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400;
  }

  /* Custom Scrollbar Hide */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}

```

### Path: src/app/layout.tsx
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { messageQueue } from "@/lib/whatsapp/message-queue";

if (typeof window === "undefined") {
  messageQueue.loadPendingMessages().catch(console.error);
}
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhatsApp Web Dashboard",
  description: "Multi-device WhatsApp messaging platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background selection:bg-primary selection:text-primary-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

```

### Path: src/app/page.tsx
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}

```

### Path: src/app/providers.tsx
```typescript
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

```

### Path: src/app/error.tsx
```typescript
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center shadow-xl border-red-500/10">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          Application Error
        </h2>
        <p className="text-muted-foreground mb-8">
          Something went wrong. Please try again later.
        </p>

        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover:shadow-lg"
        >
          <RefreshCw size={18} /> Try Again
        </button>
      </div>
    </div>
  );
}

```

### Path: src/app/loading.tsx
```typescript
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

```

### Path: src/app/not-found.tsx
```typescript
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-float" />

      <div className="glass-card p-12 rounded-3xl shadow-2xl text-center max-w-lg mx-4 relative z-10 border-white/20 dark:border-white/5">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 mb-2">
          404
        </h1>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

```

### Path: postcss.config.js
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

```

### Path: tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle":
          "linear-gradient(to right bottom, hsl(var(--background)), hsl(var(--secondary)))",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;

```

### Path: next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["whatsapp-web.js", "mysql2", "puppeteer", "pdfkit"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    APP_URL: process.env.NEXTAUTH_URL,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        stream: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
  output: "standalone",
};

module.exports = nextConfig;

```

## BACKEND

### Description
API routes, database, services, authentication, middleware, and server-side logic.

### Path: src/app/api/admin/stats/route.ts
```typescript
import { query, queryOne } from "@/lib/db";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const [
      totalUsers,
      activeUsers,
      totalDevices,
      activeDevices,
      totalMessages,
      todayMessages,
      usersByRole,
      messagesByStatus,
      devicesByStatus,
    ] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users"),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE is_active = true",
      ),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM devices"),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM devices WHERE status = ? AND is_ready = true",
        ["AUTHENTICATED"],
      ),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM messages"),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = CURDATE()",
      ),
      query<any[]>("SELECT role, COUNT(*) as count FROM users GROUP BY role"),
      query<any[]>(
        "SELECT status, COUNT(*) as count FROM messages GROUP BY status",
      ),
      query<any[]>(
        "SELECT status, COUNT(*) as count FROM devices GROUP BY status",
      ),
    ]);

    return successResponse({
      users: {
        total: totalUsers?.count || 0,
        active: activeUsers?.count || 0,
        byRole: usersByRole,
      },
      devices: {
        total: totalDevices?.count || 0,
        active: activeDevices?.count || 0,
        byStatus: devicesByStatus,
      },
      messages: {
        total: totalMessages?.count || 0,
        today: todayMessages?.count || 0,
        byStatus: messagesByStatus,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/admin/users/[userId]/route.ts
```typescript
// src/app/api/admin/users/[userId]/route.ts
import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

type Params = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const { userId } = await params;
    const body = await _request.json();

    const user = await queryOne("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      return notFoundResponse("User");
    }

    const updates: string[] = [];
    const updateParams: any[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      updateParams.push(body.name);
    }

    if (body.role !== undefined) {
      updates.push("role = ?");
      updateParams.push(body.role);
    }

    if (body.is_active !== undefined) {
      updates.push("is_active = ?");
      updateParams.push(body.is_active);
    }

    if (updates.length === 0) {
      return validationErrorResponse([
        { field: "body", message: "No fields to update" },
      ]);
    }

    updates.push("updated_at = NOW()");
    updateParams.push(userId);

    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      updateParams,
    );

    const updated = await queryOne("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// Gunakan _request karena parameter pertama wajib ada untuk mengakses params
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const { userId } = await params;

    if (userId === session.user.id) {
      return forbiddenResponse("Cannot delete your own account");
    }

    const user = await queryOne("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      return notFoundResponse("User");
    }

    await query("DELETE FROM users WHERE id = ?", [userId]);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/admin/users/route.ts
```typescript
// src/app/api/admin/users/route.ts
import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let sql = `
      SELECT id, email, name, role, is_active, mfa_enabled, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += " AND (email LIKE ? OR name LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const users = await query(sql, params);

    const countResult: any = await queryOne(
      "SELECT COUNT(*) as total FROM users",
    );
    const total = countResult?.total || 0;

    return paginatedResponse(users, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const body = await _request.json();

    if (!body.email || !body.name) {
      return validationErrorResponse([
        { field: "email", message: "Email is required" },
        { field: "name", message: "Name is required" },
      ]);
    }

    const existing = await queryOne("SELECT * FROM users WHERE email = ?", [
      body.email,
    ]);

    if (existing) {
      return validationErrorResponse([
        { field: "email", message: "Email already exists" },
      ]);
    }

    const id = uuidv4();
    await query(
      `INSERT INTO users (id, email, name, role, is_active, mfa_enabled)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.email,
        body.name,
        body.role || UserRole.USER_A,
        body.is_active !== undefined ? body.is_active : true,
        false,
      ],
    );

    const user = await queryOne("SELECT * FROM users WHERE id = ?", [id]);

    return successResponse(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/api-keys/[keyId]/route.ts
```typescript
// src/app/api/api-keys/[keyId]/route.ts
import { NextRequest } from "next/server";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    keyId: string;
  }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { keyId } = await params;
    const body = await _request.json();

    const apiKey = await ApiKeyQueries.findById(keyId);
    if (!apiKey) {
      return notFoundResponse("API key");
    }

    if (apiKey.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    if (body.is_active !== undefined) {
      await ApiKeyQueries.toggleActive(keyId, body.is_active);
    }

    const updated = await ApiKeyQueries.findById(keyId);
    return successResponse({
      id: updated!.id,
      name: updated!.name,
      is_active: updated!.is_active,
      last_used: updated!.last_used,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// FIX: Ubah request jadi _request
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { keyId } = await params;
    const apiKey = await ApiKeyQueries.findById(keyId);

    if (!apiKey) {
      return notFoundResponse("API key");
    }

    if (apiKey.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await ApiKeyQueries.delete(keyId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/api-keys/route.ts
```typescript
import { NextRequest } from "next/server";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
import { createApiKeySchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const apiKeys = await ApiKeyQueries.findByUserId(session.user.id);

    return successResponse(
      apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        is_active: key.is_active,
        last_used: key.last_used,
        created_at: key.created_at,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createApiKeySchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { apiKey, plainKey } = await ApiKeyQueries.create({
      name: validation.data!.name,
      user_id: session.user.id,
    });

    return successResponse(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: plainKey,
        created_at: apiKey.created_at,
        warning: "Save this key securely. It will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/audit-logs/route.ts
```typescript
// src/app/api/audit-logs/route.ts
import { NextRequest } from "next/server";
import { AuditLogQueries } from "@/lib/db/queries/audit-log.queries";
import {
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let logs;
    let total;

    if (session.user.role === UserRole.ADMIN) {
      // NOTE: Logic asli dari blueprint menggunakan findByUserId untuk admin juga.
      // Anda mungkin ingin mengubahnya menjadi AuditLogQueries.findAll() nanti jika admin butuh melihat semua log.
      logs = await AuditLogQueries.findByUserId(session.user.id, {
        limit,
        offset,
      });
      total = await AuditLogQueries.countByUser(session.user.id);
    } else {
      logs = await AuditLogQueries.findByUserId(session.user.id, {
        limit,
        offset,
      });
      total = await AuditLogQueries.countByUser(session.user.id);
    }

    return paginatedResponse(logs, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/auth/[...nextauth]/route.ts
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

```

### Path: src/app/api/auth/mfa/disable/route.ts
```typescript
// src/app/api/auth/mfa/disable/route.ts
import { NextRequest } from "next/server";
import { MFAService } from "@/lib/auth/mfa";
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
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    if (!body.otp) {
      return validationErrorResponse([
        { field: "otp", message: "OTP is required" },
      ]);
    }

    const isValid = await MFAService.verifyUserOTP(session.user.id, body.otp);

    if (!isValid) {
      return validationErrorResponse([
        { field: "otp", message: "Invalid OTP" },
      ]);
    }

    await MFAService.disableMFA(session.user.id);

    return successResponse({ message: "MFA disabled successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/auth/mfa/enable/route.ts
```typescript
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

```

### Path: src/app/api/auth/mfa/verify/route.ts
```typescript
// src/app/api/auth/mfa/verify/route.ts
import { NextRequest } from "next/server";
import { MFAService } from "@/lib/auth/mfa";
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
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    if (!body.otp) {
      return validationErrorResponse([
        { field: "otp", message: "OTP is required" },
      ]);
    }

    const isValid = await MFAService.verifyUserOTP(session.user.id, body.otp);

    if (!isValid) {
      return validationErrorResponse([
        { field: "otp", message: "Invalid OTP" },
      ]);
    }

    return successResponse({ valid: true });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/auto-response/[ruleId]/route.ts
```typescript
import { NextRequest } from "next/server";
import { AutoResponseQueries } from "@/lib/db/queries/auto-response.queries";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { createAutoResponseSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    ruleId: string;
  }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { ruleId } = await params;
    const body = await _request.json();

    const rule = await AutoResponseQueries.findById(ruleId);
    if (!rule) {
      return notFoundResponse("Auto-response rule");
    }

    const device = await DeviceQueries.findById(rule.device_id);
    if (!device || device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(createAutoResponseSchema.partial(), body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await AutoResponseQueries.update(ruleId, validation.data);

    const updated = await AutoResponseQueries.findById(ruleId);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { ruleId } = await params;
    const rule = await AutoResponseQueries.findById(ruleId);

    if (!rule) {
      return notFoundResponse("Auto-response rule");
    }

    const device = await DeviceQueries.findById(rule.device_id);
    if (!device || device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await AutoResponseQueries.delete(ruleId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/auto-response/route.ts
```typescript
import { NextRequest } from "next/server";
import { AutoResponseQueries } from "@/lib/db/queries/auto-response.queries";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { createAutoResponseSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID is required" },
      ]);
    }

    const device = await DeviceQueries.findById(deviceId);
    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const rules = await AutoResponseQueries.findByDeviceId(deviceId);
    return successResponse(rules);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createAutoResponseSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const device = await DeviceQueries.findById(validation.data.deviceId);
    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const rule = await AutoResponseQueries.create({
      keyword: validation.data.keyword,
      response: validation.data.response,
      device_id: validation.data.deviceId,
      priority: validation.data.priority,
      is_active: validation.data.isActive,
    });

    return successResponse(rule, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/backup/restore/route.ts
```typescript
// src/app/api/backup/restore/route.ts
import { NextRequest } from "next/server";
import { BackupService } from "@/lib/services/backup.service";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can restore backups");
    }

    const body = await _request.json();

    if (!body.filepath) {
      return validationErrorResponse([
        { field: "filepath", message: "Backup filepath is required" },
      ]);
    }

    await BackupService.restoreBackup(body.filepath);

    return successResponse({
      message: "Backup restored successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/backup/route.ts
```typescript
// src/app/api/backup/route.ts
import { NextRequest } from "next/server";
import { BackupService } from "@/lib/services/backup.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

// PERBAIKAN: Ubah 'request' menjadi '_request'
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can create backups");
    }

    const filepath = await BackupService.createBackup();

    return successResponse({
      message: "Backup created successfully",
      filepath,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PERBAIKAN: Ubah 'request' menjadi '_request' juga di sini karena tidak dipakai
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can list backups");
    }

    const backups = await BackupService.listBackups();

    return successResponse(backups);
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/chatbot/message/route.ts
```typescript
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function POST(_request: NextRequest) {
  try {
    const apiKey = _request.headers.get("x-api-key");

    if (!apiKey) {
      return unauthorizedResponse("API key is required");
    }

    const keyHash = ApiKeyQueries.hashApiKey(apiKey);
    const apiKeyRecord = await ApiKeyQueries.findByHash(keyHash);

    if (!apiKeyRecord || !apiKeyRecord.is_active) {
      return unauthorizedResponse("Invalid or inactive API key");
    }

    await ApiKeyQueries.updateLastUsed(apiKeyRecord.id);

    const body = await _request.json();

    if (!body.deviceId || !body.toNumber || !body.message) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID is required" },
        { field: "toNumber", message: "Phone number is required" },
        { field: "message", message: "Message is required" },
      ]);
    }

    const rateLimitCheck = await RateLimiter.checkLimit(body.deviceId);
    if (!rateLimitCheck.allowed) {
      return validationErrorResponse([
        {
          field: "rateLimit",
          message: rateLimitCheck.reason || "Rate limit exceeded",
        },
      ]);
    }

    const message = await MessageService.sendMessage({
      device_id: body.deviceId,
      user_id: apiKeyRecord.user_id,
      to_number: body.toNumber,
      message: body.message,
    });

    return successResponse({
      messageId: message.id,
      status: message.status,
      queuedAt: message.created_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/contacts/[contactId]/route.ts
```typescript
import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import { updateContactSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    contactId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { contactId } = await params;
    const contact = await ContactService.getContact(contactId);

    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    return successResponse(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { contactId } = await params;
    const body = await _request.json();

    const contact = await ContactService.getContact(contactId);
    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(updateContactSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    await ContactService.updateContact(contactId, {
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      email: validation.data.email,
      tags: validation.data.tags,
    });

    const updated = await ContactService.getContact(contactId);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { contactId } = await params;
    const contact = await ContactService.getContact(contactId);

    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await ContactService.deleteContact(contactId);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/contacts/export/route.ts
```typescript
import { ContactService } from "@/lib/services/contact.service";
import { handleApiError, unauthorizedResponse } from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const csv = await ContactService.exportToCSV(session.user.id);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="contacts.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/contacts/import/route.ts
```typescript
import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const formData = await _request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return validationErrorResponse([
        { field: "file", message: "File is required" },
      ]);
    }

    const content = await file.text();
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    let result;

    if (fileExtension === "csv") {
      result = await ContactService.importFromCSV(content, session.user.id);
    } else if (fileExtension === "vcf") {
      result = await ContactService.importFromVCF(content, session.user.id);
    } else {
      return validationErrorResponse([
        { field: "file", message: "Only CSV and VCF files are supported" },
      ]);
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/contacts/route.ts
```typescript
import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import { createContactSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const contacts = await ContactService.getUserContacts(session.user.id, {
      search,
      limit,
      offset,
    });

    const total = await ContactService.countUserContacts(session.user.id);

    return paginatedResponse(contacts, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createContactSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const contact = await ContactService.createContact({
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      email: validation.data.email || null,
      tags: validation.data.tags || [],
      user_id: session.user.id,
    });

    return successResponse(contact, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
      return validationErrorResponse([
        { field: "ids", message: "Contact IDs are required" },
      ]);
    }

    const deleted = await ContactService.deleteMultipleContacts(ids);

    return successResponse({ deleted });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/cron/cleanup/route.ts
```typescript
import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import * as fs from "fs";
import * as path from "path";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return unauthorizedResponse();
    }

    const days = 30;
    const result: any = await query(
      `DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    let deletedFiles = 0;

    const scanAndDelete = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          scanAndDelete(filePath);
          if (fs.readdirSync(filePath).length === 0) {
            fs.rmdirSync(filePath);
          }
        } else {
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            deletedFiles++;
          }
        }
      }
    };

    scanAndDelete(uploadsDir);

    await query("OPTIMIZE TABLE messages, message_queue, audit_logs");

    return successResponse({
      message: "Cleanup completed",
      deletedMessages: result.affectedRows,
      deletedFiles,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/devices/[deviceId]/qr/route.ts
```typescript
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

```

### Path: src/app/api/devices/[deviceId]/reconnect/route.ts
```typescript
// src/app/api/devices/[deviceId]/reconnect/route.ts
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

type Params = {
  params: Promise<{
    deviceId: string;
  }>;
};

// PERBAIKAN: Ubah 'request' menjadi '_request'
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;

    const device = await DeviceService.getDevice(deviceId);
    if (!device) return notFoundResponse("Device");

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await DeviceService.reconnectDevice(deviceId);

    return successResponse({ message: "Reconnection initiated" });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/devices/[deviceId]/route.ts
```typescript
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

type Params = { params: Promise<{ deviceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;
    const device = await DeviceQueries.findById(deviceId);

    if (!device) return notFoundResponse("Device");
    if (device.user_id !== session.user.id) return forbiddenResponse();

    const { qrCode, status } = await DeviceService.getQRCode(deviceId);

    return successResponse({
      ...device,
      realtimeStatus: status,
      hasQr: !!qrCode,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;
    const device = await DeviceQueries.findById(deviceId);

    if (!device) return notFoundResponse("Device");
    if (device.user_id !== session.user.id) return forbiddenResponse();

    await DeviceService.deleteDevice(deviceId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/devices/route.ts
```typescript
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import { createDeviceSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const devices = await DeviceService.getUserDevices(session.user.id);

    return successResponse(devices);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createDeviceSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const device = await DeviceService.createDevice({
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      user_id: session.user.id,
    });

    return successResponse(device, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/docs/route.ts
```typescript
import { NextResponse } from "next/server";
import swaggerSpec from "@/lib/docs/openapi.json";

export async function GET() {
  return NextResponse.json(swaggerSpec);
}

```

### Path: src/app/api/health/route.ts
```typescript
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

```

### Path: src/app/api/inbox/conversations/route.ts
```typescript
// src/app/api/inbox/conversations/route.ts
import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  successResponse,
  handleApiError,
} from "@/lib/utils/api-response";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const sql = `
      SELECT 
        t1.remote_number,
        t1.display_name,
        m.message as last_message,
        m.created_at as last_activity,
        m.status
      FROM (
        SELECT 
          CASE 
            WHEN messages.direction = 'INBOUND' THEN messages.from_number 
            ELSE messages.to_number 
          END as remote_number,
          MAX(messages.id) as last_message_id,
          MAX(CASE WHEN messages.direction = 'INBOUND' THEN messages.from_number ELSE messages.to_number END) as display_name
        FROM messages 
        JOIN devices d ON messages.device_id = d.id
        WHERE d.user_id = ?
        GROUP BY remote_number
      ) t1
      JOIN messages m ON t1.last_message_id = m.id
      ORDER BY m.created_at DESC
    `;

    const rows: any[] = await query(sql, [session.user.id]);

    const conversations = rows.map((row) => ({
      id: row.remote_number,
      name: row.display_name || row.remote_number,
      number: row.remote_number,
      lastMessage: row.last_message,
      time: new Date(row.last_activity).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isGroup: row.remote_number.endsWith("@g.us"),
      unreadCount: 0,
    }));

    return successResponse(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/inbox/messages/route.ts
```typescript
import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  successResponse,
  handleApiError,
} from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId"); // Remote Number (from/to)

    if (!chatId) return successResponse([]);

    const sql = `
      SELECT m.* 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ? 
      AND (m.from_number = ? OR m.to_number = ?)
      ORDER BY m.created_at ASC
      LIMIT 100
    `;

    const rows: any[] = await query(sql, [session.user.id, chatId, chatId]);

    const messages = rows.map((row) => ({
      id: row.id,
      text: row.message,
      isMe: row.direction === "OUTBOUND",
      time: new Date(row.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: row.status,
    }));

    return successResponse(messages);
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/messages/[messageId]/route.ts
```typescript
import { NextRequest } from "next/server";
import {
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query, queryOne } from "@/lib/db";
import { Message } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const deviceId = searchParams.get("deviceId");
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    let sql = `
      SELECT m.*, d.name as device_name 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const params: any[] = [session.user.id];

    if (deviceId) {
      sql += " AND m.device_id = ?";
      params.push(deviceId);
    }

    if (status) {
      sql += " AND m.status = ?";
      params.push(status);
    }

    sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const messages = await query<Message[]>(sql, params);

    let countSql = `
      SELECT COUNT(*) as total 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const countParams: any[] = [session.user.id];

    if (deviceId) {
      countSql += " AND m.device_id = ?";
      countParams.push(deviceId);
    }

    if (status) {
      countSql += " AND m.status = ?";
      countParams.push(status);
    }

    const countResult = await queryOne<{ total: number }>(
      countSql,
      countParams,
    );

    return paginatedResponse(messages, page, limit, countResult?.total || 0);
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/messages/route.ts
```typescript
import { NextRequest } from "next/server";
import { MessageQueries } from "@/lib/db/queries/message.queries";
import {
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const deviceId = searchParams.get("deviceId") || undefined;
    const search = searchParams.get("search") || undefined;
    const offset = (page - 1) * limit;

    const messages = await MessageQueries.findByUserId(session.user.id, {
      limit,
      offset,
      deviceId,
      search,
    });

    const total = await MessageQueries.countByUserId(session.user.id, {
      deviceId,
      search,
    });

    return paginatedResponse(messages, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/messages/send/route.ts
```typescript
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { StorageService } from "@/lib/services/storage.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { DeviceQueries } from "@/lib/db/queries/device.queries";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        deviceId: formData.get("deviceId") as string,
        toNumber: formData.get("toNumber") as string,
        message: formData.get("message") as string,
        media: formData.get("media") as File | null,
        useRoundRobin: formData.get("useRoundRobin") === "true",
        contacts: formData.get("contacts")
          ? JSON.parse(formData.get("contacts") as string)
          : undefined,
      };
    } else {
      body = await req.json();
    }

    if (!body.contacts && body.deviceId) {
      const rateLimitCheck = await RateLimiter.checkLimit(body.deviceId);
      if (!rateLimitCheck.allowed) {
        return validationErrorResponse([
          {
            field: "rateLimit",
            message: rateLimitCheck.reason || "Rate limit exceeded",
          },
        ]);
      }
    }

    if (body.contacts && Array.isArray(body.contacts)) {
      const result = await MessageService.sendBulkMessages({
        userId: session.user.id,
        contacts: body.contacts,
        message: body.message,
        deviceIds: body.deviceId ? [body.deviceId] : undefined,
        useRoundRobin: body.useRoundRobin || false,
      });
      return successResponse(result, { status: 201 });
    }

    if (!body.deviceId && !body.useRoundRobin) {
      const devices = await DeviceQueries.getActiveDevices();
      const userDevices = devices.filter((d) => d.user_id === session.user.id);
      if (userDevices.length > 0) {
        body.deviceId = userDevices[0].id;
      } else {
        return validationErrorResponse([
          { field: "deviceId", message: "No active device found" },
        ]);
      }
    }

    let mediaPath = undefined;
    let mediaType: "image" | "video" | "audio" | "document" | undefined =
      undefined;

    if (body.media && body.media.size > 0) {
      if (body.media.type.startsWith("image/")) mediaType = "image";
      else if (body.media.type.startsWith("video/")) mediaType = "video";
      else if (body.media.type.startsWith("audio/")) mediaType = "audio";
      else mediaType = "document";

      const saved = await StorageService.saveFile(body.media, "messages");
      mediaPath = saved.path;
    }

    const result = await MessageService.sendMessage({
      user_id: session.user.id,
      device_id: body.deviceId,
      to_number: body.toNumber?.replace(/\D/g, "") || "",
      message: body.message || "",
      media_path: mediaPath,
      media_type: mediaType,
    });

    return successResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/reports/export/route.ts
```typescript
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

```

### Path: src/app/api/settings/route.ts
```typescript
import { NextRequest } from "next/server";
import { SettingsService } from "@/lib/services/settings.service";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(_request.url);
    const scope = searchParams.get("scope") || "user";

    if (scope === "system") {
      if (session.user.role !== UserRole.ADMIN) {
        return forbiddenResponse("Admin access required");
      }
      const settings = await SettingsService.getSystemSettings();
      return successResponse(settings);
    }

    const settings = await SettingsService.getUserSettings(session.user.id);
    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const body = await _request.json();
    const { scope, settings } = body;

    if (!settings) {
      return validationErrorResponse([
        { field: "settings", message: "Settings object required" },
      ]);
    }

    if (scope === "system") {
      if (session.user.role !== UserRole.ADMIN) {
        return forbiddenResponse();
      }
      await SettingsService.updateSystemSettings(settings);
    } else {
      await SettingsService.updateUserSettings(session.user.id, settings);
    }

    return successResponse({ message: "Settings updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/stats/route.ts
```typescript
// src/app/api/stats/route.ts
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { DeviceService } from "@/lib/services/device.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    // Fix: method getMessageStats sudah ditambahkan di Service
    const messageStats = await MessageService.getMessageStats({
      deviceId,
      startDate,
      endDate,
    });

    const hourlyStats = await MessageService.getHourlyStats(deviceId, 24);

    // Fix: method getUserDevices sudah ditambahkan di Service
    const devices = await DeviceService.getUserDevices(session.user.id);
    const deviceStats = devices.map((device) => ({
      deviceId: device.id,
      deviceName: device.name,
      status: device.status,
      isReady: device.is_ready,
      messageCount: device.message_count || 0,
      lastMessageAt: device.last_message_at,
    }));

    const totalDevices = devices.length;
    const activeDevices = devices.filter(
      (d) => d.status === "AUTHENTICATED" && d.is_ready,
    ).length;

    return successResponse({
      overview: {
        totalDevices,
        activeDevices,
        totalMessages: messageStats.total,
        sentMessages: messageStats.sent,
        failedMessages: messageStats.failed,
        pendingMessages: messageStats.pending,
        successRate: messageStats.successRate,
      },
      devices: deviceStats,
      hourlyStats,
      period: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function HEAD(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const devices = await DeviceService.getUserDevices(session.user.id);
    const todayStats = await MessageService.getMessageStats({});

    return successResponse({
      totalDevices: devices.length,
      activeDevices: devices.filter((d) => d.is_ready).length,
      todayMessages: todayStats.total,
      successRate: todayStats.successRate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/status/route.ts
```typescript
import { NextRequest } from "next/server";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { StorageService } from "@/lib/services/storage.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const formData = await req.formData();
    const text = formData.get("text") as string;
    const file = formData.get("file") as File | null;
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID required" },
      ]);
    }

    const device = await DeviceQueries.findById(deviceId);
    if (!device || device.user_id !== session.user.id) {
      return validationErrorResponse([
        { field: "deviceId", message: "Invalid device" },
      ]);
    }

    let mediaPath = undefined;
    if (file) {
      const saved = await StorageService.saveFile(file, "status");
      mediaPath = saved.path;
    }

    await whatsappClientManager.postStatus(deviceId, text, mediaPath);

    return successResponse({ posted: true, timestamp: new Date() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  return successResponse([]);
}

```

### Path: src/app/api/templates/[templateId]/route.ts
```typescript
import { NextRequest } from "next/server";
import { TemplateQueries } from "@/lib/db/queries/template.queries";
import { createTemplateSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    templateId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { templateId } = await params;
    const template = await TemplateQueries.findById(templateId);

    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    return successResponse(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { templateId } = await params;
    const body = await _request.json();

    const template = await TemplateQueries.findById(templateId);
    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(createTemplateSchema.partial(), body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await TemplateQueries.update(templateId, validation.data);

    const updated = await TemplateQueries.findById(templateId);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { templateId } = await params;
    const template = await TemplateQueries.findById(templateId);

    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await TemplateQueries.delete(templateId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/templates/route.ts
```typescript
// src/app/api/templates/route.ts
import { NextRequest } from "next/server";
import { TemplateQueries } from "@/lib/db/queries/template.queries";
import { createTemplateSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const templates = await TemplateQueries.findByUserId(session.user.id);
    return successResponse(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createTemplateSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const template = await TemplateQueries.create({
      ...validation.data,
      user_id: session.user.id,
    });

    return successResponse(template, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/tools/validate-number/route.ts
```typescript
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

```

### Path: src/app/api/users/[userId]/route.ts
```typescript
import { NextRequest } from "next/server";
import { queryOne, query } from "@/lib/db";
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";
import { User } from "@/types/database.types";

type Params = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { userId } = await params;

    if (session.user.role !== UserRole.ADMIN && session.user.id !== userId) {
      return forbiddenResponse();
    }

    const user = await queryOne<User>(
      "SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?",
      [userId],
    );

    if (!user) return notFoundResponse("User");

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { userId } = await params;
    const body = await _request.json();

    // Only admin can update other users or change roles
    if (session.user.role !== UserRole.ADMIN && session.user.id !== userId) {
      return forbiddenResponse();
    }

    if (session.user.role !== UserRole.ADMIN && body.role) {
      return forbiddenResponse("Only admins can change roles");
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.name) {
      updates.push("name = ?");
      values.push(body.name);
    }

    if (body.role && session.user.role === UserRole.ADMIN) {
      updates.push("role = ?");
      values.push(body.role);
    }

    if (updates.length === 0) {
      return validationErrorResponse([
        { field: "body", message: "No fields to update" },
      ]);
    }

    updates.push("updated_at = NOW()");
    values.push(userId);

    await query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    return successResponse({ message: "User updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/webhooks/[webhookId]/route.ts
```typescript
import { NextRequest } from "next/server";
import { WebhookService } from "@/lib/services/webhook.service";
import { updateWebhookSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    webhookId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { webhookId } = await params;
    const webhook = await WebhookService.getWebhook(webhookId);

    if (!webhook) return notFoundResponse("Webhook");
    if (webhook.user_id !== session.user.id) return forbiddenResponse();

    return successResponse(webhook);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { webhookId } = await params;
    const body = await _request.json();

    const webhook = await WebhookService.getWebhook(webhookId);
    if (!webhook) return notFoundResponse("Webhook");
    if (webhook.user_id !== session.user.id) return forbiddenResponse();

    const validation = validate(updateWebhookSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await WebhookService.updateWebhook(webhookId, validation.data);
    const updated = await WebhookService.getWebhook(webhookId);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { webhookId } = await params;
    const webhook = await WebhookService.getWebhook(webhookId);

    if (!webhook) return notFoundResponse("Webhook");
    if (webhook.user_id !== session.user.id) return forbiddenResponse();

    await WebhookService.deleteWebhook(webhookId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/app/api/webhooks/route.ts
```typescript
import { NextRequest } from "next/server";
import { WebhookService } from "@/lib/services/webhook.service";
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
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    if (!body.url || !body.events) {
      return validationErrorResponse([
        { field: "url", message: "Webhook URL is required" },
        { field: "events", message: "Events array is required" },
      ]);
    }

    try {
      new URL(body.url);
    } catch {
      return validationErrorResponse([
        { field: "url", message: "Invalid URL format" },
      ]);
    }

    const webhook = await WebhookService.createWebhook({
      url: body.url,
      events: body.events,
      user_id: session.user.id,
      secret: body.secret,
      is_active: body.is_active !== undefined ? body.is_active : true,
    });

    return successResponse(webhook, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const webhooks = await WebhookService.getUserWebhooks(session.user.id);
    return successResponse(webhooks);
  } catch (error) {
    return handleApiError(error);
  }
}

```

### Path: src/lib/auth/mfa.ts
```typescript
import speakeasy from "speakeasy";
import { query, queryOne } from "@/lib/db";

export class MFAService {
  static generateSecret(email: string): {
    secret: string;
    otpauth_url: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `WhatsApp Dashboard (${email})`,
      issuer: "WhatsApp Dashboard",
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url || "",
    };
  }

  static verifyOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2,
    });
  }

  static async enableMFA(
    userId: string,
    email: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const { secret, otpauth_url } = this.generateSecret(email);

    await query(
      "UPDATE users SET mfa_enabled = true, mfa_secret = ? WHERE id = ?",
      [secret, userId],
    );

    return {
      secret,
      qrCodeUrl: otpauth_url,
    };
  }

  static async disableMFA(userId: string): Promise<void> {
    await query(
      "UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = ?",
      [userId],
    );
  }

  static async verifyUserOTP(userId: string, token: string): Promise<boolean> {
    const user: any = await queryOne(
      "SELECT mfa_secret FROM users WHERE id = ? AND mfa_enabled = true",
      [userId],
    );

    if (!user?.mfa_secret) {
      return false;
    }

    return this.verifyOTP(user.mfa_secret, token);
  }
}

```

### Path: src/lib/auth/middleware.ts
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { UserRole } from "@/types/database.types";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getSession() {
  return getServerSession(authOptions);
}

```

### Path: src/lib/auth/options.ts
```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { queryOne, query } from "@/lib/db";
import { UserRole } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const existing: any = await queryOne(
          "SELECT * FROM users WHERE email = ?",
          [user.email],
        );

        if (!existing) {
          await query(
            "INSERT INTO users (id, email, name, role, is_active) VALUES (?, ?, ?, ?, true)",
            [uuidv4(), user.email, user.name || "User", UserRole.USER_A],
          );
        } else if (!existing.is_active) {
          return false;
        }
        return true;
      } catch (e) {
        console.error("SignIn Error:", e);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser: any = await queryOne(
          "SELECT id, role FROM users WHERE email = ?",
          [user.email],
        );
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

```

### Path: src/lib/auth/rbac.ts
```typescript
import { UserRole } from "@/types/database.types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.DST]: 80,
  [UserRole.USER_A]: 60,
  [UserRole.USER_B]: 40,
  [UserRole.USER_C]: 20,
};

export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_ALL_DEVICES: "manage_all_devices",
  MANAGE_OWN_DEVICES: "manage_own_devices",
  SEND_MESSAGES: "send_messages",
  VIEW_STATS: "view_stats",
  VIEW_ALL_STATS: "view_all_stats",
  MANAGE_API_KEYS: "manage_api_keys",
  MANAGE_WEBHOOKS: "manage_webhooks",
  BACKUP_RESTORE: "backup_restore",
  VIEW_AUDIT_LOGS: "view_audit_logs",
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ALL_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_ALL_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.BACKUP_RESTORE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  [UserRole.DST]: [
    PERMISSIONS.MANAGE_ALL_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_ALL_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.MANAGE_WEBHOOKS,
  ],
  [UserRole.USER_A]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
  ],
  [UserRole.USER_B]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_STATS,
  ],
  [UserRole.USER_C]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessResource(
  userRole: UserRole,
  ownerId: string,
  userId: string,
): boolean {
  if (userRole === UserRole.ADMIN || userRole === UserRole.DST) {
    return true;
  }
  return ownerId === userId;
}

```

### Path: src/lib/db/index.ts
```typescript
import mysql from "mysql2/promise";
import { appConfig } from "@/config/app.config";
import { EventEmitter } from "events";

interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  queuedRequests: number;
}

class Database extends EventEmitter {
  private static instance: Database;
  private pool: mysql.Pool | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  private constructor() {
    super();
    this.setupSignalHandlers();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private setupSignalHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      console.log(`[DB] Received ${signal}, closing connections...`);

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      await this.close();
      process.exit(0);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }

  public getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: appConfig.database.host,
        port: appConfig.database.port,
        user: appConfig.database.user,
        password: appConfig.database.password,
        database: appConfig.database.database,
        waitForConnections: true,
        connectionLimit: 20,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 100,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        timezone: "+00:00",
        multipleStatements: false,
        namedPlaceholders: false,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        charset: "utf8mb4",
      });

      this.setupPoolEventHandlers();
      this.startHealthCheck();
    }

    return this.pool;
  }

  private setupPoolEventHandlers(): void {
    if (!this.pool) return;

    this.pool.on("acquire", () => {
      this.emit("acquire");
    });

    this.pool.on("release", () => {
      this.emit("release");
    });

    this.pool.on("enqueue", () => {
      this.emit("enqueue");
    });

    this.pool.on("connection", () => {
      this.reconnectAttempts = 0;
    });
  }

  private async reconnect(): Promise<void> {
    if (
      this.isShuttingDown ||
      this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS
    ) {
      console.error("[DB] Max reconnection attempts reached");
      process.exit(1);
    }

    this.reconnectAttempts++;
    console.log(
      `[DB] Reconnection attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`,
    );

    if (this.pool) {
      await this.pool.end().catch(console.error);
      this.pool = null;
    }

    await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_DELAY));
    this.getPool();
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.query("SELECT 1");
      } catch (error) {
        console.error("[DB] Health check failed:", error);
        await this.reconnect();
      }
    }, 30000);
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const pool = this.getPool();
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(sql, params);
      return rows as T;
    } finally {
      connection.release();
    }
  }

  public async queryOne<T = any>(
    sql: string,
    params?: any[],
  ): Promise<T | null> {
    const rows = await this.query<T[]>(sql, params);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  public async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.getPool().getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("[DB] Health check failed:", error);
      return false;
    }
  }

  public getMetrics(): PoolMetrics {
    if (!this.pool) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        queuedRequests: 0,
      };
    }

    const poolConfig = this.pool.pool.config;
    const poolState = this.pool.pool;

    return {
      totalConnections: poolConfig.connectionLimit,
      activeConnections: (poolState as any)._allConnections?.length || 0,
      idleConnections: (poolState as any)._freeConnections?.length || 0,
      queuedRequests: (poolState as any)._connectionQueue?.length || 0,
    };
  }
}

const db = Database.getInstance();

export const query = <T = any>(sql: string, params?: any[]): Promise<T> =>
  db.query<T>(sql, params);

export const queryOne = <T = any>(
  sql: string,
  params?: any[],
): Promise<T | null> => db.queryOne<T>(sql, params);

export const transaction = <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> => db.transaction(callback);

export const closeDatabase = (): Promise<void> => db.close();

export const healthCheck = (): Promise<boolean> => db.healthCheck();

export const getMetrics = (): PoolMetrics => db.getMetrics();

export default db;

```

### Path: src/lib/db/migrations/index.ts
```typescript
// src/lib/db/migrations/index.ts

import * as fs from "fs";
import * as path from "path";
import { query, queryOne } from "../index";

interface Migration {
  id: number;
  name: string;
  executed_at: Date;
}

export class MigrationRunner {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(process.cwd(), "database", "migrations");
    this.ensureMigrationsTable();
  }

  private async ensureMigrationsTable(): Promise<void> {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async getExecutedMigrations(): Promise<Migration[]> {
    return query<Migration[]>("SELECT * FROM migrations ORDER BY id ASC");
  }

  async getMigrationFiles(): Promise<string[]> {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    return files;
  }

  async run(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = new Set(executedMigrations.map((m) => m.name));

    const migrationFiles = await this.getMigrationFiles();
    const pendingMigrations = migrationFiles.filter(
      (f) => !executedNames.has(f),
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(`Running ${pendingMigrations.length} migrations...`);

    for (const migrationFile of pendingMigrations) {
      const filePath = path.join(this.migrationsPath, migrationFile);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Executing migration: ${migrationFile}`);

      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await query(statement);
      }

      await query("INSERT INTO migrations (name) VALUES (?)", [migrationFile]);

      console.log(`Completed migration: ${migrationFile}`);
    }

    console.log("All migrations completed successfully");
  }

  async rollback(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();

    if (executedMigrations.length === 0) {
      console.log("No migrations to rollback");
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    console.log(`Rolling back migration: ${lastMigration.name}`);

    await query("DELETE FROM migrations WHERE id = ?", [lastMigration.id]);

    console.log(`Rollback completed: ${lastMigration.name}`);
  }

  async create(name: string): Promise<void> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const filename = `${timestamp}_${name}.sql`;
    const filepath = path.join(this.migrationsPath, filename);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL statements here

`;

    fs.writeFileSync(filepath, template);
    console.log(`Created migration file: ${filename}`);
  }
}

export const migrationRunner = new MigrationRunner();

```

### Path: src/lib/db/queries/api-key.queries.ts
```typescript
import { query, queryOne } from "../index";
import { ApiKey } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

export class ApiKeyQueries {
  private static readonly KEY_PREFIX = "wwa";
  private static readonly KEY_LENGTH = 48;
  private static readonly HASH_ALGORITHM = "sha256";

  static async findById(id: string): Promise<ApiKey | null> {
    return queryOne<ApiKey>("SELECT * FROM api_keys WHERE id = ?", [id]);
  }

  static async findByHash(keyHash: string): Promise<ApiKey | null> {
    return queryOne<ApiKey>("SELECT * FROM api_keys WHERE key_hash = ?", [
      keyHash,
    ]);
  }

  static async findByUserId(userId: string): Promise<ApiKey[]> {
    return query<ApiKey[]>(
      "SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async create(data: {
    name: string;
    user_id: string;
  }): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const id = uuidv4();
    const plainKey = this.generateApiKey();
    const keyHash = this.hashApiKey(plainKey);

    await query(
      `INSERT INTO api_keys (id, key_hash, name, user_id, is_active)
       VALUES (?, ?, ?, ?, true)`,
      [id, keyHash, data.name, data.user_id],
    );

    const apiKey = await this.findById(id);
    if (!apiKey) {
      throw new Error("Failed to create API key");
    }

    return { apiKey, plainKey };
  }

  static async updateLastUsed(id: string): Promise<void> {
    await query("UPDATE api_keys SET last_used = NOW() WHERE id = ?", [id]);
  }

  static async toggleActive(id: string, isActive: boolean): Promise<void> {
    await query(
      "UPDATE api_keys SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [isActive, id],
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM api_keys WHERE id = ?", [id]);
  }

  static generateApiKey(): string {
    const randomBytes = crypto.randomBytes(this.KEY_LENGTH);
    const key = randomBytes.toString("base64url");
    return `${this.KEY_PREFIX}_${key}`;
  }

  static hashApiKey(apiKey: string): string {
    return crypto.createHash(this.HASH_ALGORITHM).update(apiKey).digest("hex");
  }

  static verifyApiKey(plainKey: string, storedHash: string): boolean {
    const computedHash = this.hashApiKey(plainKey);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(storedHash),
    );
  }
}

```

### Path: src/lib/db/queries/audit-log.queries.ts
```typescript
import { query, queryOne } from "../index";
import { AuditLog } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class AuditLogQueries {
  static async create(data: {
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_value?: Record<string, any>;
    new_value?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    const id = uuidv4();

    await query(
      `INSERT INTO audit_logs 
       (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.user_id || null,
        data.action,
        data.entity_type,
        data.entity_id || null,
        data.old_value ? JSON.stringify(data.old_value) : null,
        data.new_value ? JSON.stringify(data.new_value) : null,
        data.ip_address || null,
        data.user_agent || null,
      ],
    );
  }

  static async findByUserId(
    userId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<AuditLog[]> {
    let sql =
      "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC";
    const queryParams: any[] = [userId];

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<AuditLog[]>(sql, queryParams);
  }

  static async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return query<AuditLog[]>(
      `SELECT * FROM audit_logs 
       WHERE entity_type = ? AND entity_id = ? 
       ORDER BY created_at DESC`,
      [entityType, entityId],
    );
  }

  static async deleteOld(days: number = 90): Promise<number> {
    const result: any = await query(
      `DELETE FROM audit_logs 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    return result.affectedRows || 0;
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }

  static async findAll(params?: {
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    let sql = "SELECT * FROM audit_logs ORDER BY created_at DESC";
    const queryParams: any[] = [];

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<AuditLog[]>(sql, queryParams);
  }
}

```

### Path: src/lib/db/queries/auto-response.queries.ts
```typescript
import { query, queryOne } from "../index";
import { AutoResponseRule } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class AutoResponseQueries {
  static async findById(id: string): Promise<AutoResponseRule | null> {
    return queryOne<AutoResponseRule>(
      "SELECT * FROM auto_response_rules WHERE id = ?",
      [id],
    );
  }

  static async findByDeviceId(deviceId: string): Promise<AutoResponseRule[]> {
    return query<AutoResponseRule[]>(
      "SELECT * FROM auto_response_rules WHERE device_id = ? ORDER BY priority DESC",
      [deviceId],
    );
  }

  static async findActiveByDeviceId(
    deviceId: string,
  ): Promise<AutoResponseRule[]> {
    return query<AutoResponseRule[]>(
      `SELECT * FROM auto_response_rules 
       WHERE device_id = ? AND is_active = true 
       ORDER BY priority DESC`,
      [deviceId],
    );
  }

  static async create(data: {
    keyword: string;
    response: string;
    device_id: string;
    priority?: number;
    is_active?: boolean;
  }): Promise<AutoResponseRule> {
    const id = uuidv4();

    await query(
      `INSERT INTO auto_response_rules (id, keyword, response, device_id, priority, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.keyword,
        data.response,
        data.device_id,
        data.priority || 0,
        data.is_active !== undefined ? data.is_active : true,
      ],
    );

    const rule = await this.findById(id);
    if (!rule) {
      throw new Error("Failed to create auto-response rule");
    }

    return rule;
  }

  static async update(
    id: string,
    data: Partial<{
      keyword: string;
      response: string;
      priority: number;
      is_active: boolean;
    }>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.keyword !== undefined) {
      updates.push("keyword = ?");
      params.push(data.keyword);
    }

    if (data.response !== undefined) {
      updates.push("response = ?");
      params.push(data.response);
    }

    if (data.priority !== undefined) {
      updates.push("priority = ?");
      params.push(data.priority);
    }

    if (data.is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(data.is_active);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE auto_response_rules SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM auto_response_rules WHERE id = ?", [id]);
  }
}

```

### Path: src/lib/db/queries/contact.queries.ts
```typescript
import { query, queryOne } from "../index";
import { Contact, CreateContactDTO } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class ContactQueries {
  static async findById(id: string): Promise<Contact | null> {
    return queryOne<Contact>("SELECT * FROM contacts WHERE id = ?", [id]);
  }

  static async findByPhoneNumber(
    phoneNumber: string,
    userId: string,
  ): Promise<Contact | null> {
    return queryOne<Contact>(
      "SELECT * FROM contacts WHERE phone_number = ? AND user_id = ?",
      [phoneNumber, userId],
    );
  }

  static async findByUserId(
    userId: string,
    params?: {
      search?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Contact[]> {
    let sql = "SELECT * FROM contacts WHERE user_id = ?";
    const queryParams: any[] = [userId];

    if (params?.search) {
      sql += " AND (name LIKE ? OR phone_number LIKE ? OR email LIKE ?)";
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    sql += " ORDER BY name ASC";

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<Contact[]>(sql, queryParams);
  }

  static async create(data: CreateContactDTO): Promise<Contact> {
    const id = uuidv4();

    await query(
      `INSERT INTO contacts (id, name, phone_number, email, tags, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.phone_number,
        data.email || null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.user_id,
      ],
    );

    const contact = await this.findById(id);
    if (!contact) {
      throw new Error("Failed to create contact");
    }

    return contact;
  }

  static async update(
    id: string,
    data: Partial<CreateContactDTO>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.phone_number !== undefined) {
      updates.push("phone_number = ?");
      params.push(data.phone_number);
    }

    if (data.email !== undefined) {
      updates.push("email = ?");
      params.push(data.email);
    }

    if (data.tags !== undefined) {
      updates.push("tags = ?");
      params.push(data.tags ? JSON.stringify(data.tags) : null);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM contacts WHERE id = ?", [id]);
  }

  static async deleteMultiple(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => "?").join(",");
    const result: any = await query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids,
    );

    return result.affectedRows || 0;
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM contacts WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }
}

```

### Path: src/lib/db/queries/device.queries.ts
```typescript
import { query, queryOne } from "../index";
import type {
  Device,
  DeviceViewModel,
  CreateDeviceDTO,
} from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class DeviceQueries {
  static async findById(id: string): Promise<Device | null> {
    return queryOne<Device>("SELECT * FROM devices WHERE id = ?", [id]);
  }

  static async findByPhoneNumber(phoneNumber: string): Promise<Device | null> {
    return queryOne<Device>("SELECT * FROM devices WHERE phone_number = ?", [
      phoneNumber,
    ]);
  }

  static async findWithStats(userId: string): Promise<DeviceViewModel[]> {
    return query<DeviceViewModel[]>(
      `SELECT d.*, 
       (SELECT COUNT(*) FROM messages m WHERE m.device_id = d.id) as message_count,
       (SELECT MAX(created_at) FROM messages m WHERE m.device_id = d.id) as last_message_at
       FROM devices d WHERE d.user_id = ? ORDER BY d.created_at DESC`,
      [userId],
    );
  }

  static async create(data: CreateDeviceDTO): Promise<Device> {
    const id = uuidv4();
    await query(
      `INSERT INTO devices (id, name, phone_number, user_id, status, is_ready)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.phone_number, data.user_id, "DISCONNECTED", false],
    );
    return (await this.findById(id))!;
  }

  static async updateStatus(
    id: string,
    status: string,
    isReady: boolean = false,
  ): Promise<void> {
    await query(
      "UPDATE devices SET status = ?, is_ready = ?, last_seen = NOW(), updated_at = NOW() WHERE id = ?",
      [status, isReady, id],
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM devices WHERE id = ?", [id]);
  }

  static async getActiveDevices(): Promise<Device[]> {
    return query<Device[]>(
      "SELECT * FROM devices WHERE status = ? AND is_ready = ?",
      ["AUTHENTICATED", true],
    );
  }

  static async countByUser(userId: string): Promise<number> {
    const res = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM devices WHERE user_id = ?",
      [userId],
    );
    return res?.count || 0;
  }
}

```

### Path: src/lib/db/queries/message.queries.ts
```typescript
import { query, queryOne, transaction } from "../index";
import type { Message, CreateMessageDTO } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class MessageQueries {
  static async findById(id: string): Promise<Message | null> {
    return queryOne<Message>("SELECT * FROM messages WHERE id = ?", [id]);
  }

  static async findByUserId(
    userId: string,
    params: {
      limit: number;
      offset: number;
      deviceId?: string;
      search?: string;
    },
  ): Promise<Message[]> {
    let sql = `
      SELECT m.*, d.name as device_name 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const queryParams: any[] = [userId];

    if (params.deviceId) {
      sql += " AND m.device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.search) {
      sql += " AND (m.message LIKE ? OR m.to_number LIKE ?)";
      const term = `%${params.search}%`;
      queryParams.push(term, term);
    }

    sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(params.limit, params.offset);

    return query<Message[]>(sql, queryParams);
  }

  static async countByUserId(
    userId: string,
    params: { deviceId?: string; search?: string },
  ): Promise<number> {
    let sql = `
      SELECT COUNT(*) as total
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const queryParams: any[] = [userId];

    if (params.deviceId) {
      sql += " AND m.device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.search) {
      sql += " AND (m.message LIKE ? OR m.to_number LIKE ?)";
      const term = `%${params.search}%`;
      queryParams.push(term, term);
    }

    const res = await queryOne<{ total: number }>(sql, queryParams);
    return res?.total || 0;
  }

  static async findPending(limit: number = 100): Promise<Message[]> {
    return query<Message[]>(
      "SELECT * FROM messages WHERE status IN (?, ?) ORDER BY created_at ASC LIMIT ?",
      ["PENDING", "QUEUED", limit],
    );
  }

  static async getStatsByUserId(userId: string) {
    const sql = `
      SELECT 
        COUNT(m.id) as total,
        SUM(CASE WHEN m.status IN (?, ?, ?) THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN m.status = ? THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN m.status IN (?, ?) THEN 1 ELSE 0 END) as pending
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;

    const res = await queryOne<any>(sql, [
      "SENT",
      "DELIVERED",
      "READ",
      "FAILED",
      "PENDING",
      "QUEUED",
      userId,
    ]);

    return {
      total: Number(res?.total || 0),
      sent: Number(res?.sent || 0),
      failed: Number(res?.failed || 0),
      pending: Number(res?.pending || 0),
    };
  }

  static async getDetailedStats(params: {
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let sql = `
      SELECT 
        COUNT(id) as total,
        SUM(CASE WHEN status IN (?, ?, ?) THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) as pending
      FROM messages
      WHERE 1=1
    `;
    const queryParams: any[] = [
      "SENT",
      "DELIVERED",
      "READ",
      "FAILED",
      "PENDING",
      "QUEUED",
    ];

    if (params.deviceId) {
      sql += " AND device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.startDate) {
      sql += " AND created_at >= ?";
      queryParams.push(params.startDate);
    }

    if (params.endDate) {
      sql += " AND created_at <= ?";
      queryParams.push(params.endDate);
    }

    const res = await queryOne<any>(sql, queryParams);
    return {
      total: Number(res?.total || 0),
      sent: Number(res?.sent || 0),
      failed: Number(res?.failed || 0),
      pending: Number(res?.pending || 0),
    };
  }

  static async create(data: CreateMessageDTO): Promise<Message> {
    const id = uuidv4();
    await query(
      `INSERT INTO messages (id, device_id, user_id, to_number, message, media_url, media_type, status, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.device_id,
        data.user_id,
        data.to_number,
        data.message || "",
        data.media_path || null,
        data.media_type || null,
        "PENDING",
        0,
      ],
    );
    return (await this.findById(id))!;
  }

  static async updateStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const updates = ["status = ?", "updated_at = NOW()"];
    const params: any[] = [status];

    if (status === "SENT") updates.push("sent_at = NOW()");
    if (status === "DELIVERED") updates.push("delivered_at = NOW()");
    if (status === "READ") updates.push("read_at = NOW()");

    if (errorMessage) {
      updates.push("error_message = ?");
      params.push(errorMessage);
    }
    params.push(id);

    await query(
      `UPDATE messages SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async incrementRetry(id: string): Promise<void> {
    await query(
      "UPDATE messages SET retry_count = retry_count + 1, updated_at = NOW() WHERE id = ?",
      [id],
    );
  }

  static async getHourlyStats(
    deviceId?: string,
    hours: number = 24,
  ): Promise<Array<{ hour: string; count: number }>> {
    let sql = `
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour, COUNT(*) as count
      FROM messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    const params: any[] = [hours];
    if (deviceId) {
      sql += " AND device_id = ?";
      params.push(deviceId);
    }
    sql += " GROUP BY hour ORDER BY hour ASC";
    return query(sql, params);
  }

  static async findByDeviceId(
    deviceId: string,
    params: { limit: number },
  ): Promise<Message[]> {
    return query<Message[]>(
      "SELECT * FROM messages WHERE device_id = ? ORDER BY created_at DESC LIMIT ?",
      [deviceId, params.limit],
    );
  }

  static async bulkCreate(messages: CreateMessageDTO[]): Promise<Message[]> {
    if (messages.length === 0) return [];

    return transaction(async (conn) => {
      const values: any[] = [];
      const placeholders: string[] = [];
      const ids: string[] = [];

      for (const data of messages) {
        const id = uuidv4();
        ids.push(id);
        placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?)");
        values.push(
          id,
          data.device_id,
          data.user_id,
          data.to_number,
          data.message || "",
          data.media_path || null,
          data.media_type || null,
          "PENDING",
          0,
        );
      }

      const sql = `INSERT INTO messages (id, device_id, user_id, to_number, message, media_url, media_type, status, retry_count) VALUES ${placeholders.join(", ")}`;
      await conn.execute(sql, values);

      const placeholderIds = ids.map(() => "?").join(",");
      const [rows] = await conn.execute(
        `SELECT * FROM messages WHERE id IN (${placeholderIds})`,
        ids,
      );

      return rows as Message[];
    });
  }

  static async deleteOldMessages(days: number = 30): Promise<number> {
    const result: any = await query(
      `DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );
    return result.affectedRows || 0;
  }
}

```

### Path: src/lib/db/queries/template.queries.ts
```typescript
import { query, queryOne } from "../index";
import { MessageTemplate } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class TemplateQueries {
  static async findById(id: string): Promise<MessageTemplate | null> {
    return queryOne<MessageTemplate>(
      "SELECT * FROM message_templates WHERE id = ?",
      [id],
    );
  }

  static async findByUserId(userId: string): Promise<MessageTemplate[]> {
    return query<MessageTemplate[]>(
      "SELECT * FROM message_templates WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async create(data: {
    name: string;
    content: string;
    variables?: Record<string, string> | null;
    user_id: string;
  }): Promise<MessageTemplate> {
    const id = uuidv4();

    await query(
      `INSERT INTO message_templates (id, name, content, variables, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.content,
        data.variables ? JSON.stringify(data.variables) : null,
        data.user_id,
      ],
    );

    const template = await this.findById(id);
    if (!template) {
      throw new Error("Failed to create template");
    }

    return template;
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      content: string;
      variables: Record<string, string> | null;
    }>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.content !== undefined) {
      updates.push("content = ?");
      params.push(data.content);
    }

    if (data.variables !== undefined) {
      updates.push("variables = ?");
      params.push(data.variables ? JSON.stringify(data.variables) : null);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE message_templates SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM message_templates WHERE id = ?", [id]);
  }
}

```

### Path: src/lib/db/secure-query.ts
```typescript
import mysql from 'mysql2/promise';
import { query as rawQuery, queryOne as rawQueryOne } from '../db';

interface QueryParams {
  table: string;
  where?: Record<string, any>;
  select?: string[];
  limit?: number;
  offset?: number;
  orderBy?: { column: string; direction: 'ASC' | 'DESC' };
}

export class SecureQueryBuilder {
  static async select<T>(params: QueryParams): Promise<T[]> {
    const { table, where, select = ['*'], limit, offset, orderBy } = params;

    let sql = `SELECT ${select.join(', ')} FROM ${mysql.escapeId(table)}`;
    const values: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        values.push(where[key]);
        return `${mysql.escapeId(key)} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${mysql.escapeId(orderBy.column)} ${orderBy.direction}`;
    }

    if (limit) {
      sql += ' LIMIT ?';
      values.push(limit);

      if (offset) {
        sql += ' OFFSET ?';
        values.push(offset);
      }
    }

    return rawQuery<T[]>(sql, values);
  }

  static async selectOne<T>(params: Omit<QueryParams, 'limit' | 'offset'>): Promise<T | null> {
    const result = await this.select<T>({ ...params, limit: 1 });
    return result.length > 0 ? result[0] : null;
  }

  static async insert<T>(table: string, data: Record<string, any>): Promise<{ id: string; insertedRow: T | null }> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${mysql.escapeId(table)} (${columns.map(c => mysql.escapeId(c)).join(', ')}) VALUES (${placeholders})`;

    await rawQuery(sql, values);

    const id = data.id || values[0];
    const insertedRow = await this.selectOne<T>({ table, where: { id } });

    return { id, insertedRow };
  }

  static async update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<number> {
    if (Object.keys(where).length === 0) {
      throw new Error('UPDATE without WHERE clause is forbidden');
    }

    const setClauses = Object.keys(data).map(key => `${mysql.escapeId(key)} = ?`);
    const whereClauses = Object.keys(where).map(key => `${mysql.escapeId(key)} = ?`);

    const sql = `UPDATE ${mysql.escapeId(table)} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
    const values = [...Object.values(data), ...Object.values(where)];

    const result: any = await rawQuery(sql, values);
    return result.affectedRows || 0;
  }

  static async delete(table: string, where: Record<string, any>): Promise<number> {
    if (Object.keys(where).length === 0) {
      throw new Error('DELETE without WHERE clause is forbidden');
    }

    const whereClauses = Object.keys(where).map(key => `${mysql.escapeId(key)) = ?`);
    const sql = `DELETE FROM ${mysql.escapeId(table)} WHERE ${whereClauses.join(' AND ')}`;
    const values = Object.values(where);

    const result: any = await rawQuery(sql, values);
    return result.affectedRows || 0;
  }

  static async count(table: string, where?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${mysql.escapeId(table)}`;
    const values: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        values.push(where[key]);
        return `${mysql.escapeId(key)} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await rawQueryOne<{ count: number }>(sql, values);
    return result?.count || 0;
  }

  static escapeIdentifier(identifier: string): string {
    return mysql.escapeId(identifier);
  }

  static escape(value: any): string {
    return mysql.escape(value);
  }
}
```

### Path: src/lib/services/backup.service.ts
```typescript
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { appConfig } from "@/config/app.config";

const execAsync = promisify(exec);

export class BackupService {
  private static backupsDir = path.join(process.cwd(), "backups");

  static ensureBackupsDirectory(): void {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  static async createBackup(): Promise<string> {
    this.ensureBackupsDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupsDir, filename);

    const configFile = this.createMyCnfFile();

    try {
      const command = `mysqldump --defaults-extra-file=${configFile} ${appConfig.database.database} > ${filepath}`;
      await execAsync(command);
      console.log(`Backup created: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("Backup failed:", error);
      throw new Error("Failed to create backup");
    } finally {
      this.cleanupMyCnfFile(configFile);
    }
  }

  static async restoreBackup(filepath: string): Promise<void> {
    if (!fs.existsSync(filepath)) {
      throw new Error("Backup file not found");
    }

    const configFile = this.createMyCnfFile();

    try {
      const command = `mysql --defaults-extra-file=${configFile} ${appConfig.database.database} < ${filepath}`;
      await execAsync(command);
      console.log(`Backup restored from: ${filepath}`);
    } catch (error) {
      console.error("Restore failed:", error);
      throw new Error("Failed to restore backup");
    } finally {
      this.cleanupMyCnfFile(configFile);
    }
  }

  private static createMyCnfFile(): string {
    const configPath = path.join(this.backupsDir, `.my.cnf.${Date.now()}`);
    const configContent = `[client]
host=${appConfig.database.host}
port=${appConfig.database.port}
user=${appConfig.database.user}
password=${appConfig.database.password}
`;
    fs.writeFileSync(configPath, configContent, { mode: 0o600 });
    return configPath;
  }

  private static cleanupMyCnfFile(configPath: string): void {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }

  static async listBackups(): Promise
    Array<{
      filename: string;
      filepath: string;
      size: number;
      created_at: Date;
    }>
  > {
    this.ensureBackupsDirectory();

    const files = fs.readdirSync(this.backupsDir);
    const backups = files
      .filter((file) => file.endsWith(".sql"))
      .map((file) => {
        const filepath = path.join(this.backupsDir, file);
        const stats = fs.statSync(filepath);

        return {
          filename: file,
          filepath,
          size: stats.size,
          created_at: stats.mtime,
        };
      })
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return backups;
  }

  static async deleteBackup(filepath: string): Promise<void> {
    if (!fs.existsSync(filepath)) {
      throw new Error("Backup file not found");
    }

    fs.unlinkSync(filepath);
    console.log(`Backup deleted: ${filepath}`);
  }

  static async cleanupOldBackups(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const backups = await this.listBackups();
    let deleted = 0;

    for (const backup of backups) {
      if (backup.created_at < cutoffDate) {
        await this.deleteBackup(backup.filepath);
        deleted++;
      }
    }

    return deleted;
  }
}
```

### Path: src/lib/services/cache.service.ts
```typescript
import NodeCache from "node-cache";

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 300);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): string[] {
    return this.cache.keys();
  }
}

export const cacheService = new CacheService();

```

### Path: src/lib/services/contact.service.ts
```typescript
import { query, queryOne, transaction } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { Contact, CreateContactDTO } from "@/types/database.types";
import { parse } from "csv-parse/sync";
import * as vcf from "vcf";

export class ContactService {
  static async createContact(data: CreateContactDTO): Promise<Contact> {
    const existing = await queryOne(
      "SELECT * FROM contacts WHERE phone_number = ? AND user_id = ?",
      [data.phone_number, data.user_id],
    );

    if (existing) {
      throw new Error("Contact with this phone number already exists");
    }

    const id = uuidv4();
    await query(
      `INSERT INTO contacts (id, name, phone_number, email, tags, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.phone_number,
        data.email || null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.user_id,
      ],
    );

    const contact = await queryOne<Contact>(
      "SELECT * FROM contacts WHERE id = ?",
      [id],
    );

    if (!contact) {
      throw new Error("Failed to create contact");
    }

    return contact;
  }

  static async getUserContacts(
    userId: string,
    params?: {
      search?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Contact[]> {
    let sql = "SELECT * FROM contacts WHERE user_id = ?";
    const queryParams: any[] = [userId];

    if (params?.search) {
      sql += " AND (name LIKE ? OR phone_number LIKE ?)";
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    sql += " ORDER BY name ASC";

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<Contact[]>(sql, queryParams);
  }

  static async getContact(id: string): Promise<Contact | null> {
    return queryOne<Contact>("SELECT * FROM contacts WHERE id = ?", [id]);
  }

  static async updateContact(
    id: string,
    data: Partial<CreateContactDTO>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.phone_number) {
      updates.push("phone_number = ?");
      params.push(data.phone_number);
    }

    if (data.email !== undefined) {
      updates.push("email = ?");
      params.push(data.email);
    }

    if (data.tags !== undefined) {
      updates.push("tags = ?");
      params.push(data.tags ? JSON.stringify(data.tags) : null);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async deleteContact(id: string): Promise<void> {
    await query("DELETE FROM contacts WHERE id = ?", [id]);
  }

  static async deleteMultipleContacts(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => "?").join(",");
    const result: any = await query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids,
    );

    return result.affectedRows || 0;
  }

  static async importFromCSV(
    csvContent: string,
    userId: string,
  ): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    return transaction(async (conn) => {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      let imported = 0;
      let failed = 0;
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2;

        try {
          if (!row.name || !row.phone_number) {
            throw new Error("Missing required fields: name or phone_number");
          }

          const id = uuidv4();
          await conn.execute(
            `INSERT INTO contacts (id, name, phone_number, email, tags, user_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              id,
              row.name,
              row.phone_number,
              row.email || null,
              row.tags
                ? JSON.stringify(
                    row.tags.split(",").map((t: string) => t.trim()),
                  )
                : null,
              userId,
            ],
          );

          imported++;
        } catch (error: any) {
          failed++;
          errors.push({
            row: rowNumber,
            error: error.message,
          });
        }
      }

      return { imported, failed, errors };
    });
  }

  static async importFromVCF(
    vcfContent: string,
    userId: string,
  ): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    return transaction(async (conn) => {
      const cards = vcf.parse(vcfContent);

      let imported = 0;
      let failed = 0;
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const rowNumber = i + 1;

        try {
          const name = card.get("fn")?.valueOf() || "Unknown";
          const tel = card.get("tel");

          if (!tel) {
            throw new Error("No phone number found");
          }

          const phoneNumber =
            typeof tel.valueOf() === "string"
              ? tel.valueOf()
              : tel.valueOf()[0];

          const email = card.get("email")?.valueOf();

          const id = uuidv4();
          await conn.execute(
            `INSERT INTO contacts (id, name, phone_number, email, user_id)
             VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              name,
              phoneNumber,
              typeof email === "string" ? email : null,
              userId,
            ],
          );

          imported++;
        } catch (error: any) {
          failed++;
          errors.push({
            row: rowNumber,
            error: error.message,
          });
        }
      }

      return { imported, failed, errors };
    });
  }

  static async exportToCSV(userId: string): Promise<string> {
    const contacts = await this.getUserContacts(userId);

    const headers = ["name", "phone_number", "email", "tags"];
    const rows = contacts.map((contact) => [
      contact.name,
      contact.phone_number,
      contact.email || "",
      contact.tags ? contact.tags.join(",") : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }

  static async countUserContacts(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM contacts WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }
}

```

### Path: src/lib/services/device.service.ts
```typescript
import { DeviceQueries } from "../db/queries/device.queries";
import { whatsappClientManager } from "../whatsapp/client-manager";
import { DeviceStatus, CreateDeviceDTO } from "@/types/database.types";

export class DeviceService {
  static async createDevice(data: CreateDeviceDTO) {
    const count = await DeviceQueries.countByUser(data.user_id);
    if (count >= 10) throw new Error("Maximum device limit reached");

    const device = await DeviceQueries.create(data);

    whatsappClientManager
      .initializeClient(device.id, device.phone_number)
      .catch((err) =>
        console.error(`[DeviceService] Init failed for ${device.id}`, err),
      );

    return device;
  }

  static async getDevice(id: string) {
    return DeviceQueries.findById(id);
  }

  static async getUserDevices(userId: string) {
    return DeviceQueries.findWithStats(userId);
  }

  static async getQRCode(deviceId: string) {
    const qrCode = whatsappClientManager.getQRCode(deviceId);
    const status =
      whatsappClientManager.getClientStatus(deviceId) ||
      DeviceStatus.DISCONNECTED;
    return { qrCode, status };
  }

  static async deleteDevice(deviceId: string) {
    await whatsappClientManager.disconnectClient(deviceId);
    await DeviceQueries.delete(deviceId);
  }

  static async reconnectDevice(deviceId: string) {
    const device = await DeviceQueries.findById(deviceId);
    if (!device) throw new Error("Device not found");

    await whatsappClientManager.disconnectClient(deviceId);
    setTimeout(() => {
      whatsappClientManager.initializeClient(device.id, device.phone_number);
    }, 1000);
  }
}

```

### Path: src/lib/services/email.service.ts
```typescript
import nodemailer from "nodemailer";
import { logger } from "./logger.service";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM || '"WhatsApp Dashboard" <noreply@example.com>',
        ...options,
      });

      logger.info(`Email sent: ${info.messageId}`, { to: options.to });
      return true;
    } catch (error) {
      logger.error("Failed to send email", { error, to: options.to });
      return false;
    }
  }

  static async sendLoginNotification(
    email: string,
    ip: string,
    userAgent: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: "New Login Detected",
      html: `
        <h3>New Login Detected</h3>
        <p>A new login was detected for your account.</p>
        <ul>
          <li><strong>IP Address:</strong> ${ip}</li>
          <li><strong>Device:</strong> ${userAgent}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If this wasn't you, please contact support immediately.</p>
      `,
    });
  }
}

```

### Path: src/lib/services/logger.service.ts
```typescript
import winston from "winston";
import { appConfig } from "@/config/app.config";
import * as fs from "fs";
import * as path from "path";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: appConfig.isDevelopment ? "debug" : "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (appConfig.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  );
}

export const logError = (error: unknown, context?: string) => {
  if (error instanceof Error) {
    logger.error(error.message, {
      stack: error.stack,
      context,
    });
  } else {
    logger.error(String(error), { context });
  }
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const logWarning = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

```

### Path: src/lib/services/message.service.ts
```typescript
import { MessageQueries } from "../db/queries/message.queries";
import { DeviceQueries } from "../db/queries/device.queries";
import { messageQueue } from "../whatsapp/message-queue";
import { transaction } from "../db";
import type { CreateMessageDTO } from "@/types/database.types";

export class MessageService {
  static async sendMessage(data: CreateMessageDTO) {
    const device = await DeviceQueries.findById(data.device_id);
    if (!device) throw new Error("Device not found");
    if (device.status !== "AUTHENTICATED" || !device.is_ready) {
      throw new Error("Device not ready");
    }

    const message = await MessageQueries.create(data);
    await messageQueue.addMessage(message.id, data.device_id);

    return message;
  }

  static async sendBulkMessages(params: {
    userId: string;
    contacts: Array<{ phoneNumber: string; name?: string }>;
    message: string;
    deviceIds?: string[];
    useRoundRobin?: boolean;
  }) {
    return transaction(async (conn) => {
      let devices = await DeviceQueries.findWithStats(params.userId);
      devices = devices.filter(
        (d) => d.status === "AUTHENTICATED" && d.is_ready,
      );

      if (devices.length === 0) throw new Error("No active devices found");

      if (params.deviceIds && params.deviceIds.length > 0) {
        devices = devices.filter((d) => params.deviceIds!.includes(d.id));
      }

      if (devices.length === 0)
        throw new Error("Selected devices are not active");

      const messages: CreateMessageDTO[] = [];
      let deviceIndex = 0;

      for (const contact of params.contacts) {
        const device = devices[deviceIndex % devices.length];

        messages.push({
          device_id: device.id,
          user_id: params.userId,
          to_number: contact.phoneNumber,
          message: params.message.replace("{{name}}", contact.name || ""),
        });

        if (params.useRoundRobin !== false) {
          deviceIndex++;
        }
      }

      const created = await MessageQueries.bulkCreate(messages);

      for (const msg of created) {
        await messageQueue.addMessage(msg.id, msg.device_id);
      }

      return { queued: created.length, total: params.contacts.length };
    });
  }

  static async getUserStats(userId: string) {
    const stats = await MessageQueries.getStatsByUserId(userId);

    const successRate =
      stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    return {
      ...stats,
      successRate,
    };
  }

  static async getMessageStats(params: {
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const stats = await MessageQueries.getDetailedStats(params);

    const successRate =
      stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    return {
      ...stats,
      successRate,
    };
  }

  static async getHourlyStats(deviceId?: string, hours: number = 24) {
    return MessageQueries.getHourlyStats(deviceId, hours);
  }
}

```

### Path: src/lib/services/pdf-export.service.ts
```typescript
import PDFDocument from "pdfkit";
import { Message } from "@/types/database.types";
import { format } from "date-fns";

export class PdfExportService {
  static async generateMessageReport(
    messages: Message[],
    title: string = "Message Report",
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header
      doc.fontSize(20).text("WhatsApp Dashboard", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text(title, { align: "center" });
      doc
        .fontSize(10)
        .text(`Generated: ${format(new Date(), "PPpp")}`, { align: "center" });
      doc.moveDown(2);

      // Table Header
      const tableTop = 150;
      const colDate = 50;
      const colTo = 180;
      const colStatus = 280;
      const colMsg = 380;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", colDate, tableTop);
      doc.text("To", colTo, tableTop);
      doc.text("Status", colStatus, tableTop);
      doc.text("Message", colMsg, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Rows
      let y = tableTop + 25;
      doc.font("Helvetica").fontSize(9);

      messages.forEach((msg) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.text(
          format(new Date(msg.created_at), "yyyy-MM-dd HH:mm"),
          colDate,
          y,
        );
        doc.text(msg.to_number, colTo, y);
        doc.text(msg.status, colStatus, y);

        // Truncate message for PDF view
        const truncatedMsg =
          msg.message.length > 50
            ? msg.message.substring(0, 47) + "..."
            : msg.message;
        doc.text(truncatedMsg, colMsg, y, { width: 170 });

        y += 20;
      });

      // Footer
      const stats = {
        total: messages.length,
        sent: messages.filter((m) =>
          ["SENT", "DELIVERED", "READ"].includes(m.status),
        ).length,
        failed: messages.filter((m) => m.status === "FAILED").length,
      };

      doc.moveDown(2);
      doc.fontSize(11).font("Helvetica-Bold").text("Summary");
      doc.font("Helvetica").fontSize(10);
      doc.text(`Total Messages: ${stats.total}`);
      doc.text(`Successful: ${stats.sent}`);
      doc.text(`Failed: ${stats.failed}`);

      doc.end();
    });
  }
}

```

### Path: src/lib/services/settings.service.ts
```typescript
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface SystemSettings {
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  maxDevicesPerUser: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  sessionTimeout: number;
  autoBackupEnabled: boolean;
  autoBackupInterval: number;
}

export class SettingsService {
  private static DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    rateLimitPerMinute: 20,
    rateLimitPerHour: 500,
    maxDevicesPerUser: 10,
    maxRetryAttempts: 3,
    retryDelayMs: 5000,
    sessionTimeout: 2592000,
    autoBackupEnabled: false,
    autoBackupInterval: 86400,
  };

  static async getSystemSettings(): Promise<SystemSettings> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE user_id IS NULL AND setting_key = 'system'",
    );

    if (!settings) {
      return this.DEFAULT_SYSTEM_SETTINGS;
    }

    try {
      return {
        ...this.DEFAULT_SYSTEM_SETTINGS,
        ...JSON.parse(settings.setting_value),
      };
    } catch {
      return this.DEFAULT_SYSTEM_SETTINGS;
    }
  }

  static async updateSystemSettings(
    settings: Partial<SystemSettings>,
  ): Promise<void> {
    const current = await this.getSystemSettings();
    const updated = { ...current, ...settings };

    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE user_id IS NULL AND setting_key = 'system'",
    );

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(updated), existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, NULL, 'system', ?)",
        [id, JSON.stringify(updated)],
      );
    }
  }

  static async getUserSettings(userId: string): Promise<Record<string, any>> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );

    if (!settings) return {};

    try {
      return JSON.parse(settings.setting_value);
    } catch {
      return {};
    }
  }

  static async updateUserSettings(
    userId: string,
    settings: Record<string, any>,
  ): Promise<void> {
    const current = await this.getUserSettings(userId);
    const updated = { ...current, ...settings };

    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(updated), existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, ?, 'user_preferences', ?)",
        [id, userId, JSON.stringify(updated)],
      );
    }
  }

  static async deleteUserSettings(userId: string): Promise<void> {
    await query(
      "DELETE FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );
  }

  static async getSetting(key: string, userId?: string): Promise<any | null> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = ? AND user_id = ?",
      [key, userId || null],
    );

    if (!settings) return null;

    try {
      return JSON.parse(settings.setting_value);
    } catch {
      return settings.setting_value;
    }
  }

  static async setSetting(
    key: string,
    value: any,
    userId?: string,
  ): Promise<void> {
    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE setting_key = ? AND user_id = ?",
      [key, userId || null],
    );

    const jsonValue = JSON.stringify(value);

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [jsonValue, existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, ?, ?, ?)",
        [id, userId || null, key, jsonValue],
      );
    }
  }
}

```

### Path: src/lib/services/storage.service.ts
```typescript
import { writeFile, mkdir, unlink, access, stat } from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { join, normalize, resolve, extname, basename } from "path";
import { v4 as uuidv4 } from "uuid";
import { pipeline } from "stream/promises";
import * as crypto from "crypto";

interface SaveFileResult {
  path: string;
  mimeType: string;
  size: number;
  hash: string;
}

interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export class StorageService {
  private static uploadDir = join(process.cwd(), "public", "uploads");
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  private static readonly ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "audio/mpeg",
    "audio/ogg",
    "application/pdf",
  ];

  private static readonly ALLOWED_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",
    ".mp3",
    ".ogg",
    ".pdf",
  ];

  static async saveFile(
    file: File,
    folder: string = "media",
    options?: FileValidationOptions,
  ): Promise<SaveFileResult> {
    await this.validateFile(file, options);

    const sanitizedFolder = this.sanitizePath(folder);
    const targetDir = join(this.uploadDir, sanitizedFolder);

    await this.ensureDirectory(targetDir);

    const fileExt = this.getSecureExtension(file.name, file.type);
    const filename = `${uuidv4()}${fileExt}`;
    const filepath = join(targetDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    await writeFile(filepath, buffer, { mode: 0o644 });

    return {
      path: `/uploads/${sanitizedFolder}/${filename}`,
      mimeType: file.type,
      size: file.size,
      hash,
    };
  }

  static async saveStream(
    stream: NodeJS.ReadableStream,
    filename: string,
    folder: string = "media",
  ): Promise<SaveFileResult> {
    const sanitizedFolder = this.sanitizePath(folder);
    const targetDir = join(this.uploadDir, sanitizedFolder);

    await this.ensureDirectory(targetDir);

    const fileExt = this.getSecureExtension(filename);
    const safeFilename = `${uuidv4()}${fileExt}`;
    const filepath = join(targetDir, safeFilename);

    const hash = crypto.createHash("sha256");
    let size = 0;

    const writeStream = createWriteStream(filepath, { mode: 0o644 });

    stream.on("data", (chunk) => {
      hash.update(chunk);
      size += chunk.length;

      if (size > this.MAX_FILE_SIZE) {
        stream.destroy();
        writeStream.destroy();
        throw new Error("File size exceeds maximum allowed");
      }
    });

    await pipeline(stream, writeStream);

    return {
      path: `/uploads/${sanitizedFolder}/${safeFilename}`,
      mimeType: "application/octet-stream",
      size,
      hash: hash.digest("hex"),
    };
  }

  static async deleteFile(relativePath: string): Promise<boolean> {
    try {
      const safePath = this.validatePath(relativePath);
      const absolutePath = join(process.cwd(), "public", safePath);

      await this.ensurePathSafety(absolutePath);
      await access(absolutePath);
      await unlink(absolutePath);

      return true;
    } catch (error) {
      console.error("Storage delete error:", error);
      return false;
    }
  }

  static async deleteMultiple(paths: string[]): Promise<{
    deleted: number;
    failed: number;
  }> {
    let deleted = 0;
    let failed = 0;

    await Promise.allSettled(
      paths.map(async (path) => {
        const success = await this.deleteFile(path);
        if (success) {
          deleted++;
        } else {
          failed++;
        }
      }),
    );

    return { deleted, failed };
  }

  static async fileExists(relativePath: string): Promise<boolean> {
    try {
      const safePath = this.validatePath(relativePath);
      const absolutePath = join(process.cwd(), "public", safePath);

      await this.ensurePathSafety(absolutePath);
      await access(absolutePath);

      return true;
    } catch {
      return false;
    }
  }

  static async getFileInfo(relativePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
  } | null> {
    try {
      const safePath = this.validatePath(relativePath);
      const absolutePath = join(process.cwd(), "public", safePath);

      await this.ensurePathSafety(absolutePath);
      const stats = await stat(absolutePath);

      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  static getAbsolutePath(relativePath: string): string {
    const safePath = this.validatePath(relativePath);
    return join(process.cwd(), "public", safePath);
  }

  static async cleanupOldFiles(
    folder: string,
    days: number = 7,
  ): Promise<number> {
    const sanitizedFolder = this.sanitizePath(folder);
    const targetDir = join(this.uploadDir, sanitizedFolder);

    let deleted = 0;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    try {
      const fs = await import("fs/promises");
      const files = await fs.readdir(targetDir);

      for (const file of files) {
        const filepath = join(targetDir, file);
        const stats = await stat(filepath);

        if (stats.isFile() && stats.mtimeMs < cutoffTime) {
          await unlink(filepath);
          deleted++;
        }
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }

    return deleted;
  }

  private static async validateFile(
    file: File,
    options?: FileValidationOptions,
  ): Promise<void> {
    const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
    const allowedMimeTypes =
      options?.allowedMimeTypes || this.ALLOWED_MIME_TYPES;
    const allowedExtensions =
      options?.allowedExtensions || this.ALLOWED_EXTENSIONS;

    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed (${maxSize} bytes)`);
    }

    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    const ext = extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`File extension ${ext} is not allowed`);
    }
  }

  private static sanitizePath(path: string): string {
    const normalized = normalize(path).replace(/^(\.\.(\/|\\|$))+/, "");

    return normalized
      .split(/[/\\]/)
      .filter((segment) => segment && segment !== "." && segment !== "..")
      .join("/");
  }

  private static validatePath(relativePath: string): string {
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;

    const sanitized = this.sanitizePath(cleanPath);

    if (sanitized.includes("..") || sanitized.startsWith("/")) {
      throw new Error("Invalid file path");
    }

    return sanitized;
  }

  private static async ensurePathSafety(absolutePath: string): Promise<void> {
    const uploadDir = resolve(this.uploadDir);
    const targetPath = resolve(absolutePath);

    if (!targetPath.startsWith(uploadDir)) {
      throw new Error("Path traversal attempt detected");
    }
  }

  private static getSecureExtension(
    filename: string,
    mimeType?: string,
  ): string {
    const ext = extname(filename).toLowerCase();

    if (this.ALLOWED_EXTENSIONS.includes(ext)) {
      return ext;
    }

    if (mimeType) {
      const mimeMap: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "application/pdf": ".pdf",
      };

      return mimeMap[mimeType] || ".bin";
    }

    return ".bin";
  }

  private static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await access(dirPath);
    } catch {
      await mkdir(dirPath, { recursive: true, mode: 0o755 });
    }
  }

  static async getStorageMetrics(): Promise<{
    totalFiles: number;
    totalSize: number;
    folders: Record<string, { files: number; size: number }>;
  }> {
    const fs = await import("fs/promises");
    const metrics = {
      totalFiles: 0,
      totalSize: 0,
      folders: {} as Record<string, { files: number; size: number }>,
    };

    try {
      const folders = await fs.readdir(this.uploadDir);

      for (const folder of folders) {
        const folderPath = join(this.uploadDir, folder);
        const folderStats = await stat(folderPath);

        if (folderStats.isDirectory()) {
          const files = await fs.readdir(folderPath);
          let folderSize = 0;
          let fileCount = 0;

          for (const file of files) {
            const filePath = join(folderPath, file);
            const fileStats = await stat(filePath);

            if (fileStats.isFile()) {
              folderSize += fileStats.size;
              fileCount++;
            }
          }

          metrics.folders[folder] = {
            files: fileCount,
            size: folderSize,
          };

          metrics.totalFiles += fileCount;
          metrics.totalSize += folderSize;
        }
      }
    } catch (error) {
      console.error("Error getting storage metrics:", error);
    }

    return metrics;
  }
}

```

### Path: src/lib/services/webhook.service.ts
```typescript
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import { logger } from "./logger.service";
import {
  ValidationError,
  NotFoundError,
  ExternalServiceError,
} from "@/lib/utils/error-handler";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  user_id: string;
  secret: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  duration: number;
}

interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export class WebhookService {
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT_MS = 10000;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000];

  static async createWebhook(data: {
    url: string;
    events: string[];
    user_id: string;
    secret?: string;
    is_active?: boolean;
  }): Promise<Webhook> {
    try {
      new URL(data.url);
    } catch {
      throw new ValidationError("Invalid webhook URL");
    }

    if (!data.events || data.events.length === 0) {
      throw new ValidationError("At least one event must be specified");
    }

    const validEvents = [
      "message.sent",
      "message.delivered",
      "message.read",
      "message.failed",
      "message.received",
      "message.status",
      "device.connected",
      "device.disconnected",
      "device.qr",
    ];

    const invalidEvents = data.events.filter((e) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      throw new ValidationError("Invalid events specified", { invalidEvents });
    }

    const id = uuidv4();
    const secret = data.secret || this.generateSecret();

    await query(
      `INSERT INTO webhooks (id, url, events, user_id, secret, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.url,
        JSON.stringify(data.events),
        data.user_id,
        secret,
        data.is_active !== undefined ? data.is_active : true,
      ],
    );

    const webhook = await queryOne<Webhook>(
      "SELECT * FROM webhooks WHERE id = ?",
      [id],
    );

    if (!webhook) {
      throw new Error("Failed to create webhook");
    }

    return webhook;
  }

  static async getUserWebhooks(userId: string): Promise<Webhook[]> {
    return query<Webhook[]>(
      "SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async getWebhook(id: string): Promise<Webhook | null> {
    return queryOne<Webhook>("SELECT * FROM webhooks WHERE id = ?", [id]);
  }

  static async updateWebhook(
    id: string,
    data: Partial<{
      url: string;
      events: string[];
      secret: string;
      is_active: boolean;
    }>,
  ): Promise<void> {
    if (data.url) {
      try {
        new URL(data.url);
      } catch {
        throw new ValidationError("Invalid webhook URL");
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.url !== undefined) {
      updates.push("url = ?");
      params.push(data.url);
    }

    if (data.events !== undefined) {
      updates.push("events = ?");
      params.push(JSON.stringify(data.events));
    }

    if (data.secret !== undefined) {
      updates.push("secret = ?");
      params.push(data.secret);
    }

    if (data.is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(data.is_active);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE webhooks SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async deleteWebhook(id: string): Promise<void> {
    await query("DELETE FROM webhooks WHERE id = ?", [id]);
  }

  static async triggerWebhook(
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhooks = await this.getActiveWebhooksForEvent(event);

    if (webhooks.length === 0) return;

    const promises = webhooks.map((webhook) =>
      this.deliverWebhook(webhook, event, payload),
    );

    await Promise.allSettled(promises);
  }

  private static async getActiveWebhooksForEvent(
    event: string,
  ): Promise<Webhook[]> {
    return query<Webhook[]>(
      `SELECT * FROM webhooks 
       WHERE is_active = true 
       AND JSON_CONTAINS(events, ?)`,
      [JSON.stringify(event)],
    );
  }

  private static async deliverWebhook(
    webhook: Webhook,
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhookPayload: WebhookPayload = {
      id: uuidv4(),
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const result = await this.sendWebhookRequest(webhook, webhookPayload);

      if (result.success) {
        logger.info("Webhook delivered successfully", {
          webhookId: webhook.id,
          event,
          attempt: attempt + 1,
          duration: result.duration,
        });
        return;
      }

      if (attempt < this.MAX_RETRIES - 1) {
        const delay = this.RETRY_DELAYS[attempt];
        logger.warn("Webhook delivery failed, retrying", {
          webhookId: webhook.id,
          event,
          attempt: attempt + 1,
          nextRetryIn: delay,
          error: result.error,
        });
        await this.sleep(delay);
      } else {
        logger.error("Webhook delivery failed after all retries", {
          webhookId: webhook.id,
          event,
          attempts: this.MAX_RETRIES,
          error: result.error,
        });
      }
    }
  }

  private static async sendWebhookRequest(
    webhook: Webhook,
    payload: WebhookPayload,
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "WA-Dashboard-Webhook/1.0",
        "X-Webhook-Event": payload.event,
        "X-Webhook-Id": payload.id,
        "X-Webhook-Timestamp": payload.timestamp,
      };

      if (webhook.secret) {
        const signature = this.generateSignature(body, webhook.secret);
        headers["X-Webhook-Signature"] = signature;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const duration = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          duration,
        };
      }

      const errorText = await response.text();

      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${errorText}`,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message || "Unknown error",
        duration,
      };
    }
  }

  private static generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret);

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  private static generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
    const webhook = await this.getWebhook(webhookId);

    if (!webhook) {
      throw new NotFoundError("Webhook", webhookId);
    }

    const testPayload: WebhookPayload = {
      id: uuidv4(),
      event: "test.webhook",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook",
      },
    };

    return this.sendWebhookRequest(webhook, testPayload);
  }

  static async getWebhookStats(webhookId: string, days: number = 7) {
    const webhook = await this.getWebhook(webhookId);

    if (!webhook) {
      throw new NotFoundError("Webhook", webhookId);
    }

    return {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      avgResponseTime: 0,
      lastDelivery: null,
    };
  }

  static async disableFailingWebhook(webhookId: string): Promise<void> {
    await this.updateWebhook(webhookId, { is_active: false });

    logger.warn("Webhook disabled due to repeated failures", { webhookId });
  }
}

```

### Path: src/lib/utils/api-response.ts
```typescript
import { NextResponse } from "next/server";

export function successResponse(data: any, options: { status?: number } = {}) {
  return NextResponse.json(
    { success: true, data },
    { status: options.status || 200 },
  );
}

export function errorResponse(
  message: string,
  statusCode: number,
  code: string,
) {
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status: statusCode },
  );
}

export function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number,
) {
  const totalPages = Math.ceil(total / limit);
  return NextResponse.json({
    success: true,
    data,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
}

export function handleApiError(error: any) {
  console.error("[API Error]", error);

  const message =
    error instanceof Error ? error.message : "Internal Server Error";

  if (message.toLowerCase().includes("not found"))
    return errorResponse(message, 404, "NOT_FOUND");
  if (message.toLowerCase().includes("unauthorized"))
    return errorResponse(message, 401, "UNAUTHORIZED");
  if (message.toLowerCase().includes("forbidden"))
    return errorResponse(message, 403, "FORBIDDEN");
  if (message.toLowerCase().includes("validation"))
    return errorResponse(message, 422, "VALIDATION_ERROR");

  return errorResponse("Internal Server Error", 500, "INTERNAL_ERROR");
}

export const unauthorizedResponse = (message: string = "Unauthorized") =>
  errorResponse(message, 401, "UNAUTHORIZED");

export const forbiddenResponse = (message: string = "Forbidden") =>
  errorResponse(message, 403, "FORBIDDEN");

export const notFoundResponse = (entity: string) =>
  errorResponse(`${entity} Not Found`, 404, "NOT_FOUND");

export const validationErrorResponse = (errors: any) =>
  NextResponse.json(
    { success: false, error: { message: "Validation Error", details: errors } },
    { status: 422 },
  );

export const rateLimitResponse = () =>
  errorResponse("Too Many Requests", 429, "RATE_LIMIT_EXCEEDED");

export const serverErrorResponse = (error: Error) => {
  console.error(error);
  return errorResponse("Internal Server Error", 500, "INTERNAL_ERROR");
};

```

### Path: src/lib/utils/cn.ts
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

```

### Path: src/lib/utils/distributed-rate-limiter.ts
```typescript
import Redis from "ioredis";
import { appConfig } from "@/config/app.config";

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class DistributedRateLimiter {
  private redis: Redis | null = null;
  private fallbackMemoryCache: Map<
    string,
    { count: number; expiresAt: number }
  > = new Map();

  constructor() {
    if (appConfig.redis) {
      this.redis = new Redis(appConfig.redis.url, {
        password: appConfig.redis.password,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      this.redis.on("error", (err) => {
        console.error("[RateLimiter] Redis error:", err);
      });

      this.redis.connect().catch((err) => {
        console.error("[RateLimiter] Failed to connect to Redis:", err);
      });
    }
  }

  async checkLimit(
    identifier: string,
    options: RateLimitOptions,
  ): Promise<RateLimitResult> {
    const { maxRequests, windowMs, keyPrefix = "ratelimit" } = options;
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (this.redis && this.redis.status === "ready") {
      return this.checkWithRedis(key, maxRequests, windowMs, now, windowStart);
    }

    return this.checkWithMemory(key, maxRequests, windowMs, now);
  }

  private async checkWithRedis(
    key: string,
    maxRequests: number,
    windowMs: number,
    now: number,
    windowStart: number,
  ): Promise<RateLimitResult> {
    const pipeline = this.redis!.pipeline();

    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error("Redis pipeline failed");
    }

    const count = results[2][1] as number;
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = new Date(now + windowMs);

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil(windowMs / 1000),
    };
  }

  private checkWithMemory(
    key: string,
    maxRequests: number,
    windowMs: number,
    now: number,
  ): RateLimitResult {
    const existing = this.fallbackMemoryCache.get(key);

    if (!existing || existing.expiresAt < now) {
      this.fallbackMemoryCache.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(now + windowMs),
      };
    }

    existing.count++;

    const allowed = existing.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - existing.count);
    const resetAt = new Date(existing.expiresAt);

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed
        ? undefined
        : Math.ceil((existing.expiresAt - now) / 1000),
    };
  }

  async reset(
    identifier: string,
    keyPrefix: string = "ratelimit",
  ): Promise<void> {
    const key = `${keyPrefix}:${identifier}`;

    if (this.redis && this.redis.status === "ready") {
      await this.redis.del(key);
    }

    this.fallbackMemoryCache.delete(key);
  }

  cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.fallbackMemoryCache.entries()) {
      if (value.expiresAt < now) {
        this.fallbackMemoryCache.delete(key);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export const distributedRateLimiter = new DistributedRateLimiter();

setInterval(() => {
  distributedRateLimiter.cleanupMemoryCache();
}, 60000);

```

### Path: src/lib/utils/error-handler.ts
```typescript
import { logger } from "@/lib/services/logger.service";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: any,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      isOperational: this.isOperational,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND", { resource, identifier });
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", resetAt?: Date) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { resetAt });
    this.name = "RateLimitError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, "CONFLICT", details);
    this.name = "ConflictError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      500,
      "DATABASE_ERROR",
      { originalError: originalError?.message },
      false,
    );
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(
      `External service '${service}' error: ${message}`,
      503,
      "EXTERNAL_SERVICE_ERROR",
      { service, originalError: originalError?.message },
      false,
    );
    this.name = "ExternalServiceError";
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      504,
      "TIMEOUT_ERROR",
      { operation, timeoutMs },
    );
    this.name = "TimeoutError";
  }
}

export function handleError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error(error.message, {
        stack: error.stack,
        context,
        code: error.code,
        details: error.details,
      });
    } else {
      logger.warn(error.message, {
        context,
        code: error.code,
        details: error.details,
      });
    }
    return error;
  }

  if (error instanceof Error) {
    logger.error(error.message, {
      stack: error.stack,
      context,
      name: error.name,
    });

    if (error.message.includes("ECONNREFUSED")) {
      return new ExternalServiceError("database", "Connection refused", error);
    }

    if (error.message.includes("timeout")) {
      return new TimeoutError(context || "unknown", 30000);
    }

    return new AppError(error.message, 500, "INTERNAL_ERROR", undefined, false);
  }

  const unknownError = new AppError(
    "An unknown error occurred",
    500,
    "UNKNOWN_ERROR",
    { error: String(error) },
    false,
  );

  logger.error(unknownError.message, {
    context,
    error: String(error),
  });

  return unknownError;
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {
    this.setupUncaughtHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupUncaughtHandlers(): void {
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", {
        error: error.message,
        stack: error.stack,
      });

      if (!isOperationalError(error)) {
        console.error("Non-operational error detected. Shutting down...");
        process.exit(1);
      }
    });

    process.on("unhandledRejection", (reason: any) => {
      logger.error("Unhandled Rejection:", {
        reason: reason?.message || String(reason),
        stack: reason?.stack,
      });

      if (reason instanceof Error && !isOperationalError(reason)) {
        console.error("Non-operational error detected. Shutting down...");
        process.exit(1);
      }
    });
  }

  public handle(error: unknown, context?: string): AppError {
    return handleError(error, context);
  }
}

export const errorHandler = ErrorHandler.getInstance();

export function createErrorResponse(error: AppError) {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    },
  };
}

export function sanitizeErrorForClient(error: AppError): any {
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    message: error.message,
    code: error.code,
    ...(isDevelopment && { stack: error.stack }),
    ...(error.details && { details: error.details }),
  };
}

```

### Path: src/lib/utils/password.ts
```typescript
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;
const PEPPER = process.env.PASSWORD_PEPPER || "";
const MIN_PASSWORD_LENGTH = 8;

export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    this.validatePassword(password);
    const pepperedPassword = password + PEPPER;
    return bcrypt.hash(pepperedPassword, SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const pepperedPassword = password + PEPPER;
    return bcrypt.compare(pepperedPassword, hash);
  }

  static validatePassword(password: string): void {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar)) {
      throw new Error(
        "Password must contain uppercase, lowercase, number, and special character",
      );
    }
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  static generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(32).toString("base64url");
    return `wwa_${timestamp}_${randomPart}`;
  }

  static hashApiKey(apiKey: string): string {
    return crypto
      .createHmac("sha256", process.env.API_KEY_SECRET || "default-secret")
      .update(apiKey)
      .digest("hex");
  }
}

```

### Path: src/lib/utils/phone-formatter.ts
```typescript
export class PhoneFormatter {
  static formatForWhatsApp(
    phoneNumber: string,
    countryCode: string = "62",
  ): string {
    let formatted = phoneNumber.replace(/\D/g, "");

    if (formatted.startsWith("0")) {
      formatted = countryCode + formatted.substring(1);
    } else if (!formatted.startsWith(countryCode)) {
      formatted = countryCode + formatted;
    }

    formatted = formatted.slice(0, 15);

    if (!formatted.endsWith("@c.us")) {
      formatted = `${formatted}@c.us`;
    }

    return formatted;
  }

  static validate(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  static normalize(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, "").slice(0, 15);
  }

  static format(
    phoneNumber: string,
    format: "international" | "local" = "international",
  ): string {
    const cleaned = this.normalize(phoneNumber);

    if (format === "international") {
      if (cleaned.startsWith("62")) {
        return `+${cleaned}`;
      }
      return `+62${cleaned}`;
    }

    if (cleaned.startsWith("62")) {
      return `0${cleaned.substring(2)}`;
    }

    return cleaned.startsWith("0") ? cleaned : `0${cleaned}`;
  }

  static sanitize(phoneNumber: string): string {
    return this.normalize(phoneNumber);
  }
}

```

### Path: src/lib/utils/rate-limiter.ts
```typescript
import { queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";

interface RateLimitConfig {
  perMinute?: number;
  perHour?: number;
  perDay?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: Date;
  reason?: string;
}

interface RateLimitWindow {
  count: number;
  resetAt: Date;
}

export class RateLimiter {
  private static cache: Map<string, RateLimitWindow[]> = new Map();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  static {
    this.startCleanup();
  }

  private static startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [key, windows] of this.cache.entries()) {
        const validWindows = windows.filter((w) => w.resetAt.getTime() > now);

        if (validWindows.length === 0) {
          this.cache.delete(key);
        } else if (validWindows.length !== windows.length) {
          this.cache.set(key, validWindows);
        }
      }
    }, 60000);
  }

  static async checkLimit(
    deviceId: string,
    config?: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const perMinute = config?.perMinute || appConfig.rateLimit.perMinute;
    const perHour = config?.perHour || appConfig.rateLimit.perHour;

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const [minuteResult, hourResult] = await Promise.all([
      this.checkWindow(deviceId, oneMinuteAgo, perMinute, "minute"),
      this.checkWindow(deviceId, oneHourAgo, perHour, "hour"),
    ]);

    if (!minuteResult.allowed) {
      return minuteResult;
    }

    if (!hourResult.allowed) {
      return hourResult;
    }

    return {
      allowed: true,
      remaining: perMinute - (minuteResult.remaining || 0),
    };
  }

  private static async checkWindow(
    deviceId: string,
    since: Date,
    limit: number,
    window: string,
  ): Promise<RateLimitResult> {
    const cacheKey = `${deviceId}:${window}`;
    const now = new Date();

    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? AND created_at >= ?`,
      [deviceId, since],
    );

    const count = result?.count || 0;

    if (count >= limit) {
      const resetAt = new Date(
        since.getTime() + (window === "minute" ? 60000 : 3600000),
      );

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        reason: `Rate limit exceeded: Max ${limit} messages per ${window}`,
      };
    }

    return {
      allowed: true,
      remaining: limit - count,
    };
  }

  static async checkApiKeyLimit(
    apiKey: string,
    limit: number = 1000,
    windowMs: number = 3600000,
  ): Promise<RateLimitResult> {
    const cacheKey = `apikey:${apiKey}`;
    const now = Date.now();
    const windows = this.cache.get(cacheKey) || [];

    const validWindows = windows.filter((w) => w.resetAt.getTime() > now);

    const totalCount = validWindows.reduce((sum, w) => sum + w.count, 0);

    if (totalCount >= limit) {
      const oldestWindow = validWindows.sort(
        (a, b) => a.resetAt.getTime() - b.resetAt.getTime(),
      )[0];

      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestWindow.resetAt,
        reason: `API key rate limit exceeded: Max ${limit} requests per hour`,
      };
    }

    const currentWindow: RateLimitWindow = {
      count: 1,
      resetAt: new Date(now + windowMs),
    };

    validWindows.push(currentWindow);
    this.cache.set(cacheKey, validWindows);

    return {
      allowed: true,
      remaining: limit - totalCount - 1,
    };
  }

  static async checkIpLimit(
    ipAddress: string,
    limit: number = 100,
    windowMs: number = 60000,
  ): Promise<RateLimitResult> {
    const cacheKey = `ip:${ipAddress}`;
    const now = Date.now();
    const windows = this.cache.get(cacheKey) || [];

    const validWindows = windows.filter((w) => w.resetAt.getTime() > now);

    const totalCount = validWindows.reduce((sum, w) => sum + w.count, 0);

    if (totalCount >= limit) {
      const oldestWindow = validWindows.sort(
        (a, b) => a.resetAt.getTime() - b.resetAt.getTime(),
      )[0];

      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestWindow.resetAt,
        reason: `IP rate limit exceeded: Max ${limit} requests per minute`,
      };
    }

    const existingWindow = validWindows.find(
      (w) => w.resetAt.getTime() > now && w.resetAt.getTime() <= now + windowMs,
    );

    if (existingWindow) {
      existingWindow.count++;
    } else {
      validWindows.push({
        count: 1,
        resetAt: new Date(now + windowMs),
      });
    }

    this.cache.set(cacheKey, validWindows);

    return {
      allowed: true,
      remaining: limit - totalCount - 1,
    };
  }

  static async getUsage(deviceId: string): Promise<{
    lastMinute: number;
    lastHour: number;
    lastDay: number;
  }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    const [minuteCount, hourCount, dayCount] = await Promise.all([
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages
         WHERE device_id = ? AND created_at >= ?`,
        [deviceId, oneMinuteAgo],
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages
         WHERE device_id = ? AND created_at >= ?`,
        [deviceId, oneHourAgo],
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages
         WHERE device_id = ? AND created_at >= ?`,
        [deviceId, oneDayAgo],
      ),
    ]);

    return {
      lastMinute: minuteCount?.count || 0,
      lastHour: hourCount?.count || 0,
      lastDay: dayCount?.count || 0,
    };
  }

  static async recordRequest(
    identifier: string,
    type: "device" | "apikey" | "ip" = "device",
  ): Promise<void> {
    const cacheKey = `${type}:${identifier}`;
    const now = Date.now();
    const windows = this.cache.get(cacheKey) || [];

    const validWindows = windows.filter((w) => w.resetAt.getTime() > now);

    const recentWindow = validWindows[validWindows.length - 1];

    if (recentWindow && recentWindow.resetAt.getTime() > now) {
      recentWindow.count++;
    } else {
      validWindows.push({
        count: 1,
        resetAt: new Date(now + 60000),
      });
    }

    this.cache.set(cacheKey, validWindows);
  }

  static clearCache(identifier?: string): void {
    if (identifier) {
      for (const type of ["device", "apikey", "ip"]) {
        this.cache.delete(`${type}:${identifier}`);
      }
    } else {
      this.cache.clear();
    }
  }

  static getCacheStats(): {
    totalEntries: number;
    totalWindows: number;
    cacheSize: number;
  } {
    let totalWindows = 0;

    for (const windows of this.cache.values()) {
      totalWindows += windows.length;
    }

    return {
      totalEntries: this.cache.size,
      totalWindows,
      cacheSize: totalWindows * 24,
    };
  }
}

```

### Path: src/lib/utils/storage.ts
```typescript
import * as fs from "fs";
import * as path from "path";

export class StorageService {
  private static uploadsDir = path.join(process.cwd(), "public", "uploads");
  private static backupsDir = path.join(process.cwd(), "backups");

  static ensureDirectories(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  static async saveUpload(file: File, userId: string): Promise<string> {
    this.ensureDirectories();

    const userDir = path.join(this.uploadsDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filepath = path.join(userDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Return relative path for public access
    return `/uploads/${userId}/${filename}`;
  }

  static async deleteUpload(filepath: string): Promise<void> {
    // Convert relative public path to absolute system path if needed
    let absolutePath = filepath;
    if (filepath.startsWith("/uploads")) {
      absolutePath = path.join(process.cwd(), "public", filepath);
    }

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }

  static async cleanupOldUploads(days: number = 7): Promise<number> {
    let deleted = 0;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const processDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);

        if (stats.isDirectory()) {
          processDir(filepath);
          // Remove empty directories
          if (fs.readdirSync(filepath).length === 0) {
            fs.rmdirSync(filepath);
          }
        } else if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filepath);
          deleted++;
        }
      }
    };

    processDir(this.uploadsDir);
    return deleted;
  }
}

```

### Path: src/lib/validations/schemas.ts
```typescript
import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .min(5, "Nomor terlalu pendek")
  .max(20, "Nomor terlalu panjang")
  .transform((val) => {
    let cleaned = val.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    }
    if (!cleaned.startsWith("62")) {
      cleaned = "62" + cleaned;
    }
    return cleaned.slice(0, 15);
  });

export const createDeviceSchema = z.object({
  name: z.string().min(1, "Nama device wajib diisi").max(50),
  phoneNumber: phoneNumberSchema,
});

export const sendMessageSchema = z.object({
  deviceId: z.string().uuid("Device ID tidak valid").optional(),
  toNumber: phoneNumberSchema,
  message: z.string().min(1, "Pesan tidak boleh kosong"),
});

export const sendBulkMessageSchema = z.object({
  deviceId: z.string().uuid().optional(),
  deviceIds: z.array(z.string().uuid()).optional(),
  message: z.string().min(1, "Pesan tidak boleh kosong"),
  contacts: z
    .array(
      z.object({
        phoneNumber: phoneNumberSchema,
        name: z.string().optional(),
      }),
    )
    .min(1, "Minimal 1 kontak tujuan")
    .max(1000, "Maksimal 1000 kontak per batch"),
  useRoundRobin: z.boolean().default(true),
});

export const createContactSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phoneNumber: phoneNumberSchema,
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Nama template wajib diisi"),
  content: z.string().min(1, "Isi template wajib diisi"),
  variables: z.record(z.string(), z.string()).optional().nullable(),
});

export const createAutoResponseSchema = z.object({
  keyword: z.string().min(1, "Keyword wajib diisi"),
  response: z.string().min(1, "Response wajib diisi"),
  deviceId: z.string().uuid("Device ID tidak valid"),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Nama API Key wajib diisi").max(50),
});

export const updateWebhookSchema = z.object({
  url: z.string().url("URL tidak valid").optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  is_active: z.boolean().optional(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  return {
    success: false as const,
    errors: result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  };
}

```

### Path: src/lib/whatsapp/client-manager-v2.ts
```typescript
import { Client, LocalAuth } from "whatsapp-web.js";
import {
  DeviceStatus,
  MessageDirection,
  MessageStatus,
} from "@/types/database.types";
import { SecureQueryBuilder } from "@/lib/db/secure-query";
import { structuredLogger } from "@/lib/logging/structured-logger";
import { EventEmitter } from "events";

interface ClientInstance {
  client: Client;
  deviceId: string;
  status: DeviceStatus;
  qrCode?: string;
  lastActivity: Date;
  healthCheckTimer?: NodeJS.Timeout;
  qrExpiresAt?: Date;
  reconnectAttempts: number;
}

export class WhatsAppClientManagerV2 extends EventEmitter {
  private clients: Map<string, ClientInstance> = new Map();
  private readonly MAX_CLIENTS = 50;
  private readonly QR_EXPIRATION_MS = 45000;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly HEALTH_CHECK_INTERVAL = 30000;
  private cleanupInterval: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor() {
    super();
    this.setMaxListeners(100);

    this.cleanupInterval = setInterval(() => {
      this.performCleanup().catch(console.error);
    }, 60000);

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      structuredLogger.info("Shutting down WhatsApp clients", { signal });

      clearInterval(this.cleanupInterval);

      await this.disconnectAll();
      process.exit(0);
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  }

  async initializeClient(deviceId: string, phoneNumber: string): Promise<void> {
    if (this.clients.size >= this.MAX_CLIENTS) {
      throw new Error("Maximum client limit reached");
    }

    const existing = this.clients.get(deviceId);
    if (existing?.status === DeviceStatus.AUTHENTICATED) {
      return;
    }

    if (existing) {
      await this.cleanup(deviceId);
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: deviceId,
        dataPath: "./sessions",
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
    });

    const instance: ClientInstance = {
      client,
      deviceId,
      status: DeviceStatus.CONNECTING,
      lastActivity: new Date(),
      reconnectAttempts: 0,
    };

    this.clients.set(deviceId, instance);
    this.attachEventHandlers(instance);

    try {
      await client.initialize();
      await SecureQueryBuilder.update(
        "devices",
        { status: DeviceStatus.CONNECTING, updated_at: new Date() },
        { id: deviceId },
      );
    } catch (error) {
      structuredLogger.error("Client initialization failed", {
        deviceId,
        error,
      });
      await this.cleanup(deviceId);
      throw error;
    }
  }

  private attachEventHandlers(instance: ClientInstance): void {
    const { client, deviceId } = instance;

    const handlers = {
      qr: (qr: string) => this.handleQR(instance, qr),
      ready: () => this.handleReady(instance),
      authenticated: () => this.handleAuthenticated(instance),
      disconnected: (reason: string) =>
        this.handleDisconnected(instance, reason),
      message: (msg: any) => this.handleMessage(instance, msg),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      client.on(event, handler);
    });

    instance.healthCheckTimer = setInterval(() => {
      this.checkHealth(instance);
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async handleQR(instance: ClientInstance, qr: string): Promise<void> {
    instance.qrCode = qr;
    instance.status = DeviceStatus.QR_READY;
    instance.qrExpiresAt = new Date(Date.now() + this.QR_EXPIRATION_MS);
    instance.lastActivity = new Date();

    await SecureQueryBuilder.update(
      "devices",
      { status: DeviceStatus.QR_READY, updated_at: new Date() },
      { id: instance.deviceId },
    );

    this.emit("qr_code", { deviceId: instance.deviceId, qr });
  }

  private async handleReady(instance: ClientInstance): Promise<void> {
    instance.status = DeviceStatus.AUTHENTICATED;
    instance.qrCode = undefined;
    instance.qrExpiresAt = undefined;
    instance.lastActivity = new Date();
    instance.reconnectAttempts = 0;

    await SecureQueryBuilder.update(
      "devices",
      {
        status: DeviceStatus.AUTHENTICATED,
        is_ready: true,
        last_seen: new Date(),
        updated_at: new Date(),
      },
      { id: instance.deviceId },
    );

    this.emit("client_ready", { deviceId: instance.deviceId });
  }

  private async handleAuthenticated(instance: ClientInstance): Promise<void> {
    instance.lastActivity = new Date();
    await SecureQueryBuilder.update(
      "devices",
      { status: DeviceStatus.CONNECTED, updated_at: new Date() },
      { id: instance.deviceId },
    );
  }

  private async handleDisconnected(
    instance: ClientInstance,
    reason: string,
  ): Promise<void> {
    structuredLogger.warn("Client disconnected", {
      deviceId: instance.deviceId,
      reason,
    });

    if (
      instance.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS &&
      !this.isShuttingDown
    ) {
      instance.reconnectAttempts++;

      setTimeout(() => {
        this.initializeClient(instance.deviceId, "").catch(console.error);
      }, 5000 * instance.reconnectAttempts);
    } else {
      await this.cleanup(instance.deviceId);
    }
  }

  private async handleMessage(
    instance: ClientInstance,
    message: any,
  ): Promise<void> {
    if (message.fromMe) return;

    instance.lastActivity = new Date();

    try {
      const device = await SecureQueryBuilder.selectOne<any>({
        table: "devices",
        where: { id: instance.deviceId },
        select: ["user_id", "phone_number"],
      });

      if (!device) return;

      await SecureQueryBuilder.insert("messages", {
        id: require("uuid").v4(),
        device_id: instance.deviceId,
        user_id: device.user_id,
        from_number: message.from.replace("@c.us", ""),
        to_number: device.phone_number,
        message: message.body,
        direction: MessageDirection.INBOUND,
        status: MessageStatus.DELIVERED,
        created_at: new Date(),
      });

      this.emit("message_received", {
        deviceId: instance.deviceId,
        from: message.from,
        body: message.body,
      });
    } catch (error) {
      structuredLogger.error("Message handling failed", {
        deviceId: instance.deviceId,
        error,
      });
    }
  }

  private async checkHealth(instance: ClientInstance): Promise<void> {
    const inactiveMs = Date.now() - instance.lastActivity.getTime();

    if (inactiveMs > 1800000) {
      structuredLogger.warn("Client inactive, cleaning up", {
        deviceId: instance.deviceId,
      });
      await this.cleanup(instance.deviceId);
    }

    if (instance.qrExpiresAt && Date.now() > instance.qrExpiresAt.getTime()) {
      instance.qrCode = undefined;
      instance.qrExpiresAt = undefined;
    }
  }

  private async performCleanup(): Promise<void> {
    for (const [deviceId, instance] of this.clients.entries()) {
      await this.checkHealth(instance);
    }
  }

  async sendMessage(
    deviceId: string,
    phoneNumber: string,
    message: string,
    messageId: string,
    mediaPath?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const instance = this.clients.get(deviceId);

    if (!instance || instance.status !== DeviceStatus.AUTHENTICATED) {
      return { success: false, error: "Device not ready" };
    }

    try {
      const formatted = phoneNumber.endsWith("@c.us")
        ? phoneNumber
        : `${phoneNumber}@c.us`;

      await instance.client.sendMessage(formatted, message);
      instance.lastActivity = new Date();

      await SecureQueryBuilder.update(
        "messages",
        { status: MessageStatus.SENT, sent_at: new Date() },
        { id: messageId },
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async cleanup(deviceId: string): Promise<void> {
    const instance = this.clients.get(deviceId);
    if (!instance) return;

    if (instance.healthCheckTimer) {
      clearInterval(instance.healthCheckTimer);
    }

    instance.client.removeAllListeners();

    try {
      await instance.client.destroy();
    } catch (error) {
      structuredLogger.error("Error destroying client", { deviceId, error });
    }

    this.clients.delete(deviceId);

    await SecureQueryBuilder.update(
      "devices",
      {
        status: DeviceStatus.DISCONNECTED,
        is_ready: false,
        updated_at: new Date(),
      },
      { id: deviceId },
    );
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((id) =>
      this.cleanup(id),
    );
    await Promise.allSettled(promises);
  }

  getQRCode(deviceId: string): string | undefined {
    return this.clients.get(deviceId)?.qrCode;
  }

  getStatus(deviceId: string): DeviceStatus | undefined {
    return this.clients.get(deviceId)?.status;
  }
}

export const whatsappClientManagerV2 = new WhatsAppClientManagerV2();

```

### Path: src/lib/whatsapp/client-manager.ts
```typescript
import { Client, LocalAuth, Message, MessageMedia } from "whatsapp-web.js";
import {
  DeviceStatus,
  MessageStatus,
  MessageDirection,
} from "@/types/database.types";
import { query, queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";
import { WebhookService } from "@/lib/services/webhook.service";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

const globalForWhatsapp = global as unknown as {
  whatsappClientManager: WhatsAppClientManager | undefined;
};

interface WhatsAppClientInstance {
  client: Client;
  deviceId: string;
  status: DeviceStatus;
  qrCode?: string;
  lastActivity: Date;
  healthCheckTimer?: NodeJS.Timeout;
  reconnectTimer?: NodeJS.Timeout;
}

export class WhatsAppClientManager extends EventEmitter {
  private clients: Map<string, WhatsAppClientInstance> = new Map();
  private sessionPath: string;
  private initializationLocks: Map<string, Promise<void>> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private readonly SESSION_TIMEOUT = 1800000;
  private readonly HEALTH_CHECK_INTERVAL = 60000;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    super();
    this.sessionPath = appConfig.whatsapp.sessionPath;
    this.ensureSessionDirectory().catch(console.error);
    this.startCleanupScheduler();
    this.setupSignalHandlers();
  }

  private async ensureSessionDirectory(): Promise<void> {
    try {
      await fs.access(this.sessionPath);
    } catch {
      await fs.mkdir(this.sessionPath, { recursive: true });
    }
  }

  private setupSignalHandlers(): void {
    const handleShutdown = async (signal: string) => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      console.log(`[WA] Received ${signal}, gracefully shutting down...`);

      if (this.cleanupTimer) {
        clearTimeout(this.cleanupTimer);
      }

      await this.disconnectAllClients();
      process.exit(0);
    };

    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGINT");

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  }

  private startCleanupScheduler(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleClients().catch(console.error);
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async cleanupStaleClients(): Promise<void> {
    const now = Date.now();
    const staleThreshold = this.SESSION_TIMEOUT;

    for (const [deviceId, instance] of this.clients.entries()) {
      const inactiveDuration = now - instance.lastActivity.getTime();

      if (inactiveDuration > staleThreshold) {
        console.log(`[WA] Cleaning up stale client: ${deviceId}`);
        await this.disconnectClient(deviceId);
      }
    }
  }

  async postStatus(
    deviceId: string,
    text: string,
    mediaPath?: string,
  ): Promise<void> {
    const instance = this.clients.get(deviceId);

    if (!instance?.client || instance.status !== DeviceStatus.AUTHENTICATED) {
      throw new Error("Device not authenticated");
    }

    try {
      const statusJid = "status@broadcast";

      if (mediaPath) {
        const absolutePath = path.join(process.cwd(), "public", mediaPath);

        try {
          await fs.access(absolutePath);
        } catch {
          throw new Error("Media file not found");
        }

        const media = MessageMedia.fromFilePath(absolutePath);
        await instance.client.sendMessage(statusJid, media, {
          caption: text || "",
        });
      } else if (text) {
        await instance.client.sendMessage(statusJid, text, {
          backgroundColor: "#3b82f6",
          font: 1,
        });
      } else {
        throw new Error("Content required");
      }

      instance.lastActivity = new Date();
      this.emit("status_posted", { deviceId, text, mediaPath });
    } catch (error: any) {
      console.error(`[WA] Status post failed for ${deviceId}:`, error);
      throw new Error(`Failed to post status: ${error.message}`);
    }
  }

  async initializeClient(deviceId: string, phoneNumber: string): Promise<void> {
    const existingLock = this.initializationLocks.get(deviceId);
    if (existingLock) {
      return existingLock;
    }

    const existing = this.clients.get(deviceId);
    if (existing?.status === DeviceStatus.AUTHENTICATED) {
      return;
    }

    const initPromise = this._doInitialize(deviceId, phoneNumber);
    this.initializationLocks.set(deviceId, initPromise);

    try {
      await initPromise;
    } finally {
      this.initializationLocks.delete(deviceId);
    }
  }

  private async _doInitialize(
    deviceId: string,
    _phoneNumber: string,
  ): Promise<void> {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: deviceId,
        dataPath: this.sessionPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-software-rasterizer",
        ],
        timeout: 60000,
      },
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },
    });

    this.clients.set(deviceId, {
      client,
      deviceId,
      status: DeviceStatus.CONNECTING,
      lastActivity: new Date(),
    });

    this.setupClientEvents(client, deviceId);

    try {
      await Promise.race([
        client.initialize(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Initialization timeout")), 120000),
        ),
      ]);

      await this.updateDeviceStatus(deviceId, DeviceStatus.CONNECTING);
      this.emit("client_initialized", { deviceId });
    } catch (error) {
      console.error(`[WA] Init failed for ${deviceId}:`, error);
      await this.updateDeviceStatus(deviceId, DeviceStatus.ERROR);
      this.clients.delete(deviceId);
      this.emit("client_error", { deviceId, error });
      throw error;
    }
  }

  private setupClientEvents(client: Client, deviceId: string): void {
    client.on("qr", async (qr: string) => {
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.qrCode = qr;
        instance.status = DeviceStatus.QR_READY;
        instance.lastActivity = new Date();
        await this.updateDeviceStatus(deviceId, DeviceStatus.QR_READY);
        this.emit("qr_code", { deviceId, qr });
      }
    });

    client.on("ready", async () => {
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.status = DeviceStatus.AUTHENTICATED;
        instance.qrCode = undefined;
        instance.lastActivity = new Date();
        await this.updateDeviceStatus(
          deviceId,
          DeviceStatus.AUTHENTICATED,
          true,
        );
        this.emit("client_ready", { deviceId });
      }
    });

    client.on("authenticated", async () => {
      await this.updateDeviceStatus(deviceId, DeviceStatus.CONNECTED);
      this.emit("client_authenticated", { deviceId });
    });

    client.on("disconnected", async (reason) => {
      console.log(`[WA] Client ${deviceId} disconnected:`, reason);
      await this.cleanupClient(deviceId);
      this.emit("client_disconnected", { deviceId, reason });
    });

    client.on("message_ack", async (msg, ack) => {
      const statusMap: Record<number, MessageStatus> = {
        1: MessageStatus.SENT,
        2: MessageStatus.DELIVERED,
        3: MessageStatus.READ,
      };

      const status = statusMap[ack] || MessageStatus.SENT;

      WebhookService.triggerWebhook("message.status", {
        deviceId,
        status,
        ackRaw: ack,
        timestamp: new Date(),
      }).catch(console.error);
    });

    client.on("message", async (message: Message) => {
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.lastActivity = new Date();
      }
      await this.handleIncomingMessage(deviceId, message);
    });
  }

  private async handleIncomingMessage(
    deviceId: string,
    message: Message,
  ): Promise<void> {
    if (message.fromMe) return;

    try {
      const device = await this.getDeviceUserId(deviceId);
      if (!device) return;

      const fromNumber = message.from.replace("@c.us", "");
      const messageBody = message.body;
      const messageId = uuidv4();

      await query(
        `INSERT INTO messages 
        (id, device_id, user_id, from_number, to_number, message, direction, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          deviceId,
          device.user_id,
          fromNumber,
          device.phone_number,
          messageBody,
          MessageDirection.INBOUND,
          MessageStatus.DELIVERED,
        ],
      );

      this.emit("message_received", {
        deviceId,
        messageId,
        fromNumber,
        messageBody,
      });

      await WebhookService.triggerWebhook("message.received", {
        messageId,
        deviceId,
        from: fromNumber,
        message: messageBody,
        timestamp: new Date(),
      });

      await this.processAutoResponse(
        deviceId,
        device.user_id,
        fromNumber,
        messageBody,
        message,
      );
    } catch (error) {
      console.error("[WA] Error handling incoming message:", error);
      this.emit("message_error", { deviceId, error });
    }
  }

  private async processAutoResponse(
    deviceId: string,
    userId: string,
    fromNumber: string,
    messageBody: string,
    message: Message,
  ): Promise<void> {
    const rules: any[] = await query(
      `SELECT * FROM auto_response_rules
       WHERE device_id = ? AND is_active = true
       ORDER BY priority DESC`,
      [deviceId],
    );

    for (const rule of rules) {
      if (messageBody.toLowerCase().includes(rule.keyword.toLowerCase())) {
        await message.reply(rule.response);

        const replyId = uuidv4();
        await query(
          `INSERT INTO messages 
          (id, device_id, user_id, to_number, message, direction, status, sent_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            replyId,
            deviceId,
            userId,
            fromNumber,
            rule.response,
            MessageDirection.OUTBOUND,
            MessageStatus.SENT,
          ],
        );

        this.emit("auto_response_sent", {
          deviceId,
          fromNumber,
          ruleId: rule.id,
        });
        break;
      }
    }
  }

  private async getDeviceUserId(
    deviceId: string,
  ): Promise<{ user_id: string; phone_number: string } | null> {
    return queryOne("SELECT user_id, phone_number FROM devices WHERE id = ?", [
      deviceId,
    ]);
  }

  private async updateDeviceStatus(
    deviceId: string,
    status: DeviceStatus,
    isReady: boolean = false,
  ): Promise<void> {
    await query(
      `UPDATE devices
       SET status = ?, is_ready = ?, last_seen = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [status, isReady, deviceId],
    );
  }

  async sendMessage(
    deviceId: string,
    phoneNumber: string,
    message: string,
    messageId: string,
    mediaPath?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const instance = this.clients.get(deviceId);

    if (!instance?.client) {
      return { success: false, error: "Device not initialized" };
    }

    if (
      instance.status !== DeviceStatus.AUTHENTICATED &&
      instance.status !== DeviceStatus.CONNECTED
    ) {
      return { success: false, error: "Device not authenticated" };
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const isRegistered =
        await instance.client.isRegisteredUser(formattedNumber);
      if (!isRegistered) {
        return {
          success: false,
          error: "Phone number not registered on WhatsApp",
        };
      }

      if (mediaPath) {
        const absolutePath = path.join(process.cwd(), "public", mediaPath);

        try {
          await fs.access(absolutePath);
        } catch {
          return { success: false, error: "Media file not found" };
        }

        const media = MessageMedia.fromFilePath(absolutePath);
        await instance.client.sendMessage(formattedNumber, media, {
          caption: message || "",
        });
      } else {
        if (!message) {
          return { success: false, error: "Message content required" };
        }
        await instance.client.sendMessage(formattedNumber, message);
      }

      instance.lastActivity = new Date();

      await query(
        `UPDATE messages
         SET status = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [MessageStatus.SENT, messageId],
      );

      this.emit("message_sent", { deviceId, messageId, phoneNumber });
      return { success: true };
    } catch (error: any) {
      console.error("[WA] Send message failed:", error);
      this.emit("message_send_error", { deviceId, messageId, error });
      return { success: false, error: error.message };
    }
  }

  async checkNumber(
    deviceId: string,
    phoneNumber: string,
  ): Promise<{
    registered: boolean;
    formattedNumber?: string;
    error?: string;
  }> {
    const instance = this.clients.get(deviceId);

    if (!instance?.client || instance.status !== DeviceStatus.AUTHENTICATED) {
      return { registered: false, error: "Device not ready" };
    }

    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      const isRegistered = await instance.client.isRegisteredUser(formatted);

      return {
        registered: isRegistered,
        formattedNumber: formatted.replace("@c.us", ""),
      };
    } catch (error: any) {
      return { registered: false, error: error.message };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let formatted = phoneNumber.replace(/\D/g, "");

    if (!formatted.startsWith("62") && formatted.startsWith("0")) {
      formatted = "62" + formatted.substring(1);
    }

    if (!formatted.endsWith("@c.us")) {
      formatted = `${formatted}@c.us`;
    }

    return formatted;
  }

  getQRCode(deviceId: string): string | undefined {
    return this.clients.get(deviceId)?.qrCode;
  }

  getClientStatus(deviceId: string): DeviceStatus | undefined {
    return this.clients.get(deviceId)?.status;
  }

  isClientReady(deviceId: string): boolean {
    const instance = this.clients.get(deviceId);
    return instance?.status === DeviceStatus.AUTHENTICATED;
  }

  async disconnectClient(deviceId: string): Promise<void> {
    await this.cleanupClient(deviceId);
  }

  private async cleanupClient(deviceId: string): Promise<void> {
    const instance = this.clients.get(deviceId);

    if (!instance) return;

    if (instance.healthCheckTimer) {
      clearTimeout(instance.healthCheckTimer);
    }

    if (instance.reconnectTimer) {
      clearTimeout(instance.reconnectTimer);
    }

    if (instance.client) {
      try {
        instance.client.removeAllListeners();
        await instance.client.destroy();
      } catch (error) {
        console.error(`[WA] Error destroying client ${deviceId}:`, error);
      }
    }

    this.clients.delete(deviceId);
    await this.updateDeviceStatus(deviceId, DeviceStatus.DISCONNECTED, false);
  }

  async disconnectAllClients(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((deviceId) =>
      this.cleanupClient(deviceId),
    );

    await Promise.allSettled(promises);
  }

  getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }

  getClientMetrics() {
    return {
      totalClients: this.clients.size,
      activeClients: Array.from(this.clients.values()).filter(
        (c) => c.status === DeviceStatus.AUTHENTICATED,
      ).length,
      connectingClients: Array.from(this.clients.values()).filter(
        (c) => c.status === DeviceStatus.CONNECTING,
      ).length,
    };
  }
}

export const whatsappClientManager =
  globalForWhatsapp.whatsappClientManager || new WhatsAppClientManager();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsapp.whatsappClientManager = whatsappClientManager;
}

```

### Path: src/lib/whatsapp/message-queue.ts
```typescript
import { query, queryOne, transaction } from "../db";
import { whatsappClientManager } from "./client-manager";
import { MessageStatus } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

const globalForQueue = global as unknown as {
  messageQueue: MessageQueue | undefined;
};

interface QueueItem {
  id: string;
  messageId: string;
  deviceId: string;
  priority: number;
  scheduledAt: Date;
  retries: number;
  lastError?: string;
}

interface QueueMetrics {
  queueSize: number;
  processing: boolean;
  pendingMessages: number;
  completedToday: number;
  failedToday: number;
}

class MessageQueue extends EventEmitter {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly maxConcurrent = 3;
  private readonly retryDelay = parseInt(process.env.RETRY_DELAY_MS || "5000");
  private readonly maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || "3");
  private readonly maxQueueSize = 10000;
  private activeProcessing: Set<string> = new Set();
  private isShuttingDown = false;

  constructor() {
    super();
    this.loadPendingMessages().catch(console.error);
    this.startProcessing();
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      console.log(`[Queue] Received ${signal}, shutting down...`);

      this.stopProcessing();
      await this.waitForProcessingComplete();

      console.log("[Queue] Shutdown complete");
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }

  private async waitForProcessingComplete(): Promise<void> {
    const maxWait = 30000;
    const startTime = Date.now();

    while (this.activeProcessing.size > 0) {
      if (Date.now() - startTime > maxWait) {
        console.warn("[Queue] Force shutdown, some messages may be incomplete");
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async loadPendingMessages(): Promise<void> {
    try {
      const pending: any[] = await query(
        `SELECT * FROM message_queue 
         WHERE status = 'PENDING' 
         ORDER BY priority DESC, scheduled_at ASC 
         LIMIT ?`,
        [this.maxQueueSize],
      );

      for (const item of pending) {
        this.queue.push({
          id: item.id,
          messageId: item.message_id,
          deviceId: item.device_id,
          priority: item.priority,
          scheduledAt: new Date(item.scheduled_at),
          retries: 0,
        });
      }

      console.log(`[Queue] Loaded ${pending.length} pending messages`);
      this.emit("queue_loaded", { count: pending.length });
    } catch (error) {
      console.error("[Queue] Failed to load pending messages:", error);
      this.emit("load_error", { error });
    }
  }

  async addMessage(
    messageId: string,
    deviceId: string,
    priority: number = 0,
    scheduledAt: Date = new Date(),
  ): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error("Queue is shutting down");
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Queue is full");
    }

    const queueId = uuidv4();

    await query(
      `INSERT INTO message_queue (id, message_id, device_id, priority, scheduled_at, status) 
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [queueId, messageId, deviceId, priority, scheduledAt],
    );

    this.queue.push({
      id: queueId,
      messageId,
      deviceId,
      priority,
      scheduledAt,
      retries: 0,
    });

    this.sortQueue();
    this.emit("message_added", { messageId, deviceId, priority });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
  }

  private startProcessing(): void {
    if (this.processingInterval || this.isShuttingDown) return;

    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.queue.length > 0 && !this.isShuttingDown) {
        await this.processQueue();
      }
    }, 1000);
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.isShuttingDown) return;

    this.processing = true;

    try {
      const now = new Date();
      const readyMessages = this.queue.filter(
        (item) =>
          item.scheduledAt <= now && !this.activeProcessing.has(item.id),
      );

      if (readyMessages.length === 0) {
        return;
      }

      const availableSlots = this.maxConcurrent - this.activeProcessing.size;
      const batch = readyMessages.slice(0, availableSlots);

      await Promise.allSettled(batch.map((item) => this.processMessage(item)));
    } catch (error) {
      console.error("[Queue] Error processing queue:", error);
      this.emit("processing_error", { error });
    } finally {
      this.processing = false;
    }
  }

  private async processMessage(item: QueueItem): Promise<void> {
    this.activeProcessing.add(item.id);

    try {
      const message: any = await queryOne(
        "SELECT * FROM messages WHERE id = ?",
        [item.messageId],
      );

      if (!message) {
        await this.removeFromQueue(item.id);
        return;
      }

      await query(
        `UPDATE messages SET status = ?, updated_at = NOW() WHERE id = ?`,
        [MessageStatus.SENDING, item.messageId],
      );

      await query(
        `UPDATE message_queue SET status = 'PROCESSING', processed_at = NOW() WHERE id = ?`,
        [item.id],
      );

      const result = await whatsappClientManager.sendMessage(
        item.deviceId,
        message.to_number,
        message.message,
        item.messageId,
        message.media_url || undefined,
      );

      if (result.success) {
        await this.markCompleted(item);
      } else {
        await this.handleFailure(item, result.error || "Unknown error");
      }
    } catch (error: any) {
      await this.handleFailure(item, error.message);
    } finally {
      this.activeProcessing.delete(item.id);
    }
  }

  private async markCompleted(item: QueueItem): Promise<void> {
    await transaction(async (conn) => {
      await conn.execute(
        `UPDATE message_queue SET status = 'COMPLETED', processed_at = NOW() WHERE id = ?`,
        [item.id],
      );
    });

    await this.removeFromQueue(item.id);
    this.emit("message_completed", { messageId: item.messageId });
  }

  private async handleFailure(item: QueueItem, error: string): Promise<void> {
    item.retries++;
    item.lastError = error;

    if (item.retries >= this.maxRetries) {
      await transaction(async (conn) => {
        await conn.execute(
          `UPDATE messages SET status = ?, error_message = ?, updated_at = NOW() WHERE id = ?`,
          [MessageStatus.FAILED, error, item.messageId],
        );

        await conn.execute(
          `UPDATE message_queue SET status = 'FAILED', processed_at = NOW() WHERE id = ?`,
          [item.id],
        );
      });

      await this.removeFromQueue(item.id);
      this.emit("message_failed", { messageId: item.messageId, error });
    } else {
      const backoffDelay = this.retryDelay * Math.pow(2, item.retries - 1);
      item.scheduledAt = new Date(Date.now() + backoffDelay);

      await transaction(async (conn) => {
        await conn.execute(
          `UPDATE messages SET status = ?, retry_count = ?, error_message = ?, updated_at = NOW() WHERE id = ?`,
          [MessageStatus.QUEUED, item.retries, error, item.messageId],
        );

        await conn.execute(
          `UPDATE message_queue SET status = 'PENDING', scheduled_at = ? WHERE id = ?`,
          [item.scheduledAt, item.id],
        );
      });

      this.sortQueue();
      this.emit("message_retry_scheduled", {
        messageId: item.messageId,
        attempt: item.retries,
        nextAttempt: item.scheduledAt,
      });
    }
  }

  private async removeFromQueue(queueId: string): Promise<void> {
    this.queue = this.queue.filter((item) => item.id !== queueId);
  }

  getStatus(): QueueMetrics {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      pendingMessages: this.queue.filter((i) => i.scheduledAt <= new Date())
        .length,
      completedToday: 0,
      failedToday: 0,
    };
  }

  async getDetailedMetrics(): Promise<
    QueueMetrics & { avgProcessingTime: number }
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [completed, failed]: any[] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) as count FROM message_queue 
         WHERE status = 'COMPLETED' AND processed_at >= ?`,
        [today],
      ),
      queryOne(
        `SELECT COUNT(*) as count FROM message_queue 
         WHERE status = 'FAILED' AND processed_at >= ?`,
        [today],
      ),
    ]);

    return {
      ...this.getStatus(),
      completedToday: completed?.count || 0,
      failedToday: failed?.count || 0,
      avgProcessingTime: 0,
    };
  }

  async cleanupOldRecords(days: number = 7): Promise<number> {
    const result: any = await query(
      `DELETE FROM message_queue 
       WHERE status IN ('COMPLETED', 'FAILED') 
       AND processed_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    return result.affectedRows || 0;
  }
}

export const messageQueue = globalForQueue.messageQueue || new MessageQueue();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.messageQueue = messageQueue;
}

```

### Path: src/lib/api-middlewares/cors.ts
```typescript
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
];

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-api-key",
  "x-correlation-id",
  "x-request-id",
];

const MAX_AGE = 86400;

export function secureCorsHeaders(origin?: string): HeadersInit {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
    "Access-Control-Max-Age": MAX_AGE.toString(),
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function handleSecureCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return NextResponse.json(
      {},
      {
        status: 204,
        headers: secureCorsHeaders(origin || undefined),
      },
    );
  }

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: "CORS policy violation" },
      { status: 403 },
    );
  }

  return null;
}

export function withSecureCors(
  handler: (req: NextRequest) => Promise<Response>,
) {
  return async (req: NextRequest) => {
    const corsResponse = handleSecureCors(req);
    if (corsResponse) return corsResponse;

    const response = await handler(req);
    const origin = req.headers.get("origin");
    const headers = secureCorsHeaders(origin || undefined);

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value as string);
    });

    return response;
  };
}

```

### Path: src/lib/api-middlewares/with-audit.ts
```typescript
import { NextRequest } from "next/server";
import { AuditLogQueries } from "@/lib/db/queries/audit-log.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export function withAudit(
  handler: (req: NextRequest) => Promise<Response>,
  action: string,
  entityType: string,
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    const response = await handler(req);

    if (session?.user && response.ok) {
      await AuditLogQueries.create({
        user_id: session.user.id,
        action,
        entity_type: entityType,
        ip_address: req.headers.get("x-forwarded-for") || req.ip || undefined,
        user_agent: req.headers.get("user-agent") || undefined,
      }).catch(console.error);
    }

    return response;
  };
}

```

### Path: src/lib/api-middlewares/with-auth.ts
```typescript
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { UserRole } from "@/types/database.types";
import { AuditLogQueries } from "@/lib/db/queries/audit-log.queries";

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

interface AuthOptions {
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  requireMFA?: boolean;
  skipAudit?: boolean;
}

interface SessionWithUser {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    mfaEnabled: boolean;
  };
}

export function withAuth(handler: RouteHandler, options?: AuthOptions) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = (await getServerSession(
        authOptions,
      )) as SessionWithUser | null;

      if (!session?.user) {
        return unauthorizedResponse("Authentication required");
      }

      if (options?.requireMFA && session.user.mfaEnabled) {
        const mfaVerified = req.headers.get("x-mfa-verified");
        if (mfaVerified !== "true") {
          return forbiddenResponse("MFA verification required");
        }
      }

      if (options?.requiredRole && session.user.role !== options.requiredRole) {
        await logAuthorizationFailure(
          req,
          session.user.id,
          options.requiredRole,
        );
        return forbiddenResponse("Insufficient permissions");
      }

      if (
        options?.allowedRoles &&
        !options.allowedRoles.includes(session.user.role)
      ) {
        await logAuthorizationFailure(
          req,
          session.user.id,
          options.allowedRoles.join(","),
        );
        return forbiddenResponse("Insufficient permissions");
      }

      if (!options?.skipAudit) {
        await logAccessAttempt(req, session.user.id, true);
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("Authentication error"));
    }
  };
}

export function withApiKey(handler: RouteHandler) {
  return async (req: NextRequest, context?: any) => {
    try {
      const apiKey = req.headers.get("x-api-key");

      if (!apiKey) {
        return unauthorizedResponse("API key required");
      }

      const { ApiKeyQueries } =
        await import("@/lib/db/queries/api-key.queries");

      const keyHash = ApiKeyQueries.hashApiKey(apiKey);
      const apiKeyRecord = await ApiKeyQueries.findByHash(keyHash);

      if (!apiKeyRecord) {
        await logApiKeyFailure(req, "invalid_key");
        return unauthorizedResponse("Invalid API key");
      }

      if (!apiKeyRecord.is_active) {
        await logApiKeyFailure(req, "inactive_key", apiKeyRecord.user_id);
        return unauthorizedResponse("API key is inactive");
      }

      await ApiKeyQueries.updateLastUsed(apiKeyRecord.id);

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("API key authentication error"));
    }
  };
}

export function withRoleCheck(allowedRoles: UserRole[]) {
  return (handler: RouteHandler) => {
    return withAuth(handler, { allowedRoles });
  };
}

export function withAdminOnly(handler: RouteHandler) {
  return withAuth(handler, { requiredRole: UserRole.ADMIN });
}

async function logAccessAttempt(
  req: NextRequest,
  userId: string,
  success: boolean,
): Promise<void> {
  try {
    await AuditLogQueries.create({
      user_id: userId,
      action: success ? "ACCESS_GRANTED" : "ACCESS_DENIED",
      entity_type: "API",
      ip_address: req.headers.get("x-forwarded-for") || req.ip,
      user_agent: req.headers.get("user-agent") || undefined,
    });
  } catch (error) {
    console.error("Failed to log access attempt:", error);
  }
}

async function logAuthorizationFailure(
  req: NextRequest,
  userId: string,
  requiredRole: string,
): Promise<void> {
  try {
    await AuditLogQueries.create({
      user_id: userId,
      action: "AUTHORIZATION_FAILED",
      entity_type: "API",
      new_value: { requiredRole, endpoint: req.url },
      ip_address: req.headers.get("x-forwarded-for") || req.ip,
      user_agent: req.headers.get("user-agent") || undefined,
    });
  } catch (error) {
    console.error("Failed to log authorization failure:", error);
  }
}

async function logApiKeyFailure(
  req: NextRequest,
  reason: string,
  userId?: string,
): Promise<void> {
  try {
    await AuditLogQueries.create({
      user_id: userId,
      action: "API_KEY_AUTH_FAILED",
      entity_type: "API",
      new_value: { reason, endpoint: req.url },
      ip_address: req.headers.get("x-forwarded-for") || req.ip,
      user_agent: req.headers.get("user-agent") || undefined,
    });
  } catch (error) {
    console.error("Failed to log API key failure:", error);
  }
}

export function combineMiddleware(
  ...middlewares: ((handler: RouteHandler) => RouteHandler)[]
) {
  return (handler: RouteHandler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler,
    );
  };
}

```

### Path: src/lib/api-middlewares/with-rate-limit.ts
```typescript
import { NextRequest } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

export function withRateLimit(handler: RouteHandler) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Basic rate limit check based on API Key if present
      const apiKey = req.headers.get("x-api-key");
      if (apiKey) {
        // Future implementation: Check rate limit per API key
        // const allowed = await RateLimiter.checkApiKeyLimit(apiKey);
        // if (!allowed) return rateLimitResponse();
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("Unknown error in middleware"));
    }
  };
}

```

### Path: src/lib/api-middlewares/with-validation.ts
```typescript
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

type RouteHandler<T = any> = (
  req: NextRequest,
  validated: T,
  context?: any,
) => Promise<Response>;

interface ValidationOptions {
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  options?: ValidationOptions,
) {
  return (handler: RouteHandler<T>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const contentType = req.headers.get("content-type") || "";

        let body: unknown;

        if (contentType.includes("application/json")) {
          try {
            body = await req.json();
          } catch {
            return validationErrorResponse([
              { field: "body", message: "Invalid JSON payload" },
            ]);
          }
        } else if (contentType.includes("multipart/form-data")) {
          const formData = await req.formData();
          body = Object.fromEntries(formData.entries());
        } else {
          return validationErrorResponse([
            { field: "content-type", message: "Unsupported content type" },
          ]);
        }

        const result = schema.safeParse(body);

        if (!result.success) {
          const errors = result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          }));

          return validationErrorResponse(errors);
        }

        return handler(req, result.data, context);
      } catch (error) {
        if (error instanceof Error) {
          return serverErrorResponse(error);
        }
        return serverErrorResponse(new Error("Validation error"));
      }
    };
  };
}

export function withQueryValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: RouteHandler<T>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const { searchParams } = new URL(req.url);
        const params = Object.fromEntries(searchParams.entries());

        const result = schema.safeParse(params);

        if (!result.success) {
          const errors = result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          }));

          return validationErrorResponse(errors);
        }

        return handler(req, result.data, context);
      } catch (error) {
        if (error instanceof Error) {
          return serverErrorResponse(error);
        }
        return serverErrorResponse(new Error("Query validation error"));
      }
    };
  };
}

export function withMultipartValidation<T>(
  schema: z.ZodSchema<T>,
  fileFields?: string[],
) {
  return (handler: RouteHandler<T & { files?: Record<string, File> }>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const formData = await req.formData();
        const data: Record<string, any> = {};
        const files: Record<string, File> = {};

        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            if (fileFields && fileFields.includes(key)) {
              files[key] = value;
            }
          } else {
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          }
        }

        const result = schema.safeParse(data);

        if (!result.success) {
          const errors = result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          }));

          return validationErrorResponse(errors);
        }

        const validatedData =
          Object.keys(files).length > 0
            ? { ...result.data, files }
            : result.data;

        return handler(
          req,
          validatedData as T & { files?: Record<string, File> },
          context,
        );
      } catch (error) {
        if (error instanceof Error) {
          return serverErrorResponse(error);
        }
        return serverErrorResponse(new Error("Multipart validation error"));
      }
    };
  };
}

export function sanitizeInput<T extends Record<string, any>>(input: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      sanitized[key as keyof T] = value
        .trim()
        .replace(/[<>]/g, "") as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === "string" ? item.trim().replace(/[<>]/g, "") : item,
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

```

### Path: src/lib/docs/openapi.json
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "WhatsApp Dashboard API",
    "version": "1.0.0",
    "description": "REST API documentation for WhatsApp Dashboard Multi-Device. Manage devices, send messages, and sync contacts."
  },
  "servers": [
    {
      "url": "http://localhost:3000/api",
      "description": "Local Development Server"
    }
  ],
  "components": {
    "securitySchemes": {
      "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      }
    }
  },
  "paths": {
    "/messages/send": {
      "post": {
        "summary": "Send a message",
        "security": [{ "ApiKeyAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "deviceId": {
                    "type": "string",
                    "format": "uuid",
                    "description": "ID of the sending device"
                  },
                  "toNumber": {
                    "type": "string",
                    "description": "Target phone number (e.g. 62812345678)"
                  },
                  "message": {
                    "type": "string",
                    "description": "Text message content"
                  }
                },
                "required": ["deviceId", "toNumber", "message"]
              }
            },
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "deviceId": { "type": "string", "format": "uuid" },
                  "toNumber": { "type": "string" },
                  "message": { "type": "string" },
                  "media": { "type": "string", "format": "binary" }
                },
                "required": ["deviceId", "toNumber"]
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Message queued successfully" },
          "401": { "description": "Unauthorized" },
          "422": { "description": "Validation Error" }
        }
      }
    },
    "/devices": {
      "get": {
        "summary": "List all devices",
        "security": [{ "ApiKeyAuth": [] }],
        "responses": {
          "200": { "description": "List of devices" }
        }
      }
    },
    "/contacts": {
      "get": {
        "summary": "List contacts",
        "security": [{ "ApiKeyAuth": [] }],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": { "type": "integer", "default": 1 }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 20 }
          }
        ],
        "responses": { "200": { "description": "Paginated contacts list" } }
      }
    }
  }
}

```

### Path: src/config/app.config.ts
```typescript
import { z } from "zod";

const envSchema = z.object({
  MARIADB_HOST: z.string().min(1),
  MARIADB_PORT: z.string().regex(/^\d+$/),
  MARIADB_USER: z.string().min(1),
  MARIADB_PASSWORD: z.string(),
  MARIADB_DATABASE: z.string().min(1),

  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  WHATSAPP_SESSION_PATH: z.string().default("./sessions"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  RATE_LIMIT_PER_MINUTE: z.string().regex(/^\d+$/).default("20"),
  RATE_LIMIT_PER_HOUR: z.string().regex(/^\d+$/).default("500"),
  RATE_LIMIT_PER_DAY: z.string().regex(/^\d+$/).default("10000"),

  MAX_RETRY_ATTEMPTS: z.string().regex(/^\d+$/).default("3"),
  RETRY_DELAY_MS: z.string().regex(/^\d+$/).default("5000"),

  CRON_SECRET: z.string().min(16),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  ENABLE_AUDIT_LOGS: z
    .string()
    .regex(/^(true|false)$/)
    .default("true"),

  MAX_UPLOAD_SIZE_MB: z.string().regex(/^\d+$/).default("16"),
  STORAGE_CLEANUP_DAYS: z.string().regex(/^\d+$/).default("30"),

  WEBHOOK_TIMEOUT_MS: z.string().regex(/^\d+$/).default("10000"),
  WEBHOOK_MAX_RETRIES: z.string().regex(/^\d+$/).default("3"),

  SESSION_TIMEOUT_MS: z.string().regex(/^\d+$/).default("1800000"),
  DB_CONNECTION_LIMIT: z.string().regex(/^\d+$/).default("20"),
  DB_IDLE_TIMEOUT_MS: z.string().regex(/^\d+$/).default("60000"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).optional(),
  SMTP_SECURE: z
    .string()
    .regex(/^(true|false)$/)
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),

  SENTRY_DSN: z.string().url().optional(),
  ENABLE_SENTRY: z
    .string()
    .regex(/^(true|false)$/)
    .default("false"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  if (typeof window !== "undefined") {
    return process.env as unknown as Env;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(", ")}`)
      .join("\n");

    console.error("\n=== ENVIRONMENT VALIDATION FAILED ===");
    console.error("Missing or invalid environment variables:\n");
    console.error(errorMessages);
    console.error("\n=== REQUIRED VARIABLES ===");
    console.error("Database:");
    console.error("  - MARIADB_HOST");
    console.error("  - MARIADB_PORT");
    console.error("  - MARIADB_USER");
    console.error("  - MARIADB_PASSWORD");
    console.error("  - MARIADB_DATABASE");
    console.error("\nAuthentication:");
    console.error("  - NEXTAUTH_URL (must be valid URL)");
    console.error("  - NEXTAUTH_SECRET (min 32 characters)");
    console.error("  - GOOGLE_CLIENT_ID");
    console.error("  - GOOGLE_CLIENT_SECRET");
    console.error("\nSecurity:");
    console.error("  - CRON_SECRET (min 16 characters)");
    console.error(
      "\nPlease check your .env file and ensure all required variables are set correctly.\n",
    );

    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Environment validation failed in production. Cannot start application.",
      );
    }

    console.warn("⚠️  Continuing with invalid environment in development mode");
    return process.env as unknown as Env;
  }

  return parsed.data;
}

export const env = validateEnv();

export const appConfig = {
  database: {
    host: env.MARIADB_HOST,
    port: parseInt(env.MARIADB_PORT),
    user: env.MARIADB_USER,
    password: env.MARIADB_PASSWORD,
    database: env.MARIADB_DATABASE,
    connectionLimit: parseInt(env.DB_CONNECTION_LIMIT),
    idleTimeout: parseInt(env.DB_IDLE_TIMEOUT_MS),
  },

  auth: {
    url: env.NEXTAUTH_URL,
    secret: env.NEXTAUTH_SECRET,
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  whatsapp: {
    sessionPath: env.WHATSAPP_SESSION_PATH,
    sessionTimeout: parseInt(env.SESSION_TIMEOUT_MS),
  },

  rateLimit: {
    perMinute: parseInt(env.RATE_LIMIT_PER_MINUTE),
    perHour: parseInt(env.RATE_LIMIT_PER_HOUR),
    perDay: parseInt(env.RATE_LIMIT_PER_DAY),
  },

  retry: {
    maxAttempts: parseInt(env.MAX_RETRY_ATTEMPTS),
    delayMs: parseInt(env.RETRY_DELAY_MS),
  },

  storage: {
    maxUploadSizeMB: parseInt(env.MAX_UPLOAD_SIZE_MB),
    cleanupDays: parseInt(env.STORAGE_CLEANUP_DAYS),
  },

  webhook: {
    timeoutMs: parseInt(env.WEBHOOK_TIMEOUT_MS),
    maxRetries: parseInt(env.WEBHOOK_MAX_RETRIES),
  },

  logging: {
    level: env.LOG_LEVEL,
    enableAudit: env.ENABLE_AUDIT_LOGS === "true",
  },

  smtp: env.SMTP_HOST
    ? {
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT || "587"),
        secure: env.SMTP_SECURE === "true",
        auth: {
          user: env.SMTP_USER || "",
          pass: env.SMTP_PASS || "",
        },
        from: env.SMTP_FROM || "",
      }
    : undefined,

  redis: env.REDIS_URL
    ? {
        url: env.REDIS_URL,
        password: env.REDIS_PASSWORD,
      }
    : undefined,

  sentry:
    env.SENTRY_DSN && env.ENABLE_SENTRY === "true"
      ? {
          dsn: env.SENTRY_DSN,
          environment: env.NODE_ENV,
        }
      : undefined,

  cronSecret: env.CRON_SECRET,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
} as const;

export function getConfig<K extends keyof typeof appConfig>(
  key: K,
): (typeof appConfig)[K] {
  return appConfig[key];
}

export function isFeatureEnabled(feature: string): boolean {
  const featureFlags: Record<string, boolean> = {
    auditLogs: appConfig.logging.enableAudit,
    redis: !!appConfig.redis,
    smtp: !!appConfig.smtp,
    sentry: !!appConfig.sentry,
  };

  return featureFlags[feature] ?? false;
}

export function validateProductionConfig(): void {
  if (!appConfig.isProduction) return;

  const requiredInProduction = [
    { key: "CRON_SECRET", value: env.CRON_SECRET },
    { key: "NEXTAUTH_SECRET", value: env.NEXTAUTH_SECRET },
  ];

  const missing = requiredInProduction.filter(
    ({ value }) => !value || value.length < 16,
  );

  if (missing.length > 0) {
    throw new Error(
      `Production configuration error: ${missing.map((m) => m.key).join(", ")} must be properly configured`,
    );
  }

  console.log("✅ Production configuration validated successfully");
}

if (appConfig.isProduction) {
  validateProductionConfig();
}

```

### Path: src/config/database.config.ts
```typescript
// src/config/database.config.ts
import { appConfig } from "./app.config";

export const databaseConfig = {
  host: appConfig.database.host,
  port: appConfig.database.port,
  user: appConfig.database.user,
  password: appConfig.database.password,
  database: appConfig.database.database,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: "+00:00",
  multipleStatements: false,
  namedPlaceholders: true,
};

```

### Path: src/middleware.ts
```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Bisa tambahkan logic custom di sini, misal cek role user
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Return true jika token ada (login)
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/messages/:path*",
    "/contacts/:path*",
    "/settings/:path*",
    // Lindungi API routes kecuali public ones
    "/api/devices/:path*",
    "/api/messages/:path*",
  ],
};

```

### Path: src/types/api.types.ts
```typescript
// src/types/api.types.ts

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchParams extends PaginationParams, SortParams {
  search?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export interface GetDevicesParams extends SearchParams {
  status?: string;
  userId?: string;
}

export interface CreateDeviceRequest {
  name: string;
  phoneNumber: string;
}

export interface DeviceQRResponse {
  qrCode: string;
  expiresAt: string;
}

export interface SendMessageRequest {
  deviceId: string;
  toNumber: string;
  message: string;
  scheduledAt?: string;
}

export interface SendBulkMessageRequest {
  deviceId: string;
  contacts: Array<{
    phoneNumber: string;
    name?: string;
  }>;
  message: string;
  useRoundRobin?: boolean;
}

export interface GetMessagesParams extends SearchParams {
  deviceId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ImportContactsRequest {
  file: File;
  userId: string;
}

export interface ImportContactsResponse {
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export interface GetStatsParams {
  startDate?: string;
  endDate?: string;
  deviceId?: string;
}

export interface StatsResponse {
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  successRate: number;
  deviceStats: Array<{
    deviceId: string;
    deviceName: string;
    messageCount: number;
    successRate: number;
  }>;
  hourlyStats: Array<{
    hour: string;
    count: number;
  }>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiError {
  validationErrors: ValidationError[];
}

```

### Path: src/types/database.types.ts
```typescript
export enum UserRole {
  ADMIN = "ADMIN",
  USER_A = "USER_A",
  USER_B = "USER_B",
  USER_C = "USER_C",
  DST = "DST",
}

export enum DeviceStatus {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  QR_READY = "QR_READY",
  AUTHENTICATED = "AUTHENTICATED",
  ERROR = "ERROR",
}

export enum MessageStatus {
  PENDING = "PENDING",
  QUEUED = "QUEUED",
  SENDING = "SENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}

export enum MessageDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
}

export interface Device {
  id: string;
  name: string;
  phone_number: string;
  status: DeviceStatus;
  is_ready: boolean;
  user_id: string;
  last_seen: Date | null;
  created_at: Date;
}

export interface Message {
  id: string;
  device_id: string;
  user_id: string;
  to_number: string;
  message: string;
  media_url?: string | null;
  media_type?: "image" | "video" | "audio" | "document" | null;
  caption?: string | null;
  direction: MessageDirection;
  from_number: string | null;
  status: MessageStatus;
  retry_count: number;
  error_message: string | null;
  created_at: Date;
  sent_at: Date | null;
}

export interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string | null;
  tags?: string[] | null;
  user_id: string;
  created_at: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables?: Record<string, string> | null;
  user_id: string;
  created_at: Date;
}

export interface AutoResponseRule {
  id: string;
  keyword: string;
  response: string;
  device_id: string;
  priority: number;
  is_active: boolean;
  created_at: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  user_id: string;
  is_active: boolean;
  last_used?: Date | null;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface DashboardStats {
  total_devices: number;
  active_devices: number;
  total_messages_today: number;
  success_rate: number;
  total_messages_sent: number;
  total_messages_failed: number;
}

export interface CreateDeviceDTO {
  name: string;
  phone_number: string;
  user_id: string;
}

export interface CreateMessageDTO {
  device_id: string;
  user_id: string;
  to_number: string;
  message?: string;
  media_path?: string;
  media_type?: "image" | "video" | "audio" | "document";
}

export interface CreateContactDTO {
  name: string;
  phone_number: string;
  email?: string | null;
  tags?: string[] | null;
  user_id: string;
}

export interface DeviceViewModel extends Device {
  message_count?: number;
  last_message_at?: Date;
}

```

### Path: src/types/index.ts
```typescript
// src/types/index.ts
export * from "./api.types";
export * from "./database.types";

```

### Path: src/types/next-auth.d.ts
```typescript
// src/types/next-auth.d.ts
import { UserRole } from "./database.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      mfaEnabled: boolean;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    mfaEnabled: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    mfaEnabled: boolean;
  }
}

```

### Path: src/types/vcf.d.ts
```typescript
// src/types/vcf.d.ts
declare module "vcf";

```

### Path: database/schema.sql
```sql
CREATE DATABASE IF NOT EXISTS whatsapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE whatsapp_db;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'USER_A', 'USER_B', 'USER_C', 'DST') NOT NULL DEFAULT 'USER_A',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'QR_READY', 'AUTHENTICATED', 'ERROR') NOT NULL DEFAULT 'DISCONNECTED',
  is_ready BOOLEAN DEFAULT FALSE,
  user_id VARCHAR(36) NOT NULL,
  session_data TEXT,
  last_seen TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  tags JSON,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_phone_user (phone_number, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_phone_number (phone_number),
  FULLTEXT idx_name_search (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  device_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  from_number VARCHAR(20),
  to_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  media_url VARCHAR(255),
  media_type ENUM('image', 'video', 'audio', 'document') DEFAULT NULL,
  caption TEXT,
  direction ENUM('INBOUND', 'OUTBOUND') NOT NULL DEFAULT 'OUTBOUND',
  status ENUM('PENDING', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_device_user (device_id, user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_numbers (from_number, to_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables JSON,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auto_response_rules (
  id VARCHAR(36) PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  response TEXT NOT NULL,
  match_type ENUM('EXACT', 'CONTAINS', 'AI') NOT NULL DEFAULT 'EXACT',
  device_id VARCHAR(36) NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_keyword (device_id, keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_key_hash (key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_queue (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  device_id VARCHAR(36) NOT NULL,
  priority INT DEFAULT 0,
  scheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_status_schedule (status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhooks (
  id VARCHAR(36) PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  events JSON NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  setting_key VARCHAR(255) NOT NULL,
  setting_value JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_key (user_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(36),
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_messages_device_status_created 
  ON messages(device_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_message_queue_priority_status 
  ON message_queue(priority DESC, status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_messages_user_created 
  ON messages(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_devices_user_status 
  ON devices(user_id, status, is_ready);

CREATE INDEX IF NOT EXISTS idx_contacts_user_phone 
  ON contacts(user_id, phone_number);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_active 
  ON api_keys(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
  ON audit_logs(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_active 
  ON webhooks(user_id, is_active);
```

