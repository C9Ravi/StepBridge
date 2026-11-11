"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Info,
} from "lucide-react";
import CreatorCredit from "@/components/shared/CreatorCredit";

type RoleType = "STUDENT" | "COLLEGE_ADMIN" | "RECRUITER";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  tenantName?: string;
  city?: string;
  role?: string;
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query parameters (e.g. from OAuth redirect fallback)
  const oauthError = searchParams.get("error");
  const oauthMessage = searchParams.get("message");

  // Form State
  const [role, setRole] = useState<RoleType>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [city, setCity] = useState("Bengaluru");

  // Touch tracking to ensure no errors show on initial render or before user interaction
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Submission State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  // Live password complexity indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  // Email regex format validator
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Field validation function (called on blur and real-time when field is touched)
  const validateField = (fieldName: string, val: string, currentRole = role): string | undefined => {
    switch (fieldName) {
      case "name":
        if (!val.trim()) return "Full name is required.";
        if (val.trim().length < 2) return "Name must be at least 2 characters.";
        return undefined;

      case "email":
        if (!val.trim()) {
          return currentRole === "STUDENT"
            ? "Institutional Student Email is required."
            : currentRole === "COLLEGE_ADMIN"
            ? "College domain email is required."
            : "Work email is required.";
        }
        if (!isValidEmail(val)) {
          return "Please enter a valid email address (e.g. user@domain.edu).";
        }
        return undefined;

      case "password":
        if (!val) return "Password is required.";
        if (val.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(val)) return "Password must contain at least one uppercase letter.";
        if (!/[a-z]/.test(val)) return "Password must contain at least one lowercase letter.";
        if (!/[0-9]/.test(val)) return "Password must contain at least one number.";
        return undefined;

      case "tenantName":
        if (currentRole !== "STUDENT") {
          if (!val.trim()) {
            return currentRole === "COLLEGE_ADMIN"
              ? "Institution name is required."
              : "Company name is required.";
          }
          if (val.trim().length < 2) {
            return currentRole === "COLLEGE_ADMIN"
              ? "Institution name must be at least 2 characters."
              : "Company name must be at least 2 characters.";
          }
        }
        return undefined;

      case "city":
        if (currentRole !== "STUDENT" && !val.trim()) {
          return "City / Location is required.";
        }
        return undefined;

      default:
        return undefined;
    }
  };

  // Run full form validation
  const validateAll = (): { isValid: boolean; errors: FieldErrors } => {
    const errors: FieldErrors = {};

    const nameErr = validateField("name", name);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateField("email", email);
    if (emailErr) errors.email = emailErr;

    const passErr = validateField("password", password);
    if (passErr) errors.password = passErr;

    if (role !== "STUDENT") {
      const tenantErr = validateField("tenantName", tenantName);
      if (tenantErr) errors.tenantName = tenantErr;

      const cityErr = validateField("city", city);
      if (cityErr) errors.city = cityErr;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  // Blur handler: mark field as touched and run validation
  const handleBlur = (fieldName: string, val: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const errorMsg = validateField(fieldName, val);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (errorMsg) {
        updated[fieldName as keyof FieldErrors] = errorMsg;
      } else {
        delete updated[fieldName as keyof FieldErrors];
      }
      return updated;
    });
  };

  // Change handler: updates state and re-validates if already touched
  const handleChange = (fieldName: string, val: string) => {
    if (fieldName === "name") setName(val);
    else if (fieldName === "email") setEmail(val);
    else if (fieldName === "password") setPassword(val);
    else if (fieldName === "tenantName") setTenantName(val);
    else if (fieldName === "city") setCity(val);

    // If the field was already touched, perform real-time error resolution
    if (touched[fieldName]) {
      const errorMsg = validateField(fieldName, val);
      setFieldErrors((prev) => {
        const updated = { ...prev };
        if (errorMsg) {
          updated[fieldName as keyof FieldErrors] = errorMsg;
        } else {
          delete updated[fieldName as keyof FieldErrors];
        }
        return updated;
      });
    }

    // Reset top-level server conflict alert when user modifies email
    if (fieldName === "email" && isConflict) {
      setIsConflict(false);
      setServerError(null);
    }
  };

  // Role change handler
  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    setServerError(null);
    setIsConflict(false);
    // If tenant fields were previously touched, clear their errors when switching to STUDENT
    if (newRole === "STUDENT") {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.tenantName;
        delete updated.city;
        return updated;
      });
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate requests while an in-flight request is processing
    if (loading) return;

    // Mark all relevant fields as touched
    const allTouched: Record<string, boolean> = {
      name: true,
      email: true,
      password: true,
      ...(role !== "STUDENT" ? { tenantName: true, city: true } : {}),
    };
    setTouched(allTouched);

    // Execute comprehensive validation
    const { isValid, errors } = validateAll();
    if (!isValid) {
      setFieldErrors(errors);
      setServerError("Please correct the errors in the highlighted fields below.");
      // Focus first error element
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(`register-${firstErrorField}`);
      if (el) el.focus();
      return;
    }

    setLoading(true);
    setServerError(null);
    setIsConflict(false);

    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      };

      if (role === "COLLEGE_ADMIN") {
        payload.institutionName = tenantName.trim() || "JCBUST, YMCA Faridabad";
        payload.city = city.trim() || "Bengaluru";
      } else if (role === "RECRUITER") {
        payload.companyName = tenantName.trim() || "Enterprise Innovations Ltd";
        payload.location = city.trim() || "Bengaluru";
      }

      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle 409 Conflict (Duplicate Email)
        if (res.status === 409) {
          setIsConflict(true);
          setFieldErrors((prev) => ({
            ...prev,
            email: "This email address is already registered.",
          }));
          throw new Error(
            data.error?.message ||
              "An account with this email address already exists. Please sign in instead."
          );
        }

        // Handle 422 Validation Errors with field mapping
        if (res.status === 422 && data.error?.details) {
          const remoteFieldErrors: FieldErrors = {};
          for (const [key, msgs] of Object.entries(data.error.details)) {
            if (Array.isArray(msgs) && msgs.length > 0) {
              remoteFieldErrors[key as keyof FieldErrors] = msgs[0];
            }
          }
          setFieldErrors((prev) => ({ ...prev, ...remoteFieldErrors }));
        }

        throw new Error(
          data.error?.message || "Registration failed. Please check your inputs and try again."
        );
      }

      // Automatically sign in the newly registered user
      const loginRes = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (loginRes.ok) {
        if (role === "STUDENT") router.push("/student");
        else if (role === "COLLEGE_ADMIN") router.push("/college");
        else if (role === "RECRUITER") router.push("/recruiter");
        else router.push("/");
        router.refresh();
      } else {
        router.push("/login?registered=true");
      }
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Registration encountered an unexpected issue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between">
      {/* Header Bar */}
      <header className="border-b border-[#E4E4E7] bg-white py-4 px-6 flex items-center justify-between">
        <Link
          href="/"
          id="register-brand-link"
          className="flex items-center gap-2.5 group"
          title="Return to Homepage"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-white shadow-subtle group-hover:bg-[#4338CA] transition-smooth">
            <span className="font-bold text-lg tracking-tight">S</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#18181B] group-hover:text-[#4F46E5] transition-smooth">
            StepBridge<span className="text-[#4F46E5]">.in</span>
          </span>
        </Link>

        <div className="text-xs text-[#52525B]">
          Already have an account?{" "}
          <Link
            href="/login"
            id="register-signin-link"
            className="font-semibold text-[#4F46E5] hover:underline"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Registration Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-card">
            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
                Create Your Account
              </h1>
              <p className="text-xs text-[#52525B] mt-1.5">
                Join the verified career-readiness intelligence platform
              </p>
            </div>

            {/* Role Picker Tabs (Student, College TPO, Recruiter) */}
            <div
              className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] mb-6"
              role="tablist"
              aria-label="Account Role Selection"
            >
              <button
                type="button"
                id="role-tab-student"
                role="tab"
                aria-selected={role === "STUDENT"}
                onClick={() => handleRoleChange("STUDENT")}
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
                id="role-tab-college"
                role="tab"
                aria-selected={role === "COLLEGE_ADMIN"}
                onClick={() => handleRoleChange("COLLEGE_ADMIN")}
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
                id="role-tab-recruiter"
                role="tab"
                aria-selected={role === "RECRUITER"}
                onClick={() => handleRoleChange("RECRUITER")}
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

            {/* Google OAuth Advisory / Redirect Notice (Shown only if query params present) */}
            {oauthError === "OAuthConfigurationRequired" && (
              <div
                id="oauth-config-notice"
                className="mb-5 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in"
              >
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <span className="font-semibold">Google OAuth Setup Required:</span>{" "}
                  {oauthMessage ||
                    "OAuth credentials (AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET) are not configured on this server. Please register using your email and password below."}
                </div>
              </div>
            )}

            {oauthError && oauthError !== "OAuthConfigurationRequired" && (
              <div
                id="oauth-error-notice"
                className="mb-5 rounded-lg border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                <div className="flex-1">
                  {oauthMessage || "Google authentication encountered an issue. Please use email & password."}
                </div>
              </div>
            )}

            {/* Sign up with Google Button */}
            <div className="mb-5">
              <a
                id="register-google-btn"
                href={`/api/auth/google?role=${role}&from=register`}
                onClick={() => setGoogleLoading(true)}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#D4D4D8] bg-white py-2.5 px-4 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] hover:border-[#A1A1AA] transition-smooth shadow-2xs cursor-pointer group"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#4F46E5]" />
                ) : (
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
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
                <span>
                  Sign up with Google as{" "}
                  {role === "STUDENT"
                    ? "Student"
                    : role === "COLLEGE_ADMIN"
                    ? "College TPO"
                    : "Recruiter"}
                </span>
              </a>
            </div>

            {/* Separator */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-[#E4E4E7] w-full" />
              <span className="bg-white px-3 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider absolute">
                Or register with email & password
              </span>
            </div>

            {/* Top-Level Server Error Banner */}
            {serverError && (
              <div
                id="register-server-error"
                className="mb-5 rounded-lg border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                <div className="flex-1">
                  {serverError}
                  {isConflict && (
                    <div className="mt-1">
                      <Link
                        href="/login"
                        className="font-bold underline hover:text-rose-950 inline-flex items-center gap-1"
                      >
                        Sign in to your existing account <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-semibold text-[#18181B] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={(e) => handleBlur("name", e.target.value)}
                    placeholder={
                      role === "STUDENT" ? "e.g. Ravi Chauhan" : "e.g. Dr. Ramesh Sharma"
                    }
                    className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none transition-smooth ${
                      touched.name && fieldErrors.name
                        ? "border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                        : "border-[#E4E4E7] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    }`}
                  />
                </div>
                {touched.name && fieldErrors.name && (
                  <p
                    id="error-name"
                    className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1 animate-in fade-in"
                  >
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-semibold text-[#18181B] mb-1.5"
                >
                  {role === "STUDENT"
                    ? "Institutional Student Email"
                    : role === "COLLEGE_ADMIN"
                    ? "College Domain Email (.ac.in / .edu)"
                    : "Work Email"}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={(e) => handleBlur("email", e.target.value)}
                    placeholder={
                      role === "STUDENT"
                        ? "student@jcbust.ac.in"
                        : role === "COLLEGE_ADMIN"
                        ? "tpo@institution.ac.in"
                        : "recruiter@company.io"
                    }
                    className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none transition-smooth ${
                      touched.email && fieldErrors.email
                        ? "border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                        : "border-[#E4E4E7] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    }`}
                  />
                </div>
                {touched.email && fieldErrors.email && (
                  <p
                    id="error-email"
                    className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1 animate-in fade-in"
                  >
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Tenant Fields for College & Recruiter */}
              {role !== "STUDENT" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label
                      htmlFor="register-tenant"
                      className="block text-xs font-semibold text-[#18181B] mb-1.5"
                    >
                      {role === "COLLEGE_ADMIN" ? "Institution Name" : "Company Name"}
                    </label>
                    <div className="relative">
                      <Building className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                      <input
                        id="register-tenant"
                        name="tenantName"
                        type="text"
                        value={tenantName}
                        onChange={(e) => handleChange("tenantName", e.target.value)}
                        onBlur={(e) => handleBlur("tenantName", e.target.value)}
                        placeholder={
                          role === "COLLEGE_ADMIN" ? "e.g. JCBUST, YMCA" : "e.g. TechCorp Solutions"
                        }
                        className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none transition-smooth ${
                          touched.tenantName && fieldErrors.tenantName
                            ? "border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                            : "border-[#E4E4E7] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                        }`}
                      />
                    </div>
                    {touched.tenantName && fieldErrors.tenantName && (
                      <p
                        id="error-tenant"
                        className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1 animate-in fade-in"
                      >
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{fieldErrors.tenantName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="register-city"
                      className="block text-xs font-semibold text-[#18181B] mb-1.5"
                    >
                      Location / City
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                      <input
                        id="register-city"
                        name="city"
                        type="text"
                        value={city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        onBlur={(e) => handleBlur("city", e.target.value)}
                        placeholder="e.g. Bengaluru"
                        className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none transition-smooth ${
                          touched.city && fieldErrors.city
                            ? "border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                            : "border-[#E4E4E7] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                        }`}
                      />
                    </div>
                    {touched.city && fieldErrors.city && (
                      <p
                        id="error-city"
                        className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1 animate-in fade-in"
                      >
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{fieldErrors.city}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold text-[#18181B] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={(e) => handleBlur("password", e.target.value)}
                    placeholder="Create a strong password"
                    className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none transition-smooth ${
                      touched.password && fieldErrors.password
                        ? "border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                        : "border-[#E4E4E7] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    }`}
                  />
                </div>
                {touched.password && fieldErrors.password && (
                  <p
                    id="error-password"
                    className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1 animate-in fade-in"
                  >
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}

                {/* Password Requirements Guidance */}
                <div
                  id="password-requirements"
                  className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]"
                >
                  <span
                    id="req-min-length"
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasMinLength ? "text-emerald-700 font-medium" : "text-[#71717A]"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3 w-3 transition-colors ${
                        hasMinLength ? "text-emerald-600" : "text-[#D4D4D8]"
                      }`}
                    />
                    8+ characters
                  </span>
                  <span
                    id="req-uppercase"
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasUppercase ? "text-emerald-700 font-medium" : "text-[#71717A]"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3 w-3 transition-colors ${
                        hasUppercase ? "text-emerald-600" : "text-[#D4D4D8]"
                      }`}
                    />
                    Uppercase letter
                  </span>
                  <span
                    id="req-lowercase"
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasLowercase ? "text-emerald-700 font-medium" : "text-[#71717A]"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3 w-3 transition-colors ${
                        hasLowercase ? "text-emerald-600" : "text-[#D4D4D8]"
                      }`}
                    />
                    Lowercase letter
                  </span>
                  <span
                    id="req-number"
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasNumber ? "text-emerald-700 font-medium" : "text-[#71717A]"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3 w-3 transition-colors ${
                        hasNumber ? "text-emerald-600" : "text-[#D4D4D8]"
                      }`}
                    />
                    At least one number
                  </span>
                </div>
              </div>

              {/* Complete Registration Submit Button */}
              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#4F46E5] py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth shadow-subtle flex items-center justify-center gap-2 mt-4 cursor-pointer"
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

      {/* Footer with Creator Credit */}
      <footer className="border-t border-[#E4E4E7] bg-white py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#71717A]">
        <div>© 2026 StepBridge.in • Career-Readiness Intelligence SaaS</div>
        <CreatorCredit />
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-[#71717A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#4F46E5] mr-2" />
          <span>Loading registration...</span>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
