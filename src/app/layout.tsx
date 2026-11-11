import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StepBridge.in — Career-Readiness Intelligence & Campus Placement Platform",
  description:
    "Bridge the gap between engineering college curriculum and industry hiring with measurable skill evidence, AI-powered roadmaps, and auditable placement operations.",
  keywords: [
    "career readiness",
    "campus placements",
    "engineering hiring",
    "placement drive management",
    "skill gap analysis",
    "resume analyzer",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAFAF9] text-[#18181B] selection:bg-[#EEF2FF] selection:text-[#4F46E5]">
        {children}
      </body>
    </html>
  );
}
