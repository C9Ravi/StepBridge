"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import DashboardFooter from "@/components/shared/DashboardFooter";
import {
  Compass,
  Search,
  Filter,
  CheckCircle2,
  Star,
  Layers,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Code2,
  Briefcase,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  BarChart3,
  Award,
  Terminal,
  ExternalLink,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface DomainCard {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  overview: string;
  skillsCount: number;
  projectsCount: number;
  topSkills: string[];
  careerOpportunities: string[];
  isEnrolled?: boolean;
  isPrimary?: boolean;
  readinessScore?: number;
}

interface DomainDetail {
  slug: string;
  title: string;
  category: string;
  description: string;
  overview: string;
  careerOpportunities: string[];
  coreCsSubjects: string[];
  keyConcepts: string[];
  recommendedTools: string[];
  portfolioExpectations: string;
  interviewTopics: string[];
  entryLevelGuidance: string;
  milestoneOutcomes: string[];
  skills: Array<{ skillName: string; category: string; requiredLevel: number; importanceWeight: number }>;
  projects: Array<{ title: string; difficulty: string; description: string; technologies: string[]; deliverables: string[] }>;
}

export interface ComparisonDomain {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  coreCsSubjects: string[];
  requiredSkills: Array<{ name: string; level: number; importance: number }>;
  careerOpportunities: string[];
  sampleProjects: Array<{ title: string; difficulty: string }>;
  readinessScore?: number;
}

export interface ComparisonData {
  domains: ComparisonDomain[];
  commonSkills: string[];
  uniqueSkillsByDomain: Record<string, string[]>;
}

export interface ReadinessResultData {
  overallScore: number;
  confidence: string;
  skillsCompleted: number;
  skillsRemaining: number;
  roadmapCompletionPercentage: number;
  assessmentScore: number;
  projectCount: number;
  interviewReadiness: number;
  skillGaps: Array<{
    skillName: string;
    category: string;
    requiredLevel: number;
    currentLevel: number;
    source: string;
    gap: number;
    action: string;
  }>;
}

export default function CareerDomainsDiscoveryPage() {
  const [domains, setDomains] = useState<DomainCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  // Detail Modal State
  const [selectedDetailSlug, setSelectedDetailSlug] = useState<string | null>(null);
  const [domainDetail, setDomainDetail] = useState<DomainDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailReadiness, setDetailReadiness] = useState<ReadinessResultData | null>(null);

  // Target Update Notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const categories = ["All", "Engineering", "Data & AI", "Cloud & Infrastructure", "Security & QA"];

  const fetchDomains = async () => {
    try {
      const url = selectedCategory === "All"
        ? "/api/v1/roles"
        : `/api/v1/roles?category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.data?.roles) {
        setDomains(data.data.roles);
      }
    } catch (err) {
      console.error("Failed to load domains:", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    const url = selectedCategory === "All"
      ? "/api/v1/roles"
      : `/api/v1/roles?category=${encodeURIComponent(selectedCategory)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data?.data?.roles) {
          setDomains(data.data.roles);
        }
      })
      .catch((err) => {
        console.error("Failed to load domains:", err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedCategory]);

  const filteredDomains = domains.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.topSkills.some((s) => s.toLowerCase().includes(q))
    );
  });

  const toggleCompare = (slug: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, slug];
    });
  };

  const handleOpenComparison = async () => {
    if (selectedForCompare.length < 2) return;
    try {
      setCompareLoading(true);
      setShowCompareModal(true);
      const res = await fetch(`/api/v1/roles/compare?slugs=${selectedForCompare.join(",")}`);
      const data = await res.json();
      if (res.ok) {
        setComparisonData(data.data);
      }
    } catch (err) {
      console.error("Failed to load comparison:", err);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleOpenDetail = async (slug: string) => {
    try {
      setSelectedDetailSlug(slug);
      setDetailLoading(true);
      const res = await fetch(`/api/v1/roles/${slug}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setDomainDetail(data.data.domain);
        setDetailReadiness(data.data.studentReadiness);
      }
    } catch (err) {
      console.error("Failed to load domain details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSetTarget = async (roleId: string, isPrimary: boolean, roleTitle: string) => {
    try {
      const res = await fetch("/api/v1/students/me/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, isPrimary }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(
          isPrimary
            ? `✓ Set ${roleTitle} as your primary career target!`
            : `✓ Added ${roleTitle} to your secondary interests!`
        );
        setTimeout(() => setStatusMessage(null), 4000);
        fetchDomains();
        if (selectedDetailSlug) handleOpenDetail(selectedDetailSlug);
      }
    } catch (err) {
      console.error("Error setting career target:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Navbar currentRole="STUDENT" onRoleSwitch={(r) => {
        if (r === "COLLEGE_ADMIN") window.location.href = "/college";
        if (r === "RECRUITER") window.location.href = "/recruiter";
        if (r === "SUPER_ADMIN") window.location.href = "/admin";
      }} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner */}
        <div className="mb-8 rounded-2xl border border-[#E4E4E7] bg-white p-6 sm:p-8 shadow-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-900 mb-3">
                <Compass className="h-3.5 w-3.5 text-[#4F46E5]" />
                <span>Multi-Domain Career Ecosystem</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Explore Technology Career Tracks
              </h1>
              <p className="text-xs sm:text-sm text-[#52525B] mt-2 leading-relaxed">
                Discover structured learning journeys, core CS foundations, hands-on portfolio projects, and technical interview preparation across 12 high-demand engineering domains. Select your primary target and explore secondary interests without losing existing progress.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/student"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E4E4E7] bg-white px-4 py-2.5 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
              >
                <TrendingUp className="h-4 w-4 text-[#4F46E5]" />
                <span>My Readiness Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
                  selectedCategory === cat
                    ? "bg-white text-[#4F46E5] shadow-subtle border border-[#E4E4E7]"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domain, skill or track..."
              className="w-full rounded-xl border border-[#E4E4E7] bg-white pl-9 pr-3.5 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
            />
          </div>
        </div>

        {/* Domains Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-xs text-[#71717A]">
            <Loader2 className="h-6 w-6 animate-spin text-[#4F46E5] mb-2" />
            <span>Loading career domains...</span>
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E4E4E7] bg-white p-12 text-center text-xs text-[#71717A]">
            No career domains match your search query. Try resetting filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDomains.map((domain) => {
              const isSelectedForCompare = selectedForCompare.includes(domain.slug);
              return (
                <div
                  key={domain.id}
                  className={`rounded-2xl border bg-white p-6 transition-smooth flex flex-col justify-between ${
                    domain.isPrimary
                      ? "border-indigo-400 ring-2 ring-indigo-50 shadow-card"
                      : domain.isEnrolled
                      ? "border-teal-300 bg-teal-50/10 shadow-subtle"
                      : "border-[#E4E4E7] hover:border-[#4F46E5]/60 hover:shadow-card"
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-full bg-[#F4F4F5] border border-[#E4E4E7] px-2.5 py-0.5 text-[11px] font-semibold text-[#52525B]">
                        {domain.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {domain.isPrimary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-900">
                            <Star className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                            <span>Primary Target</span>
                          </span>
                        )}
                        {!domain.isPrimary && domain.isEnrolled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                            <Check className="h-3 w-3 text-teal-600" />
                            <span>Secondary Interest</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#18181B] tracking-tight">
                      {domain.title}
                    </h3>
                    <p className="text-xs text-[#52525B] mt-2 line-clamp-3 leading-relaxed">
                      {domain.description}
                    </p>

                    {/* Readiness Gauge if Enrolled */}
                    {domain.readinessScore !== undefined && (
                      <div className="mt-4 rounded-xl border border-indigo-100 bg-[#EEF2FF]/60 p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">
                            Track Readiness
                          </span>
                          <div className="text-sm font-bold text-[#18181B]">
                            {domain.readinessScore}/100
                          </div>
                        </div>
                        <div className="w-16 bg-white rounded-full h-2 border border-indigo-100 overflow-hidden">
                          <div
                            className="bg-[#4F46E5] h-full rounded-full transition-all duration-500"
                            style={{ width: `${domain.readinessScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Core Skills Pills */}
                    <div className="mt-4 pt-3 border-t border-[#E4E4E7]/60">
                      <span className="text-[11px] font-bold text-[#18181B] uppercase tracking-wider">
                        Core Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {domain.topSkills.map((sk) => (
                          <span
                            key={sk}
                            className="rounded bg-[#FAFAF9] border border-[#E4E4E7] px-2 py-0.5 text-[11px] font-medium text-[#3F3F46]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-[#E4E4E7] flex flex-col gap-2">
                    <button
                      onClick={() => handleOpenDetail(domain.slug)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white py-2 text-xs font-semibold text-[#18181B] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-smooth"
                    >
                      <span>View Complete Roadmap & Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {!domain.isPrimary && (
                        <button
                          onClick={() => handleSetTarget(domain.id, true, domain.title)}
                          className="flex-1 rounded-lg bg-[#4F46E5] py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth text-center"
                        >
                          Set Primary Target
                        </button>
                      )}

                      {!domain.isEnrolled && (
                        <button
                          onClick={() => handleSetTarget(domain.id, false, domain.title)}
                          className="flex-1 rounded-lg border border-teal-300 bg-teal-50 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-smooth text-center"
                        >
                          Add Interest
                        </button>
                      )}

                      <button
                        onClick={() => toggleCompare(domain.slug)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-smooth ${
                          isSelectedForCompare
                            ? "bg-[#18181B] text-white border-[#18181B]"
                            : "bg-[#FAFAF9] text-[#52525B] border-[#E4E4E7] hover:bg-white"
                        }`}
                        title="Select for comparison"
                      >
                        {isSelectedForCompare ? "✓ Compared" : "+ Compare"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Comparison Action Bar */}
        {selectedForCompare.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-2xl border border-[#18181B] bg-[#18181B] px-5 py-3 text-white shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-xs">
              <span className="font-bold text-[#4F46E5] bg-white px-2 py-0.5 rounded-full mr-2">
                {selectedForCompare.length} Selected
              </span>
              <span>Comparing career domains side-by-side</span>
            </div>

            <button
              onClick={handleOpenComparison}
              disabled={selectedForCompare.length < 2}
              className="rounded-lg bg-[#4F46E5] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth"
            >
              Compare Now ({selectedForCompare.length}/3)
            </button>

            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-[#A1A1AA] hover:text-white"
            >
              Clear
            </button>
          </div>
        )}

        {/* COMPARISON MODAL */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="my-8 w-full max-w-5xl rounded-2xl border border-[#E4E4E7] bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
                    Side-by-Side Comparison
                  </span>
                  <h2 className="text-xl font-bold text-[#18181B] mt-0.5">
                    Compare Career Domains
                  </h2>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {compareLoading || !comparisonData ? (
                <div className="py-20 text-center text-xs text-[#71717A]">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#4F46E5] mb-2" />
                  Generating side-by-side comparison...
                </div>
              ) : (
                <div className="my-6 space-y-6">
                  {/* Domains Table Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {comparisonData.domains.map((d: ComparisonDomain) => (
                      <div key={d.slug} className="rounded-xl border border-[#E4E4E7] p-4 bg-[#FAFAF9]">
                        <span className="rounded bg-white border border-[#E4E4E7] px-2 py-0.5 text-[10px] font-semibold text-[#52525B]">
                          {d.category}
                        </span>
                        <h3 className="text-base font-bold text-[#18181B] mt-1.5">{d.title}</h3>
                        <p className="text-xs text-[#52525B] mt-1 line-clamp-2">{d.description}</p>
                        {d.readinessScore !== undefined && (
                          <div className="mt-3 text-xs font-bold text-[#4F46E5]">
                            Current Readiness: {d.readinessScore}/100
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Core CS Comparison */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-2">
                      Core Computer Science Foundations
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {comparisonData.domains.map((d: ComparisonDomain) => (
                        <div key={d.slug} className="rounded-lg border border-[#E4E4E7] p-3 text-xs bg-white space-y-1">
                          {d.coreCsSubjects.map((sub: string) => (
                            <div key={sub} className="flex items-center gap-1.5 text-[#3F3F46]">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                              <span>{sub}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample Projects Comparison */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-2">
                      Practical Portfolio Projects
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {comparisonData.domains.map((d: ComparisonDomain) => (
                        <div key={d.slug} className="rounded-lg border border-[#E4E4E7] p-3 text-xs bg-white space-y-2">
                          {d.sampleProjects.map((p, idx: number) => (
                            <div key={idx} className="border-b border-[#E4E4E7]/60 pb-1.5 last:border-0 last:pb-0">
                              <span className="text-[10px] font-bold text-[#4F46E5] uppercase">{p.difficulty}</span>
                              <div className="font-semibold text-[#18181B] text-[11px] mt-0.5">{p.title}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shared vs Unique Skills */}
                  <div className="rounded-xl border border-indigo-100 bg-[#EEF2FF]/60 p-4">
                    <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
                      Overlap & Synergy Analysis
                    </span>
                    <div className="mt-2 text-xs text-[#18181B]">
                      <strong>Shared Core Skills: </strong>
                      {comparisonData.commonSkills.length > 0
                        ? comparisonData.commonSkills.join(", ")
                        : "These domains require distinct, specialized technical foundations."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOMAIN DETAIL & ROADMAP DRAWER / MODAL */}
        {selectedDetailSlug && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="my-8 w-full max-w-4xl rounded-2xl border border-[#E4E4E7] bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              {detailLoading || !domainDetail ? (
                <div className="py-20 text-center text-xs text-[#71717A]">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#4F46E5] mb-2" />
                  Loading domain blueprint & roadmap...
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between pb-6 border-b border-[#E4E4E7]">
                    <div>
                      <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-900">
                        {domainDetail.category} Track
                      </span>
                      <h2 className="text-2xl font-bold text-[#18181B] mt-2">
                        {domainDetail.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#52525B] mt-1.5 leading-relaxed max-w-2xl">
                        {domainDetail.overview}
                      </p>
                    </div>

                    <button
                      onClick={() => { setSelectedDetailSlug(null); setDomainDetail(null); }}
                      className="rounded-lg p-2 text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Real Calculated Student Metrics if available */}
                  {detailReadiness && (
                    <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-indigo-100 bg-[#EEF2FF]/60 text-xs">
                      <div>
                        <div className="text-[10px] text-[#52525B] uppercase font-bold">Overall Readiness</div>
                        <div className="text-lg font-bold text-[#4F46E5] mt-0.5">{detailReadiness.overallScore}/100</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#52525B] uppercase font-bold">Skills Completed</div>
                        <div className="text-lg font-bold text-[#18181B] mt-0.5">{detailReadiness.skillsCompleted} of {detailReadiness.skillsCompleted + detailReadiness.skillsRemaining}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#52525B] uppercase font-bold">Assessment Score</div>
                        <div className="text-lg font-bold text-[#18181B] mt-0.5">{detailReadiness.assessmentScore}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#52525B] uppercase font-bold">Interview Readiness</div>
                        <div className="text-lg font-bold text-emerald-800 mt-0.5">{detailReadiness.interviewReadiness}/100</div>
                      </div>
                    </div>
                  )}

                  {/* Core CS Foundations */}
                  <div className="my-6">
                    <h3 className="text-sm font-bold text-[#18181B] uppercase tracking-wider mb-2">
                      Core Computer Science Foundations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {domainDetail.coreCsSubjects.map((sub, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E4E4E7] bg-[#FAFAF9]">
                          <BookOpen className="h-4 w-4 text-[#4F46E5] flex-shrink-0" />
                          <span className="font-medium text-[#18181B]">{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Skills & Proficiency */}
                  <div className="my-6">
                    <h3 className="text-sm font-bold text-[#18181B] uppercase tracking-wider mb-2">
                      Required Technical Proficiencies
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {domainDetail.skills.map((sk, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-[#E4E4E7] bg-white">
                          <span className="font-semibold text-[#18181B]">{sk.skillName}</span>
                          <span className="rounded bg-[#F4F4F5] px-2 py-0.5 font-mono text-[11px] text-[#52525B]">
                            Level {sk.requiredLevel}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Portfolio Projects (Ordered by Difficulty) */}
                  <div className="my-6">
                    <h3 className="text-sm font-bold text-[#18181B] uppercase tracking-wider mb-2">
                      Structured Project Journey (Ordered by Difficulty)
                    </h3>
                    <div className="space-y-3">
                      {domainDetail.projects.map((proj, idx) => (
                        <div key={idx} className="rounded-xl border border-[#E4E4E7] p-4 bg-[#FAFAF9] text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-[#18181B]">{proj.title}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              proj.difficulty === "BEGINNER" ? "bg-emerald-100 text-emerald-800" :
                              proj.difficulty === "INTERMEDIATE" ? "bg-amber-100 text-amber-800" :
                              "bg-purple-100 text-purple-800"
                            }`}>
                              {proj.difficulty}
                            </span>
                          </div>
                          <p className="text-[#52525B] mt-1.5 leading-relaxed">{proj.description}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {proj.technologies.map((t, ti) => (
                              <span key={ti} className="rounded bg-white border border-[#E4E4E7] px-2 py-0.5 text-[10px] font-mono text-[#3F3F46]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interview Preparation Topics */}
                  <div className="my-6">
                    <h3 className="text-sm font-bold text-[#18181B] uppercase tracking-wider mb-2">
                      Technical Interview Topics
                    </h3>
                    <div className="space-y-1.5 text-xs text-[#3F3F46]">
                      {domainDetail.interviewTopics.map((top, ti) => (
                        <div key={ti} className="flex items-start gap-2 p-2 rounded-lg bg-[#FAFAF9]">
                          <Terminal className="h-4 w-4 text-[#4F46E5] mt-0.5 flex-shrink-0" />
                          <span>{top}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Portfolio & GitHub Expectations */}
                  <div className="my-6 rounded-xl border border-[#E4E4E7] bg-white p-4 text-xs">
                    <h4 className="font-bold text-[#18181B] uppercase tracking-wider mb-1">
                      Portfolio & GitHub Expectations
                    </h4>
                    <p className="text-[#52525B] leading-relaxed">{domainDetail.portfolioExpectations}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
}
