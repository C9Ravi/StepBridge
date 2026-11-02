"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Target,
  Award,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Compass,
} from "lucide-react";

import CreatorCredit from "@/components/shared/CreatorCredit";

export default function LandingPage() {
  const [selectedPersona, setSelectedPersona] = useState<"student" | "college" | "recruiter">("student");

  const roles = [
    {
      title: "Frontend Engineer",
      skills: ["React", "TypeScript", "Tailwind CSS", "REST API Design"],
      description: "Build modern, responsive, and accessible UI architectures with Next.js and React 19.",
    },
    {
      title: "Backend Engineer",
      skills: ["Node.js", "SQL & Databases", "System Design", "REST APIs", "Docker"],
      description: "Architect high-performance APIs, database schemas, and microservice workflows.",
    },
    {
      title: "Full Stack Engineer",
      skills: ["React", "TypeScript", "Node.js", "SQL & Databases", "System Design"],
      description: "Deliver end-to-end applications with verified full-stack evidence and scalable infrastructure.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col selection:bg-[#EEF2FF] selection:text-[#4F46E5]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E4E4E7] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-white shadow-subtle">
              <span className="font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#18181B]">
              StepBridge<span className="text-[#4F46E5]">.ai</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#52525B]">
            <a href="#students" className="hover:text-[#4F46E5] transition-smooth">For Students</a>
            <a href="#colleges" className="hover:text-[#4F46E5] transition-smooth">For Colleges</a>
            <a href="#recruiters" className="hover:text-[#4F46E5] transition-smooth">For Recruiters</a>
            <a href="#roles" className="hover:text-[#4F46E5] transition-smooth">Role Catalog</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/student"
              className="rounded-lg border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
            >
              Log In
            </Link>
            <Link
              href="/student"
              className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
            >
              Launch Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-[#E4E4E7] bg-gradient-to-b from-white to-[#FAFAF9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-[#EEF2FF] px-3.5 py-1 text-xs font-semibold text-[#4F46E5] shadow-xs mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Career-Readiness Intelligence for Indian Engineering Campuses</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#18181B] max-w-4xl mx-auto leading-[1.12]">
            Turn placement preparation from guesswork into a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-teal-600">
              measurable journey.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#52525B] max-w-2xl mx-auto leading-relaxed">
            StepBridge.ai connects engineering students, campus placement cells, and recruiters into one auditable readiness loop. Evidence over claims, explainable eligibility, and actionable roadmaps.
          </p>

          {/* Persona Interactive Switcher Box */}
          <div className="mt-10 max-w-xl mx-auto rounded-2xl border border-[#E4E4E7] bg-white p-2 shadow-card">
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setSelectedPersona("student")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-smooth ${
                  selectedPersona === "student"
                    ? "bg-[#4F46E5] text-white shadow-subtle"
                    : "text-[#52525B] hover:bg-[#F4F4F5]"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Student</span>
              </button>
              <button
                onClick={() => setSelectedPersona("college")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-smooth ${
                  selectedPersona === "college"
                    ? "bg-[#4F46E5] text-white shadow-subtle"
                    : "text-[#52525B] hover:bg-[#F4F4F5]"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>College TPO</span>
              </button>
              <button
                onClick={() => setSelectedPersona("recruiter")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-smooth ${
                  selectedPersona === "recruiter"
                    ? "bg-[#4F46E5] text-white shadow-subtle"
                    : "text-[#52525B] hover:bg-[#F4F4F5]"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Recruiter</span>
              </button>
            </div>

            <div className="p-4 text-left">
              {selectedPersona === "student" && (
                <div>
                  <h4 className="text-sm font-bold text-[#18181B]">Student Pathway</h4>
                  <p className="text-xs text-[#52525B] mt-1">
                    Select a target role, assess your real skill gaps, generate an 8-week actionable roadmap, and apply to eligible drives with verified evidence.
                  </p>
                  <Link
                    href="/student"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#4F46E5] hover:underline"
                  >
                    <span>Enter Student Portal</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {selectedPersona === "college" && (
                <div>
                  <h4 className="text-sm font-bold text-[#18181B]">College & Placement Cell</h4>
                  <p className="text-xs text-[#52525B] mt-1">
                    Track cohort readiness distributions, identify skill gaps before placement season, and publish drives with real-time student count previews.
                  </p>
                  <Link
                    href="/college"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#4F46E5] hover:underline"
                  >
                    <span>Enter Placement Operations</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {selectedPersona === "recruiter" && (
                <div>
                  <h4 className="text-sm font-bold text-[#18181B]">Company Recruiter</h4>
                  <p className="text-xs text-[#52525B] mt-1">
                    Post roles with explicit requirements, review applicants with explainable skill overlap, and manage candidates with private notes.
                  </p>
                  <Link
                    href="/recruiter"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#4F46E5] hover:underline"
                  >
                    <span>Enter Recruiter Hub</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Role Catalog Preview */}
      <section id="roles" className="py-16 border-b border-[#E4E4E7] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">Role Taxonomy</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] mt-1">
              Curated Role Benchmarks & Skill Expectations
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] mt-2">
              Every role has explicit skill levels and weights. No guessing what industry hires for.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-[#E4E4E7] p-6 bg-[#FAFAF9] hover:border-[#4F46E5] hover:bg-white hover:shadow-card transition-smooth"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-[#4F46E5] uppercase tracking-wider">
                  <Compass className="h-4 w-4" />
                  <span>Curated Track</span>
                </div>
                <h3 className="text-lg font-bold text-[#18181B] mt-2">{r.title}</h3>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed">{r.description}</p>

                <div className="mt-4 pt-4 border-t border-[#E4E4E7]/60">
                  <span className="text-[11px] font-bold text-[#18181B] uppercase tracking-wider">Core Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.skills.map((sk) => (
                      <span key={sk} className="rounded bg-white border border-[#E4E4E7] px-2 py-0.5 text-[11px] font-medium text-[#18181B]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/student"
                  className="mt-6 flex items-center justify-between text-xs font-bold text-[#4F46E5] hover:underline"
                >
                  <span>Select as Target Role</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E7] bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© 2026 StepBridge.ai. Career-Readiness Intelligence SaaS.</span>
            <span className="hidden sm:inline text-[#E4E4E7]">•</span>
            <CreatorCredit />
          </div>
          <div className="flex items-center gap-6">
            <Link href="/student" className="hover:text-[#18181B] transition-colors">Student Portal</Link>
            <Link href="/college" className="hover:text-[#18181B] transition-colors">College Operations</Link>
            <Link href="/recruiter" className="hover:text-[#18181B] transition-colors">Recruiter Hub</Link>
            <Link href="/admin" className="hover:text-[#18181B] transition-colors">Super Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
