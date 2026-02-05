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
