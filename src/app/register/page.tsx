"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  Briefcase,
  User,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Building,
} from "lucide-react";
import CreatorCredit from "@/components/shared/CreatorCredit";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<"STUDENT" | "COLLEGE_ADMIN" | "RECRUITER">("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Password does not meet enterprise security requirements.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, string> = {
        name,
        email,
        password,
        role,
      };

      if (role === "COLLEGE_ADMIN") {
        payload.institutionName = tenantName || "National Institute of Technology";
        payload.city = city;
      } else if (role === "RECRUITER") {
        payload.companyName = tenantName || "Enterprise Innovations Ltd";
        payload.location = city;
      }

      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed. Please check inputs.");
      }

      // Automatically log the new user in
      const loginRes = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        if (role === "STUDENT") router.push("/student");
        else if (role === "COLLEGE_ADMIN") router.push("/college");
        else if (role === "RECRUITER") router.push("/recruiter");
        else router.push("/");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#4F46E5] hover:underline">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Registration Shell */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-card">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
                Create Your Account
              </h1>
              <p className="text-xs text-[#52525B] mt-1.5">
                Join the verified career-readiness intelligence platform
              </p>
            </div>

            {/* Role Picker Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] mb-6">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-smooth ${
                  role === "STUDENT"
                    ? "bg-white text-[#4F46E5] shadow-subtle border border-[#E4E4E7]"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                <GraduationCap className="h-4 w-4 mb-1" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("COLLEGE_ADMIN")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-smooth ${
                  role === "COLLEGE_ADMIN"
                    ? "bg-white text-[#4F46E5] shadow-subtle border border-[#E4E4E7]"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                <Building2 className="h-4 w-4 mb-1" />
                <span>College TPO</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("RECRUITER")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-smooth ${
                  role === "RECRUITER"
                    ? "bg-white text-[#4F46E5] shadow-subtle border border-[#E4E4E7]"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                <Briefcase className="h-4 w-4 mb-1" />
                <span>Recruiter</span>
              </button>
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
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={role === "STUDENT" ? "e.g. Aarav Patel" : "e.g. Dr. Ramesh Sharma"}
                    className="w-full rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                  {role === "STUDENT"
                    ? "Institutional Student Email"
                    : role === "COLLEGE_ADMIN"
                    ? "College Domain Email (.ac.in / .edu)"
                    : "Work Email"}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={
                      role === "STUDENT"
                        ? "student@nitb.ac.in"
                        : role === "COLLEGE_ADMIN"
                        ? "tpo@institution.ac.in"
                        : "recruiter@company.io"
                    }
                    className="w-full rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                  />
                </div>
              </div>

              {role !== "STUDENT" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                      {role === "COLLEGE_ADMIN" ? "Institution Name" : "Company Name"}
                    </label>
                    <div className="relative">
                      <Building className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                      <input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        required
                        placeholder={role === "COLLEGE_ADMIN" ? "e.g. NIT Bangalore" : "e.g. TechCorp"}
                        className="w-full rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                      Location / City
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        placeholder="e.g. Bengaluru"
                        className="w-full rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create a strong password"
                    className="w-full rounded-lg border border-[#E4E4E7] pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                  />
                </div>

                {/* Password Complexity Indicators */}
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
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
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full rounded-lg bg-[#4F46E5] py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth shadow-subtle flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
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
