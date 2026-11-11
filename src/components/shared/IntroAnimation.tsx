"use client";

import React, { useState, useEffect } from "react";

export default function IntroAnimation() {
  const [show, setShow] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Only show on first visit within session
    try {
      const seen = sessionStorage.getItem("stepbridge_intro_seen");
      if (seen) {
        return;
      }

      // Check prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        sessionStorage.setItem("stepbridge_intro_seen", "true");
        return;
      }

      const showTimer = setTimeout(() => {
        setShow(true);
      }, 10);

      // Target ~2 seconds total animation
      const fadeTimer = setTimeout(() => {
        setFadingOut(true);
      }, 1800);

      const hideTimer = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem("stepbridge_intro_seen", "true");
      }, 2300);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } catch {
      // In case sessionStorage is unavailable
    }
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090B] text-white select-none transition-opacity duration-500 ease-out ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#4F46E5]/20 via-[#06B6D4]/15 to-[#8B5CF6]/20 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-[#4F46E5]/25 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Animated Logo Mark */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#06B6D4] to-[#8B5CF6] opacity-75 blur-md animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F0F12] border border-white/10 shadow-2xl">
            <span className="font-extrabold text-3xl tracking-tight bg-gradient-to-br from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              S
            </span>
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex items-center gap-1.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            StepBridge
          </h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            .in
          </span>
        </div>

        {/* Tagline */}
        <p className="mt-3 text-sm sm:text-base font-medium text-[#A1A1AA] tracking-wide max-w-sm">
          Bridging ambition with opportunity.
        </p>

        {/* Subtle Progress Indicator */}
        <div className="mt-8 w-36 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[#4F46E5] via-[#06B6D4] to-[#8B5CF6] animate-[shimmer_1.8s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
