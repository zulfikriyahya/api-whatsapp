"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-blue-500 dark:text-blue-400",
    },
    {
      label: "Devices",
      icon: Smartphone,
      href: "/devices",
      color: "text-violet-500 dark:text-violet-400",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/messages",
      color: "text-pink-500 dark:text-pink-400",
    },
    {
      label: "Contacts",
      icon: Users,
      href: "/contacts",
      color: "text-orange-500 dark:text-orange-400",
    },
    {
      label: "Templates",
      icon: FileText,
      href: "/templates",
      color: "text-emerald-500 dark:text-emerald-400",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      color: "text-gray-500 dark:text-gray-400",
    },
    {
      label: "Tools",
      icon: Wrench,
      href: "/tools/validator",
      color: "text-cyan-500 dark:text-cyan-400",
    },
    {
      label: "API Docs",
      icon: BookOpen,
      href: "/developer/api-docs",
      color: "text-indigo-500 dark:text-indigo-400",
    },
  ];

  if (userRole === UserRole.ADMIN) {
    routes.push({
      label: "Admin Users",
      icon: ShieldAlert,
      href: "/admin/users",
      color: "text-red-500 dark:text-red-400",
    });
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-sidebar border-r border-sidebar-border shadow-xl">
      <div className="px-6 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center mb-10 group">
          <div className="relative w-10 h-10 mr-3 flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            WA Dash
          </h1>
        </Link>
        <div className="space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200 ease-in-out",
                pathname === route.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm translate-x-1"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 hover:translate-x-1",
              )}>
              <div className="flex items-center flex-1">
                <route.icon
                  className={cn("h-5 w-5 mr-3 transition-colors", route.color)}
                />
                {route.label}
              </div>
              {pathname === route.href && (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 border-t border-sidebar-border/50">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground">
          <div className="flex items-center flex-1">
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </div>
        </button>
      </div>
    </div>
  );
}
