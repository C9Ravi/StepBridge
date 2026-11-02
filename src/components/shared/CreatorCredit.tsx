"use client";

import React from "react";

interface CreatorCreditProps {
  className?: string;
}

export default function CreatorCredit({ className = "" }: CreatorCreditProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-[#71717A] ${className}`}
    >
      <span>Crafted with purpose by</span>
      <a
        href="https://www.linkedin.com/in/ravi-chauhan-44ba85290/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ravi Chauhan on LinkedIn (opens in a new tab)"
        className="group inline-flex items-center gap-1 font-medium text-[#3F3F46] hover:text-[#0A66C2] transition-colors duration-200 underline-offset-4 hover:underline"
      >
        <span>Ravi Chauhan</span>
        <svg
          className="h-3.5 w-3.5 text-[#0A66C2] transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.33a1.64 1.64 0 0 0-1.66 1.64 1.63 1.63 0 0 0 1.66 1.63 1.63 1.63 0 0 0 1.65-1.63c0-.9-.74-1.64-1.65-1.64" />
        </svg>
      </a>
    </div>
  );
}
