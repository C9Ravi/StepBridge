"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import CreatorCredit from "@/components/shared/CreatorCredit";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  const [token, setToken] = useState(urlToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const hasTriggeredRef = React.useRef(false);

  const executeVerification = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) {
      setError("Please provide a valid verification token.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Email verification failed or token has expired.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlToken && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      executeVerification(urlToken);
    }
  }, [urlToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerification(token);
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-card">
            {!success ? (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5] mb-3 border border-indigo-100">
                    <MailCheck className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
                    Verify Your Email Address
                  </h1>
                  <p className="text-xs text-[#52525B] mt-1.5">
                    Confirm your institutional or corporate email to activate your account
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                    <div className="flex-1">
                      <div>{error}</div>
                      {error.includes("expired") && (
                        <div className="mt-1 text-[11px] text-rose-900">
                          Please log in or contact your administrator to generate a fresh verification link.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4F46E5] mb-3" />
                    <div className="text-xs font-semibold text-[#18181B]">
                      Verifying security token...
                    </div>
                    <div className="text-[11px] text-[#71717A] mt-1">
                      Connecting with StepBridge verification engine
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                        Verification Security Token
                      </label>
                      <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                        placeholder="Paste verification token from your inbox"
                        className="w-full font-mono rounded-lg border border-[#E4E4E7] px-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !token.trim()}
                      className="w-full rounded-lg bg-[#4F46E5] py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth shadow-subtle flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      <span>Verify Email & Activate Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-[#18181B]">Email Confirmed Successfully!</h2>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed">
                  Your identity has been verified. You now have full access to the StepBridge intelligence platform. Redirecting you to sign in...
                </p>
                <Link
                  href="/login?verified=true"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                >
                  <span>Continue to Sign In</span>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-[#71717A]">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
