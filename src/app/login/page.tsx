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
  CheckCircle2,
} from "lucide-react";
import CreatorCredit from "@/components/shared/CreatorCredit";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const isLoggedOut = searchParams.get("logged_out") === "true";
  const oauthError = searchParams.get("error");
  const oauthMessage = searchParams.get("message");
  const isVerified = searchParams.get("verified") === "true";
  const isReset = searchParams.get("reset") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: "STUDENT",
      label: "Student",
      name: "Ravi Chauhan",
      email: "ravi.chauhan@jcbust.ac.in",
      pass: "Student2026!",
      icon: GraduationCap,
      color: "border-indigo-200 bg-indigo-50/60 text-indigo-900 hover:bg-indigo-100",
    },
    {
      role: "COLLEGE_ADMIN",
      label: "College TPO",
      name: "Dr. Ramesh Sharma",
      email: "tpo@jcbust.ac.in",
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
      email: "admin@stepbridge.in",
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
        <Link href="/" className="flex items-center gap-2.5 group" title="Return to Homepage">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-white shadow-subtle group-hover:bg-[#4338CA] transition-smooth">
            <span className="font-bold text-lg tracking-tight">S</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#18181B] group-hover:text-[#4F46E5] transition-smooth">
            StepBridge<span className="text-[#4F46E5]">.in</span>
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

            {/* Logout feedback banner */}
            {isLoggedOut && (
              <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>You have been safely signed out. Thank you for using StepBridge.</span>
              </div>
            )}

            {/* Email Verified Banner */}
            {isVerified && (
              <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>Your email address has been verified! You can now access your account.</span>
              </div>
            )}

            {/* Password Reset Success Banner */}
            {isReset && (
              <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>Password updated successfully! Please log in with your new password.</span>
              </div>
            )}

            {/* OAuth Error Alert */}
            {oauthError && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <div className="font-semibold mb-0.5">Authentication Notice</div>
                  <div className="text-[11px] leading-relaxed">
                    {oauthMessage || "Google authentication could not be completed. Please use demo credentials or email login."}
                  </div>
                </div>
              </div>
            )}

            {/* Continue with Google */}
            <div className="mb-5">
              <a
                href={redirectParam ? `/api/auth/google?redirect=${encodeURIComponent(redirectParam)}` : "/api/auth/google"}
                onClick={() => setGoogleLoading(true)}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#D4D4D8] bg-white py-2.5 px-4 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] hover:border-[#A1A1AA] transition-smooth shadow-2xs cursor-pointer group"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#4F46E5]" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </a>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-[#E4E4E7] w-full" />
              <span className="bg-white px-3 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider absolute">
                Or with demo account
              </span>
            </div>

            {/* Quick 1-Click Demo Logins */}
            <div className="mb-5 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9] p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#18181B] mb-2">
                <span className="flex items-center gap-1.5 text-[#4F46E5]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Quick Demo Access
                </span>
                <span className="text-[11px] text-[#71717A] font-normal">Click to sign in:</span>
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

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-[#E4E4E7] w-full" />
              <span className="bg-white px-3 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider absolute">
                Or with email & password
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
                    placeholder="name@jcbust.ac.in"
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
        <div>© 2026 StepBridge.in • Career-Readiness Intelligence SaaS</div>
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
