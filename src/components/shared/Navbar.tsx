"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle,
  GraduationCap,
  Building2,
  Briefcase,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  LogOut,
} from "lucide-react";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "COLLEGE_ADMIN" | "RECRUITER" | "SUPER_ADMIN";
  tenantId?: string;
}

interface NavbarProps {
  currentRole?: string;
  onRoleSwitch?: (role: string) => void;
}

export default function Navbar({ currentRole = "STUDENT", onRoleSwitch }: NavbarProps) {
  const [unreadCount, setUnreadCount] = useState<number>(2);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; createdAt: string; readAt: string | null }[]>([
    {
      id: "n1",
      title: "New Placement Drive: TechCorp Innovations",
      body: "TechCorp has published a campus drive for 'Junior Full Stack Engineer' (₹12.5 LPA). Check eligibility now!",
      createdAt: "10 mins ago",
      readAt: null,
    },
    {
      id: "n2",
      title: "Assessment Graded: React & Modern Architecture",
      body: "Congratulations! You scored 100% on the React assessment. Verified evidence level updated to 4.",
      createdAt: "2 hours ago",
      readAt: null,
    },
  ]);

  const demoAccounts = [
    { name: "Ravi Chauhan", role: "STUDENT", label: "Student (Ravi Chauhan - JCBUST)", icon: GraduationCap, path: "/student" },
    { name: "Dr. Ramesh Sharma", role: "COLLEGE_ADMIN", label: "College TPO (JCBUST, YMCA Faridabad)", icon: Building2, path: "/college" },
    { name: "Ananya Deshmukh", role: "RECRUITER", label: "Recruiter (TechCorp)", icon: Briefcase, path: "/recruiter" },
    { name: "Super Admin", role: "SUPER_ADMIN", label: "Platform Super Admin", icon: ShieldCheck, path: "/admin" },
  ];

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E4E4E7] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-white shadow-subtle">
              <span className="font-bold text-lg tracking-tight">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#18181B]">
                StepBridge<span className="text-[#4F46E5]">.ai</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#52525B]">
                Career Readiness SaaS
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#52525B]">
            <Link
              href="/student"
              className={`hover:text-[#4F46E5] transition-smooth ${
                currentRole === "STUDENT" ? "text-[#4F46E5] font-semibold" : ""
              }`}
            >
              Student Portal
            </Link>
            <Link
              href="/student/domains"
              className="hover:text-[#4F46E5] transition-smooth flex items-center gap-1.5"
            >
              <span>Career Domains</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                12 Tracks
              </span>
            </Link>
            <Link
              href="/college"
              className={`hover:text-[#4F46E5] transition-smooth ${
                currentRole === "COLLEGE_ADMIN" ? "text-[#4F46E5] font-semibold" : ""
              }`}
            >
              College Operations
            </Link>
            <Link
              href="/recruiter"
              className={`hover:text-[#4F46E5] transition-smooth ${
                currentRole === "RECRUITER" ? "text-[#4F46E5] font-semibold" : ""
              }`}
            >
              Recruiter Hub
            </Link>
            <Link
              href="/admin"
              className={`hover:text-[#4F46E5] transition-smooth ${
                currentRole === "SUPER_ADMIN" ? "text-[#4F46E5] font-semibold" : ""
              }`}
            >
              Super Admin
            </Link>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3.5">
          {/* Persona Switcher Selector for autonomous verification */}
          <div className="relative inline-block text-left">
            <select
              value={currentRole}
              onChange={(e) => {
                if (onRoleSwitch) onRoleSwitch(e.target.value);
              }}
              className="appearance-none rounded-lg border border-[#E4E4E7] bg-[#F4F4F5] py-1.5 pl-3 pr-8 text-xs font-semibold text-[#18181B] hover:bg-[#EEF2FF] hover:border-[#4F46E5] transition-smooth cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            >
              {demoAccounts.map((acc) => (
                <option key={acc.role} value={acc.role}>
                  {acc.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#52525B]" />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-smooth"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4F46E5] text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7]">
                  <span className="font-semibold text-sm text-[#18181B]">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium text-[#4F46E5] hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="mt-2 divide-y divide-[#F4F4F5] max-h-72 overflow-y-auto">
                  {notifications.map((item) => (
                    <div key={item.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[#18181B]">{item.title}</h4>
                        <span className="text-[10px] text-[#71717A] whitespace-nowrap">{item.createdAt}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#52525B] leading-relaxed">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Active Status Badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Pilot Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
