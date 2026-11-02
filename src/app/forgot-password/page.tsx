"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import CreatorCredit from "@/components/shared/CreatorCredit";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // PRD 12.15: Always show success regardless of whether email was found (timing & enumeration attack protection)
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        throw new Error(data.error?.message || "Password reset request failed.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
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

        <Link
          href="/login"
          className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] flex items-center gap-1.5 transition-smooth"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      {/* Main Form Shell */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-card">
            {!submitted ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
                    Reset Your Password
                  </h1>
                  <p className="text-xs text-[#52525B] mt-1.5">
                    Enter your registered email address and we will dispatch a secure 30-minute recovery token
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 flex items-start gap-2">
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
                        placeholder="name@domain.com"
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
                        <span>Sending Instructions...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
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
                <h2 className="text-lg font-bold text-[#18181B]">Recovery Instructions Dispatched</h2>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed">
                  If an account exists for <strong className="text-[#18181B]">{email}</strong>, a secure password reset link has been dispatched. For security reasons, tokens expire in 30 minutes.
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
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
