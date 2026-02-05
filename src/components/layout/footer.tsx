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
