"use client";

import React from "react";
import Link from "next/link";
import CreatorCredit from "./CreatorCredit";

export default function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-[#E4E4E7] bg-white py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#71717A]">
          <Link href="/" className="font-semibold text-[#18181B] hover:text-[#4F46E5] transition-colors">
            StepBridge<span className="text-[#4F46E5]">.in</span>
          </Link>
          <span>•</span>
          <span>Career-Readiness Intelligence Platform</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">© 2026</span>
        </div>
        <CreatorCredit />
      </div>
    </footer>
  );
}
