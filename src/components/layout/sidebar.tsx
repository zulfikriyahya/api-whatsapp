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
