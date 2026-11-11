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
import IntroAnimation from "@/components/shared/IntroAnimation";

export default function LandingPage() {
  const [selectedPersona, setSelectedPersona] = useState<"student" | "college" | "recruiter">("student");
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>("All");

  const catalogCategories = ["All", "Engineering", "Data & AI", "Cloud & Infrastructure", "Security & QA"];

  const allRoles = [
    {
      slug: "fde",
      title: "Forward Deployed Engineer (FDE)",
      category: "Engineering",
      skills: ["REST API Design", "System Design", "Python", "Docker & Containers"],
      description: "Bridges software engineering and enterprise deployment, building custom integrations, reliable data pipelines, and real-time customer systems on the frontlines.",
    },
    {
      slug: "ai-ml",
      title: "AI / Machine Learning Engineer",
      category: "Data & AI",
      skills: ["Python", "Machine Learning & AI", "Deep Learning & PyTorch", "Vector DBs & RAG"],
      description: "Designs, trains, fine-tunes, and operationalizes machine learning, deep learning, and generative AI models at production scale.",
    },
    {
      slug: "backend",
      title: "Backend Engineer",
      category: "Engineering",
      skills: ["Node.js & Express", "SQL & Database Design", "System Design", "Redis & Caching"],
      description: "Architects high-throughput server backends, transactional databases, and resilient microservices with sub-50ms latency SLAs.",
    },
    {
      slug: "frontend",
      title: "Frontend Engineer",
      category: "Engineering",
      skills: ["React", "TypeScript", "Tailwind CSS", "Web Performance & Core Web Vitals"],
      description: "Builds modern, responsive, high-performance web applications using React 19, Next.js, and accessible design system architectures.",
    },
    {
      slug: "full-stack",
      title: "Full Stack Engineer",
      category: "Engineering",
      skills: ["React", "TypeScript", "Node.js & Express", "SQL & Database Design", "System Design"],
      description: "Delivers end-to-end full-stack products from interactive user interfaces to scalable relational backends and cloud infrastructure.",
    },
    {
      slug: "devops-sre",
      title: "DevOps / Site Reliability Engineer",
      category: "Cloud & Infrastructure",
      skills: ["Docker & Containers", "Kubernetes Orchestration", "CI/CD Pipelines", "Terraform & IaC"],
      description: "Champions infrastructure reliability, automated deployments, multi-region observability, and zero-downtime release engineering.",
    },
    {
      slug: "cloud",
      title: "Cloud Engineer",
      category: "Cloud & Infrastructure",
      skills: ["AWS & Cloud Architecture", "Docker & Containers", "Terraform & IaC", "Cloud Networking & VPC"],
      description: "Architects resilient, cost-optimized, and secure multi-cloud environments across compute, managed storage, and VPC networks.",
    },
    {
      slug: "cybersecurity",
      title: "Cybersecurity Engineer",
      category: "Security & QA",
      skills: ["Applied Cryptography", "Threat Modeling & OWASP", "mTLS & Zero-Trust", "Burp Suite & Pentesting"],
      description: "Protects applications, networks, and cloud infrastructure by identifying vulnerabilities, conducting ethical penetration testing, and enforcing defense-in-depth.",
    },
    {
      slug: "data-engineer",
      title: "Data Engineer",
      category: "Data & AI",
      skills: ["SQL & Database Design", "Python", "Data Warehousing & Dimensional Modeling", "Apache Spark & ETL"],
      description: "Designs robust, low-latency data pipelines, ingestion architectures, and warehouse schemas that transform raw data into analytics-ready assets.",
    },
    {
      slug: "data-science-analytics",
      title: "Data Scientist / Data Analyst",
      category: "Data & AI",
      skills: ["Python", "SQL & Database Design", "Machine Learning & AI", "Data Visualization & BI"],
      description: "Extracts actionable predictive insights, builds statistical and ML models, conducts hypothesis testing, and communicates complex trends to stakeholders.",
    },
    {
      slug: "mobile-engineer",
      title: "Mobile Application Engineer",
      category: "Engineering",
      skills: ["React Native / Flutter", "TypeScript", "Offline-First Sync", "Mobile Security & Biometrics"],
      description: "Builds responsive, buttery-smooth native and cross-platform mobile experiences with offline-first synchronization and hardware integrations.",
    },
    {
      slug: "sdet-qa",
      title: "QA Automation / SDET",
      category: "Security & QA",
      skills: ["Playwright & E2E Testing", "TypeScript", "CI/CD Test Automation", "Performance & Load Testing"],
      description: "Architects scalable automated test suites, prevents software regressions, builds performance test harnesses, and ensures release quality.",
    },
  ];

  const filteredRoles =
    selectedCatalogCategory === "All"
      ? allRoles
      : allRoles.filter((r) => r.category === selectedCatalogCategory);

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col selection:bg-[#EEF2FF] selection:text-[#4F46E5]">
      {/* 2-Second Branded Intro Animation (runs only on initial site visit) */}
      <IntroAnimation />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E4E4E7] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group" title="StepBridge.in Homepage">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-white shadow-subtle group-hover:bg-[#4338CA] transition-smooth">
              <span className="font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#18181B] group-hover:text-[#4F46E5] transition-smooth">
              StepBridge<span className="text-[#4F46E5]">.in</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#52525B]">
            <a href="#students" className="hover:text-[#4F46E5] transition-smooth">For Students</a>
            <a href="#colleges" className="hover:text-[#4F46E5] transition-smooth">For Colleges</a>
            <a href="#recruiters" className="hover:text-[#4F46E5] transition-smooth">For Recruiters</a>
            <a href="#roles" className="hover:text-[#4F46E5] transition-smooth">Role Catalog</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] hover:border-[#4F46E5] transition-smooth"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
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
            StepBridge.in connects engineering students, campus placement cells, and recruiters into one auditable readiness loop. Evidence over claims, explainable eligibility, and actionable roadmaps.
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
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-[#EEF2FF] px-3.5 py-1 text-xs font-semibold text-[#4F46E5] mb-3 shadow-xs">
              <Compass className="h-3.5 w-3.5" />
              <span>12-Domain Technology Career Ecosystem</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
              Curated Role Benchmarks & Skill Expectations
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] mt-2 leading-relaxed">
              Every role includes canonical skill levels, industry-calibrated projects, and verifiable assessment rubrics. Explore all 12 specialized technology career tracks below.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {catalogCategories.map((cat) => {
                const count = cat === "All" ? allRoles.length : allRoles.filter((r) => r.category === cat).length;
                const isActive = selectedCatalogCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCatalogCategory(cat)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#4F46E5] text-white shadow-subtle"
                        : "bg-[#F4F4F5] text-[#52525B] hover:bg-[#E4E4E7] hover:text-[#18181B]"
                    }`}
                  >
                    <span>{cat === "All" ? "All Tracks" : cat}</span>
                    <span
                      className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-white text-[#71717A] border border-[#E4E4E7]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((r) => {
              const categoryColor =
                r.category === "Engineering"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : r.category === "Data & AI"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : r.category === "Cloud & Infrastructure"
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200";

              return (
                <div
                  key={r.slug}
                  className="group flex flex-col justify-between rounded-2xl border border-[#E4E4E7] p-6 bg-[#FAFAF9] hover:border-[#4F46E5] hover:bg-white hover:shadow-card transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryColor}`}>
                        {r.category}
                      </span>
                      <span className="text-[11px] font-mono text-[#A1A1AA]">{r.slug}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#18181B] group-hover:text-[#4F46E5] transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-xs text-[#52525B] mt-2 line-clamp-3 leading-relaxed">
                      {r.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#E4E4E7]/60">
                      <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider block mb-2">
                        Benchmark Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {r.skills.map((sk) => (
                          <span
                            key={sk}
                            className="rounded-md bg-white border border-[#E4E4E7] px-2 py-0.5 text-[11px] font-medium text-[#18181B] shadow-2xs"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E4E4E7]/40 flex items-center justify-between">
                    <Link
                      href={`/student/domains?domain=${r.slug}`}
                      className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1 group/link"
                    >
                      <span>Explore Blueprint</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href={`/student?target=${r.slug}`}
                      className="text-[11px] font-medium text-[#71717A] hover:text-[#18181B] inline-flex items-center gap-1"
                    >
                      <span>Select Track</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Multi-Domain Exploration Banner */}
          <div className="mt-12 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Multi-Domain Discovery Hub</span>
              </div>
              <h3 className="text-lg font-bold text-[#18181B]">
                Looking to compare career tracks or explore project rubrics?
              </h3>
              <p className="text-xs sm:text-sm text-[#52525B] max-w-2xl leading-relaxed">
                Use our side-by-side comparison engine to analyze overlapping CS concepts, portfolio project benchmarks, and tailored 8-week milestones across all 12 technology domains.
              </p>
            </div>
            <Link
              href="/student/domains"
              className="whitespace-nowrap inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-[#4338CA] transition-all"
            >
              <span>Explore All 12 Tracks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E7] bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© 2026 StepBridge.in. Career-Readiness Intelligence SaaS.</span>
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
