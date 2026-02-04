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
