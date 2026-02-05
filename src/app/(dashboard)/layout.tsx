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
