"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import DashboardFooter from "@/components/shared/DashboardFooter";
import {
  Briefcase,
  Users,
  Building,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  FileText,
  UserCheck,
  XCircle,
  MessageSquare,
  Sparkles,
  Calendar,
  Search,
  ExternalLink,
  Award,
  Video,
  X,
  Send,
  Star,
  CheckCircle2,
  TrendingUp,
  Layers,
} from "lucide-react";

export interface RecruiterJob {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  salaryRange?: string | null;
  status: string;
  deadline?: string | null;
  createdAt: string;
  skills: Array<{ skill: { canonicalName: string }; importance: string; requiredLevel: number }>;
  _count: { applications: number };
}

export interface RecruiterApplicant {
  applicationId: string;
  stage: string;
  appliedAt: string;
  candidate: {
    name: string;
    email: string;
    institution: string;
    batch: string;
    headline?: string;
    cgpa?: number;
  };
  resume?: { id: string; fileName: string; fileType: string } | null;
  profileSnapshot: Record<string, unknown>;
  match: {
    matchedCount: number;
    requiredCount: number;
    matchPercentage: number;
    summary: string;
  };
  notes: Array<{ author: string; note: string; createdAt: string }>;
  interviews?: Array<{
    id: string;
    roundTitle: string;
    scheduledAt: string;
    status: string;
    rating?: number | null;
    feedback?: string | null;
    recommendation?: string | null;
  }>;
}

export interface CandidateTalent {
  id: string;
  userId: string;
  name: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  cgpa?: number;
  college: string;
  batch: string;
  readinessScore: number;
  skills: Array<{ name: string; category: string; level: number; isVerified: boolean }>;
  projects: Array<{ id: string; title: string; description: string; technologies: string; url?: string }>;
  assessmentHighlights: Array<{ topic: string; score: number; passed: boolean }>;
  hasResume: boolean;
  matchAnalysis: {
    matchedSkills: string[];
    matchSummary: string;
    targetRole: string;
  };
}

export interface InterviewRecord {
  id: string;
  applicationId: string;
  roundTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl?: string | null;
  interviewerName?: string | null;
  notes?: string | null;
  status: string;
  feedback?: string | null;
  rating?: number | null;
  recommendation?: string | null;
  candidateName: string;
  candidateEmail: string;
  college: string;
  jobTitle: string;
  jobId: string;
  createdAt: string;
}

export interface SkillOption {
  id: string;
  canonicalName: string;
  category: string;
}

