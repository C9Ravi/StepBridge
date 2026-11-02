"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Building2,
  Briefcase,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import CreatorCredit from "@/components/shared/CreatorCredit";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: "STUDENT",
      label: "Student",
      name: "Aarav Patel",
      email: "aarav.patel@nitb.ac.in",
      pass: "Student2026!",
      icon: GraduationCap,
      color: "border-indigo-200 bg-indigo-50/60 text-indigo-900 hover:bg-indigo-100",
    },
    {
      role: "COLLEGE_ADMIN",
      label: "College TPO",
      name: "Dr. Ramesh Sharma",
      email: "tpo@nitb.ac.in",
      pass: "CollegeAdmin2026!",
      icon: Building2,
      color: "border-sky-200 bg-sky-50/60 text-sky-900 hover:bg-sky-100",
    },
    {
      role: "RECRUITER",
      label: "Recruiter",
      name: "Ananya Deshmukh",
      email: "ananya.recruiter@techcorp-innovations.io",
      pass: "Recruiter2026!",
      icon: Briefcase,
      color: "border-emerald-200 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100",
    },
    {
      role: "SUPER_ADMIN",
      label: "Super Admin",
      name: "Platform Admin",
      email: "admin@stepbridge.ai",
      pass: "Admin@StepBridge2026!",
      icon: ShieldCheck,
      color: "border-purple-200 bg-purple-50/60 text-purple-900 hover:bg-purple-100",
    },
  ];

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    submitLogin(demoEmail, demoPass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email address and password.");
      return;
    }
    submitLogin(email, password);
  };

  const submitLogin = async (userEmail: string, userPass: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: userPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid credentials or unauthorized account");
      }

      const role = data.data?.user?.role;

      // Role-based destination
      if (redirectParam) {
        router.push(redirectParam);
      } else if (role === "STUDENT") {
        router.push("/student");
      } else if (role === "COLLEGE_ADMIN") {
        router.push("/college");
      } else if (role === "RECRUITER") {
        router.push("/recruiter");
      } else if (role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between">
      {/* Header Bar */}
      <header className="border-b border-[#E4E4E7] bg-white py-4 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-white shadow-subtle">
            <span className="font-bold text-lg tracking-tight">S</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#18181B]">
            StepBridge<span className="text-[#4F46E5]">.ai</span>
          </span>
        </Link>

        <div className="text-xs text-[#52525B]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-[#4F46E5] hover:underline">
            Register now
          </Link>
        </div>
      </header>

      {/* Main Login Shell */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-card">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
                Welcome Back
              </h1>
              <p className="text-xs text-[#52525B] mt-1.5">
                Sign in to access your role-tailored career intelligence workspace
              </p>
            </div>

            {/* Quick 1-Click Demo Logins */}
            <div className="mb-6 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9] p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#18181B] mb-2.5">
                <span className="flex items-center gap-1.5 text-[#4F46E5]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Quick Demo Access
                </span>
                <span className="text-[11px] text-[#71717A] font-normal">Click to test as:</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((demo) => {
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => handleQuickLogin(demo.email, demo.pass)}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs font-medium transition-smooth ${demo.color}`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold truncate">{demo.label}</div>
                        <div className="text-[10px] opacity-75 truncate">{demo.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative my-6 flex items-center justify-center">
              <div className="border-t border-[#E4E4E7] w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider absolute">
                Or with credentials
              </span>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@nitb.ac.in"
                    className="w-full rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#18181B]">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-medium text-[#4F46E5] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#4F46E5] py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth shadow-subtle flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E7] bg-white py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#71717A]">
        <div>© 2026 StepBridge.ai • Career-Readiness Intelligence SaaS</div>
        <CreatorCredit />
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-[#71717A]">Loading authentication...</div>}>
      <LoginForm />
    </Suspense>
  );
}
