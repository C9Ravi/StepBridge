"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";
import CreatorCredit from "@/components/shared/CreatorCredit";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password complexity checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Please provide a valid security recovery token.");
      return;
    }
    if (!isPasswordValid) {
      setError("Please ensure your password satisfies all security requirements and matches confirmation.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Password reset failed. The token may be expired.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password reset failed");
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

        <Link
          href="/login"
          className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] flex items-center gap-1.5 transition-smooth"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      {/* Main Shell */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-card">
            {!success ? (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-[#4F46E5] mb-3 border border-indigo-100">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
                    Choose New Password
                  </h1>
                  <p className="text-xs text-[#52525B] mt-1.5">
                    Enter your security verification token and configure a new password
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                    <div className="flex-1">
                      <div>{error}</div>
                      {error.includes("expired") && (
                        <Link
                          href="/forgot-password"
                          className="mt-1 inline-block font-semibold underline text-rose-900"
                        >
                          Request a new reset link &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                      Reset Verification Token
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                      <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                        placeholder="Paste security token from email"
                        className="w-full font-mono rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                      New Password
                    </label>
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

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                      />
                    </div>
                  </div>

                  {/* Requirements checklist */}
                  <div className="rounded-lg bg-[#FAFAF9] border border-[#E4E4E7] p-3 text-[11px] grid grid-cols-2 gap-1.5">
                    <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-700" : "text-[#71717A]"}`}>
                      <CheckCircle2 className={`h-3 w-3 ${hasMinLength ? "text-emerald-600" : "text-[#D4D4D8]"}`} />
                      8+ characters
                    </span>
                    <span className={`flex items-center gap-1 ${hasUppercase ? "text-emerald-700" : "text-[#71717A]"}`}>
                      <CheckCircle2 className={`h-3 w-3 ${hasUppercase ? "text-emerald-600" : "text-[#D4D4D8]"}`} />
                      Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1 ${hasLowercase ? "text-emerald-700" : "text-[#71717A]"}`}>
                      <CheckCircle2 className={`h-3 w-3 ${hasLowercase ? "text-emerald-600" : "text-[#D4D4D8]"}`} />
                      Lowercase letter
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-700" : "text-[#71717A]"}`}>
                      <CheckCircle2 className={`h-3 w-3 ${hasNumber ? "text-emerald-600" : "text-[#D4D4D8]"}`} />
                      At least one number
                    </span>
                    <span className={`col-span-2 flex items-center gap-1 ${passwordsMatch ? "text-emerald-700" : "text-[#71717A]"}`}>
                      <CheckCircle2 className={`h-3 w-3 ${passwordsMatch ? "text-emerald-600" : "text-[#D4D4D8]"}`} />
                      Passwords match
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isPasswordValid || !token.trim()}
                    className="w-full rounded-lg bg-[#4F46E5] py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth shadow-subtle flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-[#18181B]">Password Reset Successfully!</h2>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed">
                  Your credentials have been updated securely and previous sessions have been invalidated. Redirecting you to sign in...
                </p>
                <Link
                  href="/login?reset=true"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                >
                  <span>Go to Sign In Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-[#71717A]">Loading reset portal...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