export default function RecruiterWorkspace() {
  const [activeTab, setActiveTab] = useState<"overview" | "pipeline" | "discovery" | "interviews" | "jobs" | "post">("overview");

  // Company Information & Analytics
  const [companyName, setCompanyName] = useState("TechCorp Innovations");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalJobsCount: 0,
    activeJobsCount: 0,
    totalApplicationsCount: 0,
    newApplicantsCount: 0,
    shortlistedCount: 0,
    interviewStageCount: 0,
    totalInterviewsCount: 0,
    offersCount: 0,
    rejectedCount: 0,
  });

  // Jobs & Pipeline
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [applicants, setApplicants] = useState<RecruiterApplicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const stages = ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"] as const;

  // Modals & Active Applicant
  const [selectedApplicant, setSelectedApplicant] = useState<RecruiterApplicant | null>(null);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Candidate Discovery State
  const [candidates, setCandidates] = useState<CandidateTalent[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [minCgpaFilter, setMinCgpaFilter] = useState<string>("");
  const [minReadinessFilter, setMinReadinessFilter] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateTalent | null>(null);

  // Interviews State
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTargetApp, setScheduleTargetApp] = useState<{ id: string; name: string; jobTitle: string } | null>(null);
  const [roundTitle, setRoundTitle] = useState("Technical Round 1");
  const [scheduledAt, setScheduledAt] = useState("2026-11-20T11:00");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingUrl, setMeetingUrl] = useState("https://meet.google.com/xyz-techcorp-round");
  const [interviewerName, setInterviewerName] = useState("TechCorp Hiring Panel");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Feedback Evaluation Modal
  const [feedbackInterview, setFeedbackInterview] = useState<InterviewRecord | null>(null);
  const [evalRating, setEvalRating] = useState<number>(4);
  const [evalRec, setEvalRec] = useState<"STRONG_HIRE" | "HIRE" | "HOLD" | "NO_HIRE">("HIRE");
  const [evalText, setEvalText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Post Job Form State
  const [availableSkills, setAvailableSkills] = useState<SkillOption[]>([]);
  const [postTitle, setPostTitle] = useState("");
  const [postType, setPostType] = useState<"FULL_TIME" | "INTERNSHIP">("FULL_TIME");
  const [postLocation, setPostLocation] = useState("Bengaluru (Hybrid)");
  const [postSalary, setPostSalary] = useState("₹12 – 16 LPA");
  const [postDeadline, setPostDeadline] = useState("2026-12-15");
  const [postDescription, setPostDescription] = useState(
    "We are seeking an outstanding software engineer to build scalable distributed systems and resilient microservices. You will collaborate with product designers, implement modern APIs, and write robust test automation."
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [postMinCgpa, setPostMinCgpa] = useState(7.0);
  const [postingJob, setPostingJob] = useState(false);
  const [postSuccessMsg, setPostSuccessMsg] = useState("");

  // Load applicants when selected job changes
  const loadApplicants = async (jobId: string) => {
    if (!jobId) return;
    try {
      setLoadingApplicants(true);
      const res = await fetch(`/api/v1/company/jobs/${jobId}/applicants`);
      if (res.ok) {
        const json = await res.json();
        setApplicants(json.data?.applicants || []);
      }
    } catch (err) {
      console.error("Error loading applicants:", err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Load Candidates for Discovery Tab
  const loadCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const params = new URLSearchParams();
      if (candidateSearch) params.set("q", candidateSearch);
      if (minCgpaFilter) params.set("minCgpa", minCgpaFilter);
      if (minReadinessFilter) params.set("minReadiness", minReadinessFilter);

      const res = await fetch(`/api/v1/company/candidates?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCandidates(json.data?.candidates || []);
      }
    } catch (err) {
      console.error("Candidate search error:", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Load Scheduled Interviews
  const loadInterviews = async () => {
    try {
      setLoadingInterviews(true);
      const res = await fetch("/api/v1/company/interviews");
      if (res.ok) {
        const json = await res.json();
        setInterviews(json.data?.interviews || []);
      }
    } catch (err) {
      console.error("Interviews load error:", err);
    } finally {
      setLoadingInterviews(false);
    }
  };

  // Initial Load
  const loadRecruiterData = async () => {
    try {
      // Ensure session is set to recruiter role
      await fetch("/api/v1/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "RECRUITER" }),
      });

      const [analyticsRes, jobsRes, skillsRes] = await Promise.all([
        fetch("/api/v1/company/analytics"),
        fetch("/api/v1/company/jobs"),
        fetch("/api/v1/skills"),
      ]);

      if (analyticsRes.ok) {
        const aJson = await analyticsRes.json();
        if (aJson.data?.company) {
          setCompanyName(aJson.data.company.name);
        }
        if (aJson.data?.metrics) {
          setMetrics(aJson.data.metrics);
        }
      }

      if (jobsRes.ok) {
        const jJson = await jobsRes.json();
        const loadedJobs: RecruiterJob[] = jJson.data?.jobs || [];
        setJobs(loadedJobs);
        if (loadedJobs.length > 0) {
          setSelectedJobId(loadedJobs[0].id);
          loadApplicants(loadedJobs[0].id);
        }
      }

      if (skillsRes.ok) {
        const sJson = await skillsRes.json();
        const sks: SkillOption[] = sJson.data?.skills || [];
        setAvailableSkills(sks);
        // Pre-select 3 popular skills
        const defaults = sks.slice(0, 3).map((s) => s.id);
        setSelectedSkillIds(defaults);
      }
    } catch (err) {
      console.error("Recruiter workspace init error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecruiterData();
  }, []);

  useEffect(() => {
    if (activeTab === "discovery") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCandidates();
    } else if (activeTab === "interviews") {
      loadInterviews();
    }
  }, [activeTab]);

  // Move Applicant Pipeline Stage
  const handleMoveStage = async (applicationId: string, toStage: string) => {
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: toStage,
          note: `Recruiter moved stage to ${toStage}`,
        }),
      });

      if (res.ok) {
        setApplicants((prev) =>
          prev.map((a) => (a.applicationId === applicationId ? { ...a, stage: toStage } : a))
        );
        if (selectedApplicant && selectedApplicant.applicationId === applicationId) {
          setSelectedApplicant((prev) => (prev ? { ...prev, stage: toStage } : null));
        }
      } else {
        const errJson = await res.json();
        alert(`Failed to update stage: ${errJson.error?.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Stage update error:", err);
    }
  };

  // Add Private Recruiter Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedApplicant) return;

    try {
      setAddingNote(true);
      const res = await fetch(`/api/v1/applications/${selectedApplicant.applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });

      if (res.ok) {
        const json = await res.json();
        const created = json.data?.note || {
          author: "Ananya Deshmukh (You)",
          note: `[RECRUITER NOTE] ${newNote}`,
          createdAt: new Date().toISOString(),
        };

        setApplicants((prev) =>
          prev.map((a) =>
            a.applicationId === selectedApplicant.applicationId
              ? { ...a, notes: [created, ...a.notes] }
              : a
          )
        );

        setSelectedApplicant((prev) =>
          prev ? { ...prev, notes: [created, ...prev.notes] } : null
        );
        setNewNote("");
      } else {
        alert("Failed to save note");
      }
    } catch (err) {
      console.error("Add note error:", err);
    } finally {
      setAddingNote(false);
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTargetApp) return;

    try {
      setScheduling(true);
      const res = await fetch("/api/v1/company/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: scheduleTargetApp.id,
          roundTitle,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes,
          meetingUrl,
          interviewerName,
          notes: interviewNotes,
        }),
      });

      if (res.ok) {
        alert(`✓ Interview scheduled successfully for ${scheduleTargetApp.name}! In-app notification sent to candidate.`);
        setShowScheduleModal(false);
        setScheduleTargetApp(null);
        // Refresh applicants and interviews
        if (selectedJobId) loadApplicants(selectedJobId);
        loadInterviews();
      } else {
        const errJson = await res.json();
        alert(`Error scheduling interview: ${errJson.error?.message || "Failed"}`);
      }
    } catch (err) {
      console.error("Interview schedule error:", err);
    } finally {
      setScheduling(false);
    }
  };

  // Submit Interview Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInterview) return;

    try {
      setSubmittingFeedback(true);
      const res = await fetch(`/api/v1/company/interviews/${feedbackInterview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          rating: evalRating,
          recommendation: evalRec,
          feedback: evalText,
        }),
      });

      if (res.ok) {
        alert("✓ Interview evaluation & feedback recorded successfully!");
        setFeedbackInterview(null);
        setEvalText("");
        loadInterviews();
        if (selectedJobId) loadApplicants(selectedJobId);
      } else {
        alert("Failed to submit feedback");
      }
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Post New Opportunity
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || selectedSkillIds.length === 0) {
      alert("Please enter a title and select at least one skill.");
      return;
    }

    try {
      setPostingJob(true);
      setPostSuccessMsg("");

      const skillsPayload = selectedSkillIds.map((sid) => ({
        skillId: sid,
        requiredLevel: 3,
        importance: "REQUIRED" as const,
      }));

      const res = await fetch("/api/v1/company/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle,
          type: postType,
          description: postDescription,
          location: postLocation,
          salaryRange: postSalary,
          deadline: postDeadline ? new Date(postDeadline).toISOString() : undefined,
          skills: skillsPayload,
          eligibilityRules: [
            {
              ruleType: "MIN_CGPA",
              operator: "GTE",
              valueJson: JSON.stringify({ minCgpa: postMinCgpa }),
            },
          ],
        }),
      });

      const json = await res.json();
      if (res.ok) {
        const createdJobId = json.data?.job?.id;
        // Also immediately publish so it's live for campus students!
        if (createdJobId) {
          await fetch(`/api/v1/company/jobs/${createdJobId}/publish`, { method: "POST" });
        }

        setPostSuccessMsg(`✓ Job posting "${postTitle}" successfully created and published! It is now discoverable by students.`);
        // Reload jobs
        const jRes = await fetch("/api/v1/company/jobs");
        if (jRes.ok) {
          const jJson = await jRes.json();
          setJobs(jJson.data?.jobs || []);
          if (createdJobId) setSelectedJobId(createdJobId);
        }
        setTimeout(() => {
          setPostSuccessMsg("");
          setActiveTab("jobs");
        }, 2000);
      } else {
        alert(`Failed to create job: ${json.error?.message || "Validation failed"}`);
      }
    } catch (err) {
      console.error("Post job error:", err);
    } finally {
      setPostingJob(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Navbar currentRole="RECRUITER" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <div className="mb-8 rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] font-bold text-xl border border-indigo-100">
                <Briefcase className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-[#18181B]">{companyName}</h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    Verified Employer
                  </span>
                </div>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Recruiter Workspace • High-Throughput Fintech Platform Team • Multi-Campus Discovery
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setActiveTab("discovery")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
              >
                <Search className="h-4 w-4 text-[#4F46E5]" />
                <span>Discover Candidates</span>
              </button>

              <button
                onClick={() => setActiveTab("post")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
              >
                <Plus className="h-4 w-4" />
                <span>Post New Opportunity</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-t border-[#F4F4F5] mt-6 pt-4 text-xs font-medium overflow-x-auto">
            {[
              { id: "overview", label: "Recruitment Overview", icon: TrendingUp },
              { id: "pipeline", label: `Applicant Kanban (${applicants.length})`, icon: Users },
              { id: "discovery", label: "Talent Discovery Hub", icon: Sparkles },
              { id: "interviews", label: `Scheduled Interviews (${interviews.length})`, icon: Calendar },
              { id: "jobs", label: `Company Jobs (${jobs.length})`, icon: Briefcase },
              { id: "post", label: "Post New Role", icon: Plus },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth whitespace-nowrap ${
                    isActive
                      ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                      : "text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Active Job Postings</span>
                <div className="text-3xl font-extrabold text-[#18181B] mt-2 font-mono">
                  {metrics.activeJobsCount}
                </div>
                <p className="text-[11px] text-[#71717A] mt-1">Accepting student applications</p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-[#4F46E5]">Total Applications</span>
                <div className="text-3xl font-extrabold text-[#4F46E5] mt-2 font-mono">
                  {metrics.totalApplicationsCount}
                </div>
                <p className="text-[11px] text-[#52525B] mt-1">Across all published listings</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-amber-800">Shortlisted Candidates</span>
                <div className="text-3xl font-extrabold text-amber-700 mt-2 font-mono">
                  {metrics.shortlistedCount}
                </div>
                <p className="text-[11px] text-amber-700 mt-1">Passed initial resume evaluation</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-emerald-800">Offers & Hires</span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">
                  {metrics.offersCount}
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">Final candidates selected</p>
              </div>
            </div>

            {/* Quick Actions & Recent Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Interviews Preview */}
              <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7]">
                  <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#4F46E5]" />
                    <span>Upcoming Technical Rounds</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("interviews")}
                    className="text-xs text-[#4F46E5] font-semibold hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {interviews.length > 0 ? (
                    interviews.slice(0, 4).map((iv) => (
                      <div key={iv.id} className="flex items-center justify-between p-3.5 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9]">
                        <div>
                          <div className="font-semibold text-xs text-[#18181B]">{iv.candidateName}</div>
                          <div className="text-[11px] text-[#52525B] mt-0.5">{iv.roundTitle} • {iv.jobTitle}</div>
                          <div className="text-[10px] text-[#71717A] mt-1 font-mono">
                            {new Date(iv.scheduledAt).toLocaleString()} ({iv.durationMinutes} mins)
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            iv.status === "SCHEDULED" ? "bg-indigo-50 text-[#4F46E5] border border-indigo-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {iv.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-[#71717A]">
                      No upcoming interviews. Schedule one directly from the Applicant Kanban!
                    </div>
                  )}
                </div>
              </div>

              {/* Active Jobs Quick Status */}
              <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7]">
                  <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-600" />
                    <span>Active Postings Pipeline</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("jobs")}
                    className="text-xs text-[#4F46E5] font-semibold hover:underline"
                  >
                    Manage Postings
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {jobs.map((j) => (
                    <div key={j.id} className="flex items-center justify-between p-3.5 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9]">
                      <div>
                        <div className="font-semibold text-xs text-[#18181B]">{j.title}</div>
                        <div className="text-[11px] text-[#52525B] mt-0.5">{j.location} • {j.salaryRange || "Competitive"}</div>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => {
                            setSelectedJobId(j.id);
                            loadApplicants(j.id);
                            setActiveTab("pipeline");
                          }}
                          className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-[#4F46E5] hover:bg-indigo-100 transition-smooth border border-indigo-100"
                        >
                          Review {j._count.applications} Applicants
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPLICANT KANBAN */}
        {activeTab === "pipeline" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Pipeline Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">
                  Hiring Pipeline Kanban
                </h3>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Filter applicants, advance hiring stages, and record internal recruiter feedback.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[#52525B]">Opportunity:</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    loadApplicants(e.target.value);
                  }}
                  className="rounded-lg border border-[#E4E4E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j._count.applications} applicants)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
              {stages.map((stage) => {
                const stageApplicants = applicants.filter((a) => a.stage === stage);
                return (
                  <div
                    key={stage}
                    className="flex flex-col rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]/60 p-3 min-w-[200px]"
                  >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E4E4E7]">
                      <span className="text-xs font-bold text-[#18181B] tracking-tight">{stage}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#52525B] font-mono border border-[#E4E4E7]">
                        {stageApplicants.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1 min-h-[300px]">
                      {stageApplicants.map((app) => (
                        <div
                          key={app.applicationId}
                          onClick={() => setSelectedApplicant(app)}
                          className="rounded-lg border border-[#E4E4E7] bg-white p-3 shadow-subtle cursor-pointer hover:border-[#4F46E5] hover:shadow-md transition-smooth"
                        >
                          <div className="font-semibold text-xs text-[#18181B]">{app.candidate.name}</div>
                          <div className="text-[11px] text-[#52525B] mt-0.5">{app.candidate.institution}</div>
                          <div className="text-[11px] text-[#71717A]">
                            CGPA: {app.candidate.cgpa ? app.candidate.cgpa.toFixed(2) : "N/A"}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#F4F4F5] flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#4F46E5] font-mono">
                              {app.match.matchPercentage}% match
                            </span>
                            <span className="text-[10px] text-[#71717A]">
                              {app.notes.length} note(s)
                            </span>
                          </div>
                        </div>
                      ))}

                      {stageApplicants.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-[11px] text-[#71717A] italic">
                          No candidates
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CANDIDATE DISCOVERY */}
        {activeTab === "discovery" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">Talent Discovery Hub</h3>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Search pre-verified student candidates across partner colleges. Privacy consent verified.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#71717A]" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadCandidates()}
                    placeholder="Search skills, name, role..."
                    className="rounded-lg border border-[#E4E4E7] pl-8 pr-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={minCgpaFilter}
                  onChange={(e) => setMinCgpaFilter(e.target.value)}
                  placeholder="Min CGPA"
                  className="w-24 rounded-lg border border-[#E4E4E7] px-2.5 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                />

                <button
                  onClick={loadCandidates}
                  className="rounded-lg bg-[#4F46E5] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                >
                  Filter Talent
                </button>
              </div>
            </div>

            {/* Candidates Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingCandidates ? (
                <div className="col-span-3 py-12 text-center text-xs text-[#71717A]">
                  Searching verified talent pool...
                </div>
              ) : candidates.length > 0 ? (
                candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle hover:border-[#4F46E5] hover:shadow-md transition-smooth flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-[#18181B]">{cand.name}</h4>
                          <p className="text-xs text-[#52525B] mt-0.5">{cand.college} • {cand.batch}</p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 font-mono border border-emerald-200">
                          {cand.readinessScore}% Ready
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#4F46E5] mt-2">{cand.headline}</p>
                      {cand.cgpa && (
                        <p className="text-[11px] text-[#71717A] mt-0.5 font-mono">CGPA: {cand.cgpa.toFixed(2)}</p>
                      )}

                      {/* Technical Skills */}
                      <div className="mt-3">
                        <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider">Top Skills</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {cand.skills.slice(0, 4).map((sk, idx) => (
                            <span key={idx} className="rounded bg-[#F4F4F5] px-2 py-0.5 text-[11px] text-[#18181B] font-medium">
                              {sk.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AI Matching Analysis */}
                      <div className="mt-3 rounded-lg bg-indigo-50/50 p-2.5 border border-indigo-100 text-[11px] text-[#4F46E5]">
                        <div className="font-semibold flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Candidate Match</span>
                        </div>
                        <p className="text-[11px] text-[#52525B] mt-0.5">{cand.matchAnalysis.matchSummary}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F4F4F5] flex items-center justify-between">
                      <button
                        onClick={() => setSelectedCandidate(cand)}
                        className="text-xs text-[#4F46E5] font-semibold hover:underline"
                      >
                        View Profile & Evidence
                      </button>
                      <button
                        onClick={() => {
                          // Pre-fill interview scheduling
                          setScheduleTargetApp({
                            id: cand.id,
                            name: cand.name,
                            jobTitle: cand.headline || "Technical Opportunity",
                          });
                          setShowScheduleModal(true);
                        }}
                        className="rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                      >
                        Interview Invite
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-12 text-center text-xs text-[#71717A]">
                  No candidates matching this criteria. Try broadening your search or adjusting filters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: INTERVIEWS HUB */}
        {activeTab === "interviews" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">Interview Schedules & Evaluations</h3>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Manage live candidate interview rounds, video meeting links, and recorded hiring evaluations.
                </p>
              </div>

              <button
                onClick={() => {
                  if (applicants.length > 0) {
                    setScheduleTargetApp({
                      id: applicants[0].applicationId,
                      name: applicants[0].candidate.name,
                      jobTitle: "Associate Software Engineer",
                    });
                  }
                  setShowScheduleModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule New Round</span>
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] text-[#52525B] font-semibold border-b border-[#E4E4E7]">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Opportunity</th>
                    <th className="py-3 px-4">Round</th>
                    <th className="py-3 px-4">Scheduled At</th>
                    <th className="py-3 px-4">Interviewer</th>
                    <th className="py-3 px-4">Status & Recommendation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] text-[#18181B]">
                  {interviews.length > 0 ? (
                    interviews.map((iv) => (
                      <tr key={iv.id} className="hover:bg-[#FAFAF9] transition-smooth">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#18181B]">{iv.candidateName}</div>
                          <div className="text-[11px] text-[#71717A]">{iv.candidateEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-[#52525B]">{iv.jobTitle}</td>
                        <td className="py-3 px-4 font-semibold text-[#4F46E5]">{iv.roundTitle}</td>
                        <td className="py-3 px-4 font-mono">
                          {new Date(iv.scheduledAt).toLocaleString()} ({iv.durationMinutes}m)
                        </td>
                        <td className="py-3 px-4 text-[#52525B]">{iv.interviewerName || "Hiring Panel"}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              iv.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-indigo-50 text-[#4F46E5] border border-indigo-200"
                            }`}>
                              {iv.status}
                            </span>
                            {iv.recommendation && (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-[#18181B]">
                                {iv.recommendation} ({iv.rating}/5)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {iv.meetingUrl && (
                              <a
                                href={iv.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#4F46E5] hover:underline"
                              >
                                <Video className="h-3.5 w-3.5" />
                                <span>Join</span>
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setFeedbackInterview(iv);
                                if (iv.rating) setEvalRating(iv.rating);
                                if (iv.recommendation) setEvalRec(iv.recommendation as "STRONG_HIRE" | "HIRE" | "HOLD" | "NO_HIRE");
                                if (iv.feedback) setEvalText(iv.feedback);
                              }}
                              className="text-xs text-emerald-600 font-semibold hover:underline"
                            >
                              {iv.feedback ? "Edit Feedback" : "Record Feedback"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#71717A]">
                        No interviews scheduled. Use the &quot;Schedule New Round&quot; button to set up candidate interviews.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PUBLISHED JOBS */}
        {activeTab === "jobs" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">
                  Company Job Postings ({jobs.length})
                </h3>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Manage active listings and campus opportunities for {companyName}.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("post")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
              >
                <Plus className="h-4 w-4" />
                <span>Post Opportunity</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {jobs.map((j) => (
                <div key={j.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#18181B]">{j.title}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                        j.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {j.status}
                      </span>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-[#4F46E5]">
                        {j.type}
                      </span>
                    </div>

                    <p className="text-xs text-[#52525B] mt-1">{j.location} • {j.salaryRange || "Competitive"}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {j.skills.map((sk, sIdx) => (
                        <span key={sIdx} className="rounded bg-white px-2 py-0.5 text-[10px] text-[#52525B] font-mono border border-[#E4E4E7]">
                          {sk.skill.canonicalName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-sm font-bold text-[#4F46E5] font-mono">{j._count.applications}</div>
                      <span className="text-[11px] text-[#71717A]">Applications</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedJobId(j.id);
                        loadApplicants(j.id);
                        setActiveTab("pipeline");
                      }}
                      className="rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
                    >
                      Kanban Funnel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: POST NEW OPPORTUNITY */}
        {activeTab === "post" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
              Post New Opportunity (Job / Internship)
            </h3>
            <p className="text-xs text-[#52525B] mt-1 mb-6">
              Create an active listing. StepBridge instantly matches student profiles and notifies eligible candidates.
            </p>

            <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Associate Full Stack Engineer"
                  className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Opportunity Type *</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as "FULL_TIME" | "INTERNSHIP")}
                  className="w-full rounded-lg border border-[#E4E4E7] bg-white p-2.5 text-xs font-semibold text-[#18181B]"
                >
                  <option value="FULL_TIME">Full Time (Campus FTE)</option>
                  <option value="INTERNSHIP">Internship (6-Month)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="e.g. Bengaluru (Hybrid) or Remote"
                  className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Compensation Range</label>
                <input
                  type="text"
                  value={postSalary}
                  onChange={(e) => setPostSalary(e.target.value)}
                  placeholder="e.g. ₹12 – 16 LPA"
                  className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={postDeadline}
                  onChange={(e) => setPostDeadline(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Minimum CGPA Cutoff</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={postMinCgpa}
                  onChange={(e) => setPostMinCgpa(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Required Technical Skills *</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAF9]">
                  {availableSkills.map((sk) => {
                    const isSelected = selectedSkillIds.includes(sk.id);
                    return (
                      <button
                        type="button"
                        key={sk.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSkillIds(selectedSkillIds.filter((id) => id !== sk.id));
                          } else {
                            setSelectedSkillIds([...selectedSkillIds, sk.id]);
                          }
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-smooth ${
                          isSelected
                            ? "bg-[#4F46E5] text-white shadow-subtle"
                            : "bg-white text-[#52525B] border border-[#E4E4E7] hover:bg-[#F4F4F5]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {sk.canonicalName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Job Description & Responsibilities *</label>
                <textarea
                  rows={4}
                  required
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={postingJob}
                  className="rounded-lg bg-[#4F46E5] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle disabled:opacity-50"
                >
                  {postingJob ? "Publishing Opportunity..." : "Publish Job & Alert Eligible Students"}
                </button>
              </div>
            </form>

            {postSuccessMsg && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold animate-in fade-in">
                {postSuccessMsg}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: APPLICANT DETAILS DRAWER */}
        {selectedApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="relative w-full max-w-2xl rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-lg font-bold text-[#18181B]">{selectedApplicant.candidate.name}</h3>
                  <p className="text-xs text-[#52525B]">
                    {selectedApplicant.candidate.email} • {selectedApplicant.candidate.institution} • CGPA {selectedApplicant.candidate.cgpa ? selectedApplicant.candidate.cgpa.toFixed(2) : "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Stage Transition Selector */}
              <div className="my-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#52525B]">Hiring Stage Pipeline:</span>
                <div className="flex flex-wrap gap-1.5">
                  {stages.map((stg) => (
                    <button
                      key={stg}
                      onClick={() => handleMoveStage(selectedApplicant.applicationId, stg)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-smooth ${
                        selectedApplicant.stage === stg
                          ? "bg-[#4F46E5] text-white shadow-subtle"
                          : "bg-white border border-[#E4E4E7] text-[#52525B] hover:bg-[#F4F4F5]"
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Explanation */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4F46E5] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    AI Candidate Evaluation
                  </span>
                  <span className="text-xs font-bold text-[#4F46E5] font-mono">
                    {selectedApplicant.match.matchPercentage}% Compatibility Score
                  </span>
                </div>
                <p className="text-xs text-[#52525B] mt-1">{selectedApplicant.match.summary}</p>
              </div>

              {/* Resume & Schedule Buttons */}
              <div className="flex items-center gap-2 mb-4">
                {selectedApplicant.resume && (
                  <a
                    href={`/api/v1/resumes/${selectedApplicant.resume.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#4F46E5]" />
                    <span>Download Candidate Resume ({selectedApplicant.resume.fileType})</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    setScheduleTargetApp({
                      id: selectedApplicant.applicationId,
                      name: selectedApplicant.candidate.name,
                      jobTitle: "Opportunity Candidate",
                    });
                    setShowScheduleModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA]"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Schedule Interview Round</span>
                </button>
              </div>

              {/* Private Notes Section */}
              <div className="space-y-3 pt-4 border-t border-[#E4E4E7]">
                <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#4F46E5]" />
                  <span>Private Recruiter Notes (Internal only)</span>
                </h4>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedApplicant.notes.length === 0 ? (
                    <p className="text-xs text-[#71717A] italic">No private recruiter notes recorded yet.</p>
                  ) : (
                    selectedApplicant.notes.map((note, idx) => (
                      <div key={idx} className="rounded-lg bg-[#F4F4F5] p-3 text-xs">
                        <div className="font-semibold text-[#18181B] text-[11px] flex justify-between">
                          <span>{note.author}</span>
                          <span className="text-[10px] text-[#71717A]">{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[#52525B] mt-0.5">{note.note}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add private evaluation notes..."
                    className="flex-1 rounded-lg border border-[#E4E4E7] px-3.5 py-2 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                  <button
                    type="submit"
                    disabled={addingNote || !newNote.trim()}
                    className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth disabled:opacity-50"
                  >
                    {addingNote ? "Saving..." : "Add Note"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: SCHEDULE INTERVIEW */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">Schedule Candidate Interview</h3>
                  <p className="text-xs text-[#52525B]">
                    Candidate: {scheduleTargetApp?.name || "Selected Applicant"}
                  </p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleInterview} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Interview Round Title *</label>
                  <input
                    type="text"
                    required
                    value={roundTitle}
                    onChange={(e) => setRoundTitle(e.target.value)}
                    placeholder="e.g. Technical Round 1, System Design, HR Discussion"
                    className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Scheduled Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      min="15"
                      max="180"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 45)}
                      className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Video Meeting URL / Location</label>
                  <input
                    type="text"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="e.g. https://meet.google.com/xyz-abc"
                    className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Interviewer Name / Panel</label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="e.g. TechCorp Senior Engineering Lead"
                    className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Preparation Notes / Focus Areas</label>
                  <textarea
                    rows={2}
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    placeholder="Focus on React component lifecycle, TypeScript generics, and database indexing..."
                    className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="rounded-lg border border-[#E4E4E7] px-4 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={scheduling}
                    className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50"
                  >
                    {scheduling ? "Scheduling & Alerting..." : "Confirm & Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: INTERVIEW EVALUATION FEEDBACK */}
        {feedbackInterview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">Interview Evaluation & Feedback</h3>
                  <p className="text-xs text-[#52525B]">
                    Candidate: {feedbackInterview.candidateName} • {feedbackInterview.roundTitle}
                  </p>
                </div>
                <button
                  onClick={() => setFeedbackInterview(null)}
                  className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Technical Rating (1-5)</label>
                    <select
                      value={evalRating}
                      onChange={(e) => setEvalRating(parseInt(e.target.value, 10))}
                      className="w-full rounded-lg border border-[#E4E4E7] bg-white p-2 text-xs font-semibold text-[#18181B]"
                    >
                      <option value={5}>5 - Outstanding (Expert)</option>
                      <option value={4}>4 - Strong Hire</option>
                      <option value={3}>3 - Meets Standard</option>
                      <option value={2}>2 - Below Bar</option>
                      <option value={1}>1 - Significant Gaps</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Hiring Recommendation</label>
                    <select
                      value={evalRec}
                      onChange={(e) => setEvalRec(e.target.value as "STRONG_HIRE" | "HIRE" | "HOLD" | "NO_HIRE")}
                      className="w-full rounded-lg border border-[#E4E4E7] bg-white p-2 text-xs font-semibold text-[#18181B]"
                    >
                      <option value="STRONG_HIRE">Strong Hire</option>
                      <option value="HIRE">Hire</option>
                      <option value="HOLD">Hold / Neutral</option>
                      <option value="NO_HIRE">No Hire</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Detailed Technical Feedback & Notes</label>
                  <textarea
                    rows={4}
                    required
                    value={evalText}
                    onChange={(e) => setEvalText(e.target.value)}
                    placeholder="Candidate demonstrated deep knowledge of distributed caching with Redis and wrote clean TypeScript tests. Highly recommended."
                    className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackInterview(null)}
                    className="rounded-lg border border-[#E4E4E7] px-4 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submittingFeedback ? "Submitting..." : "Save Evaluation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: CANDIDATE DETAIL MODAL */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="relative w-full max-w-2xl rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-lg font-bold text-[#18181B]">{selectedCandidate.name}</h3>
                  <p className="text-xs text-[#52525B]">
                    {selectedCandidate.college} • {selectedCandidate.batch} • CGPA {selectedCandidate.cgpa ? selectedCandidate.cgpa.toFixed(2) : "N/A"}
                  </p>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">Candidate Match Summary</span>
                    <span className="text-xs font-bold font-mono text-[#4F46E5]">{selectedCandidate.readinessScore}% Readiness</span>
                  </div>
                  <p className="text-xs text-[#52525B] mt-1">{selectedCandidate.matchAnalysis.matchSummary}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider mb-2">Verified Technical Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((sk, idx) => (
                      <span key={idx} className="rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-1 text-xs font-medium text-[#18181B]">
                        {sk.name} (Lvl {sk.level})
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider mb-2">Projects</h4>
                  <div className="space-y-2">
                    {selectedCandidate.projects.map((proj) => (
                      <div key={proj.id} className="p-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9]">
                        <h5 className="text-xs font-bold text-[#18181B]">{proj.title}</h5>
                        <p className="text-xs text-[#52525B] mt-0.5">{proj.description}</p>
                        <div className="text-[10px] text-[#71717A] font-mono mt-1">Tech: {proj.technologies}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4E4E7] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setScheduleTargetApp({
                        id: selectedCandidate.id,
                        name: selectedCandidate.name,
                        jobTitle: selectedCandidate.headline,
                      });
                      setSelectedCandidate(null);
                      setShowScheduleModal(true);
                    }}
                    className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA]"
                  >
                    Invite to Interview
                  </button>
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="rounded-lg border border-[#E4E4E7] px-4 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
}
