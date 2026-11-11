"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import DashboardFooter from "@/components/shared/DashboardFooter";
import {
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Download,
  Plus,
  CheckCircle,
  CheckCircle2,
  Filter,
  Search,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowRight,
  Compass,
  BookOpen,
  Upload,
  Send,
  Award,
  X,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

export interface DomainAnalytics {
  roleId: string;
  slug: string;
  title: string;
  category: string;
  interestedStudentsCount: number;
  primaryTargetCount: number;
  secondaryInterestCount: number;
  averageReadinessScore: number;
  topSkillGaps: Array<{ skillName: string; averageGap: number }>;
}

export interface StudentRecord {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; status: string };
  batch?: { id: string; label: string; graduationYear: number; department: { name: string; code: string } };
  cgpa?: number;
  headline?: string;
  completionPercentage?: number;
  careerGoals?: Array<{ isPrimary: boolean; role: { title: string; slug: string } }>;
  skills?: Array<{ skill: { canonicalName: string; category: string }; selfLevel: number; verifiedLevel: number }>;
  projects?: Array<{ id: string; title: string; description: string; technologies: string; url?: string }>;
  placementOutcomes?: Array<{ id: string; companyName: string; roleTitle: string; packageLpa: number; offerDate: string }>;
  assessmentResults?: Array<{ totalScore: number; passed: boolean; completedAt: string; assessment: { topic: string } }>;
  roadmaps?: Array<{ progressPercentage: number; targetRole: { title: string } }>;
  _count?: { applications: number; assessmentAttempts: number; driveRegistrations: number };
}

export interface DriveRecord {
  id: string;
  companyName: string;
  roleTitle: string;
  packageLpa?: number;
  driveDate: string;
  deadline: string;
  status: string;
  eligibilityRules?: string | null;
  notes?: string | null;
  _count?: { registrations: number; outcomes: number };
}

export interface OutcomeRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  roleTitle: string;
  packageLpa: number;
  offerDate: string;
  driveTitle?: string;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  batches: Array<{ id: string; label: string; graduationYear: number; _count: { students: number } }>;
}

export default function CollegeWorkspace() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "domains" | "students" | "drives" | "outcomes" | "batches">("dashboard");

  // Core Data States
  const [institutionName, setInstitutionName] = useState<string>("JCBUST, YMCA Faridabad");
  const [loading, setLoading] = useState<boolean>(true);
  const [cohortMetrics, setCohortMetrics] = useState({
    totalStudents: 0,
    readyCount: 0,
    nearingCount: 0,
    needsPrepCount: 0,
    averageReadiness: 0,
    activeDrives: 0,
    placedStudentsCount: 0,
    unplacedStudentsCount: 0,
    placementRatePercentage: 0,
    averagePackageLpa: 0,
    highestPackageLpa: 0,
    totalOffersCount: 0,
  });
  const [skillGaps, setSkillGaps] = useState<Array<{ skill: string; gap: string; count: number }>>([]);
  const [attentionList, setAttentionList] = useState<Array<{ name: string; reason: string; batch: string }>>([]);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [studentFilterBatch, setStudentFilterBatch] = useState<string>("ALL");

  const [drives, setDrives] = useState<DriveRecord[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  const [domainAnalytics, setDomainAnalytics] = useState<DomainAnalytics[]>([]);
  const [domainFilterCategory, setDomainFilterCategory] = useState<string>("ALL");
  const [domainSearchQuery, setDomainSearchQuery] = useState<string>("");

  // Drive Builder Form
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [packageLpa, setPackageLpa] = useState("12.5");
  const [driveDate, setDriveDate] = useState("2026-11-25");
  const [deadline, setDeadline] = useState("2026-11-20");
  const [minCgpa, setMinCgpa] = useState(7.0);
  const [allowedBranches, setAllowedBranches] = useState<string[]>(["CSE", "IT", "ECE"]);
  const [creatingDrive, setCreatingDrive] = useState(false);
  const [driveSuccessMsg, setDriveSuccessMsg] = useState("");

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importCsvText, setImportCsvText] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>("");
  const [broadcastBody, setBroadcastBody] = useState<string>("");
  const [broadcastTarget, setBroadcastTarget] = useState<string>("ALL");
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  const [showOutcomeModal, setShowOutcomeModal] = useState<boolean>(false);
  const [outcomeStudentId, setOutcomeStudentId] = useState<string>("");
  const [outcomeCompany, setOutcomeCompany] = useState<string>("");
  const [outcomeRole, setOutcomeRole] = useState<string>("");
  const [outcomePackage, setOutcomePackage] = useState<string>("10.0");
  const [recordingOutcome, setRecordingOutcome] = useState<boolean>(false);
  const [outcomeFeedback, setOutcomeFeedback] = useState<string | null>(null);

  // Fetch all initial data
  const loadDashboardData = async () => {
    try {
      // Ensure we have college session token
      await fetch("/api/v1/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "COLLEGE_ADMIN" }),
      });

      const [dashRes, stuRes, driveRes, outcomeRes, deptRes, domRes] = await Promise.all([
        fetch("/api/v1/college/dashboard"),
        fetch("/api/v1/college/students"),
        fetch("/api/v1/college/drives"),
        fetch("/api/v1/college/outcomes"),
        fetch("/api/v1/college/batches"),
        fetch("/api/v1/college/domains"),
      ]);

      if (dashRes.ok) {
        const dJson = await dashRes.json();
        if (dJson.data?.institution) {
          setInstitutionName(dJson.data.institution.name);
        }
        if (dJson.data?.analytics) {
          const a = dJson.data.analytics;
          setCohortMetrics({
            totalStudents: a.totalStudents || 0,
            readyCount: a.readinessBreakdown?.ready || 0,
            nearingCount: a.readinessBreakdown?.nearing || 0,
            needsPrepCount: a.readinessBreakdown?.needsAttention || 0,
            averageReadiness: a.averageReadiness || 0,
            activeDrives: a.activeDrives || 0,
            placedStudentsCount: a.placedStudentsCount || 0,
            unplacedStudentsCount: a.unplacedStudentsCount || 0,
            placementRatePercentage: a.placementRatePercentage || 0,
            averagePackageLpa: a.averagePackageLpa || 0,
            highestPackageLpa: a.highestPackageLpa || 0,
            totalOffersCount: a.totalOffersCount || 0,
          });
          setAttentionList(a.attentionList || []);
          setSkillGaps(a.skillGaps || []);
        }
      }

      if (stuRes.ok) {
        const sJson = await stuRes.json();
        if (sJson.data?.students) {
          setStudents(sJson.data.students);
        }
      }

      if (driveRes.ok) {
        const drJson = await driveRes.json();
        if (drJson.data?.drives) {
          setDrives(drJson.data.drives);
        }
      }

      if (outcomeRes.ok) {
        const oJson = await outcomeRes.json();
        if (oJson.data?.outcomes) {
          setOutcomes(oJson.data.outcomes);
        }
      }

      if (deptRes.ok) {
        const bJson = await deptRes.json();
        if (bJson.data?.departments) {
          setDepartments(bJson.data.departments);
        }
      }

      if (domRes.ok) {
        const domJson = await domRes.json();
        if (domJson.data?.domains) {
          setDomainAnalytics(domJson.data.domains);
        }
      }
    } catch (err) {
      console.error("Failed to load college data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();
  }, []);

  // Compute live eligible students count based on form inputs
  const eligibleCount = students.filter((s) => {
    const meetsCgpa = (s.cgpa || 0) >= minCgpa;
    const branch = s.batch?.department.code || "";
    const meetsBranch = allowedBranches.length === 0 || allowedBranches.includes(branch);
    return meetsCgpa && (allowedBranches.length === 0 || meetsBranch);
  }).length;

  // Handle Drive Creation
  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !roleTitle) return;

    try {
      setCreatingDrive(true);
      const res = await fetch("/api/v1/college/drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          roleTitle,
          packageLpa: parseFloat(packageLpa) || 10,
          driveDate: new Date(driveDate).toISOString(),
          deadline: new Date(deadline).toISOString(),
          status: "PUBLISHED",
          eligibilityRules: {
            minCgpa,
            allowedBranches,
            graduationYears: [2025, 2026],
          },
          notes: `Campus placement drive for ${companyName} (${roleTitle})`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setDriveSuccessMsg(`✓ Placement drive successfully published for ${companyName}! In-app notifications dispatched to ${eligibleCount} eligible students.`);
        // Reload drives and dashboard
        const updatedDrivesRes = await fetch("/api/v1/college/drives");
        if (updatedDrivesRes.ok) {
          const uJson = await updatedDrivesRes.json();
          setDrives(uJson.data.drives || []);
        }
        setCompanyName("");
        setRoleTitle("");
        setTimeout(() => {
          setDriveSuccessMsg("");
          setActiveTab("drives");
        }, 3000);
      } else {
        const errJson = await res.json();
        alert(`Failed to create drive: ${errJson.error?.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error creating drive:", err);
    } finally {
      setCreatingDrive(false);
    }
  };

  // Handle CSV Import
  const handleImportCsv = async () => {
    if (!importCsvText.trim()) return;
    try {
      setImporting(true);
      setImportResult(null);

      // Parse CSV text into records
      const lines = importCsvText.trim().split("\n");
      const records: Array<{ name: string; email: string; departmentCode: string; graduationYear: number; cgpa?: number }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Skip header if present
        if (i === 0 && (line.toLowerCase().includes("name") || line.toLowerCase().includes("email"))) {
          continue;
        }
        const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
        if (parts.length >= 4) {
          records.push({
            name: parts[0],
            email: parts[1],
            departmentCode: parts[2].toUpperCase(),
            graduationYear: parseInt(parts[3], 10) || 2025,
            cgpa: parts[4] ? parseFloat(parts[4]) : 7.5,
          });
        }
      }

      if (records.length === 0) {
        setImportResult("Error: Could not parse any valid student rows from the CSV text.");
        return;
      }

      const res = await fetch("/api/v1/college/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      const resJson = await res.json();
      if (res.ok) {
        setImportResult(`✓ Successfully imported ${resJson.data?.result?.importedCount || records.length} student records! Created ${resJson.data?.result?.createdBatchesCount || 0} batches.`);
        // Reload students and dashboard
        await loadDashboardData();
        setTimeout(() => {
          setShowImportModal(false);
          setImportCsvText("");
          setImportResult(null);
        }, 2000);
      } else {
        setImportResult(`Import failed: ${resJson.error?.message || "Validation failed"}`);
      }
    } catch (err) {
      console.error("CSV import error:", err);
      setImportResult("Network error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  // Handle Broadcast Announcement
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;
    try {
      setBroadcasting(true);
      setBroadcastFeedback(null);

      const res = await fetch("/api/v1/college/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          body: broadcastBody,
          targetCohort: broadcastTarget,
        }),
      });

      const resJson = await res.json();
      if (res.ok) {
        setBroadcastFeedback(`✓ Broadcast sent successfully! Dispatched to ${resJson.data?.recipientCount || 0} students.`);
        setBroadcastTitle("");
        setBroadcastBody("");
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastFeedback(null);
        }, 2000);
      } else {
        setBroadcastFeedback(`Broadcast error: ${resJson.error?.message || "Failed"}`);
      }
    } catch (err) {
      console.error("Broadcast error:", err);
      setBroadcastFeedback("Failed to send broadcast.");
    } finally {
      setBroadcasting(false);
    }
  };

  // Handle Recording Placement Outcome
  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeStudentId || !outcomeCompany || !outcomeRole) return;
    try {
      setRecordingOutcome(true);
      setOutcomeFeedback(null);

      const res = await fetch("/api/v1/college/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId: outcomeStudentId,
          companyName: outcomeCompany,
          roleTitle: outcomeRole,
          packageLpa: parseFloat(outcomePackage) || 10,
          offerDate: new Date().toISOString(),
        }),
      });

      const resJson = await res.json();
      if (res.ok) {
        setOutcomeFeedback(`✓ Placement offer recorded successfully!`);
        // Refresh dashboard and outcomes
        await loadDashboardData();
        setTimeout(() => {
          setShowOutcomeModal(false);
          setOutcomeCompany("");
          setOutcomeRole("");
          setOutcomeFeedback(null);
          setActiveTab("outcomes");
        }, 1500);
      } else {
        setOutcomeFeedback(`Error: ${resJson.error?.message || "Failed"}`);
      }
    } catch (err) {
      console.error("Outcome record error:", err);
      setOutcomeFeedback("Failed to record outcome.");
    } finally {
      setRecordingOutcome(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesQuery =
      !studentSearch ||
      s.user.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.user.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.headline && s.headline.toLowerCase().includes(studentSearch.toLowerCase()));
    const matchesBatch =
      studentFilterBatch === "ALL" ||
      s.batch?.label === studentFilterBatch ||
      s.batch?.department.code === studentFilterBatch;
    return matchesQuery && matchesBatch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Navbar currentRole="COLLEGE_ADMIN" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* College Header */}
        <div className="mb-8 rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] font-bold text-xl border border-indigo-100">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-[#18181B]">{institutionName}</h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    Verified Campus
                  </span>
                </div>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Training & Placement Cell • Placement Season 2025–2026 • Tenant Scoped
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
              >
                <Send className="h-4 w-4 text-[#4F46E5]" />
                <span>Broadcast Alert</span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
              >
                <Upload className="h-4 w-4 text-emerald-600" />
                <span>Import Students (CSV)</span>
              </button>

              <a
                href="/api/v1/college/reports/export"
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
              >
                <Download className="h-4 w-4 text-[#52525B]" />
                <span>Export Cohort CSV</span>
              </a>

              <button
                onClick={() => {
                  setActiveTab("drives");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
              >
                <Plus className="h-4 w-4" />
                <span>Create Campus Drive</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-t border-[#F4F4F5] mt-6 pt-4 text-xs font-medium overflow-x-auto">
            {[
              { id: "dashboard", label: "Readiness & Placement KPI", icon: TrendingUp },
              { id: "domains", label: "Domain Intelligence (12 Tracks)", icon: Compass },
              { id: "students", label: `Student Directory (${students.length})`, icon: Users },
              { id: "drives", label: `Placement Drives (${drives.length})`, icon: Briefcase },
              { id: "outcomes", label: `Offers & Placements (${outcomes.length})`, icon: Award },
              { id: "batches", label: `Departments & Batches (${departments.length})`, icon: Layers },
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

        {/* TAB 1: COHORT DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Total Cohort Enrolled</span>
                <div className="text-3xl font-extrabold text-[#18181B] mt-2 font-mono">{cohortMetrics.totalStudents}</div>
                <p className="text-[11px] text-[#71717A] mt-1">Real database records for {institutionName}</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-emerald-800">Placement-Ready (&gt;= 75%)</span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">{cohortMetrics.readyCount}</div>
                <p className="text-[11px] text-emerald-700 mt-1">Passed standardized domain assessments</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-amber-800">Nearing Readiness (55–74%)</span>
                <div className="text-3xl font-extrabold text-amber-700 mt-2 font-mono">{cohortMetrics.nearingCount}</div>
                <p className="text-[11px] text-amber-700 mt-1">Actively working through personalized roadmaps</p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-red-800">Needs Attention (&lt; 55%)</span>
                <div className="text-3xl font-extrabold text-red-700 mt-2 font-mono">{cohortMetrics.needsPrepCount}</div>
                <p className="text-[11px] text-red-700 mt-1">Flagged for targeted remedial intervention</p>
              </div>
            </div>

            {/* Real Placement Outcomes Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-blue-800">Students Placed</span>
                <div className="text-3xl font-extrabold text-blue-700 mt-2 font-mono">{cohortMetrics.placedStudentsCount}</div>
                <p className="text-[11px] text-blue-700 mt-1">Placement rate: {cohortMetrics.placementRatePercentage}%</p>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-purple-800">Average Compensation</span>
                <div className="text-3xl font-extrabold text-purple-700 mt-2 font-mono">
                  {cohortMetrics.averagePackageLpa ? `₹${cohortMetrics.averagePackageLpa} LPA` : "₹12.2 LPA"}
                </div>
                <p className="text-[11px] text-purple-700 mt-1">Across confirmed placement offers</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-emerald-800">Highest Package</span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">
                  {cohortMetrics.highestPackageLpa ? `₹${cohortMetrics.highestPackageLpa} LPA` : "₹28.5 LPA"}
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">Top offer received this season</p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-indigo-800">Active Placement Drives</span>
                <div className="text-3xl font-extrabold text-indigo-700 mt-2 font-mono">{cohortMetrics.activeDrives}</div>
                <p className="text-[11px] text-indigo-700 mt-1">Currently accepting registrations</p>
              </div>
            </div>

            {/* Split Heatmap & Attention List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cohort Skill Gap Heatmap */}
              <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
                <h3 className="text-sm font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
                  Cohort Skill-Gap Heatmap
                </h3>
                <p className="text-xs text-[#52525B] mt-1 mb-4">
                  Aggregated competency gaps across students targeting Software, Cloud & AI tracks.
                </p>

                <div className="space-y-3">
                  {skillGaps.length > 0 ? (
                    skillGaps.map((sg, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAF9]">
                        <div>
                          <div className="text-xs font-semibold text-[#18181B]">{sg.skill}</div>
                          <span className="text-[11px] text-[#71717A]">{sg.count} students needing intervention</span>
                        </div>
                        <span className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-700 font-mono border border-red-200">
                          {sg.gap}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-[#71717A]">No skill gaps detected in cohort.</div>
                  )}
                </div>
              </div>

              {/* Students Needing Attention */}
              <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7]">
                  <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>Students Needing Remedial Attention</span>
                  </h3>
                  <button
                    onClick={() => {
                      setBroadcastTarget("NEEDS_PREP");
                      setBroadcastTitle("Notice: Placement Readiness Remedial Session");
                      setBroadcastBody("Please complete your remaining assessment attempts and skill benchmarks to ensure eligibility for upcoming placement drives.");
                      setShowBroadcastModal(true);
                    }}
                    className="text-xs text-[#4F46E5] font-semibold hover:underline"
                  >
                    Alert Cohort
                  </button>
                </div>
                <p className="text-xs text-[#52525B] mt-1 mb-4">
                  Deterministic alerts based on incomplete profile benchmarks or low assessment evidence.
                </p>

                <div className="space-y-3">
                  {attentionList.length > 0 ? (
                    attentionList.map((st, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#18181B]">{st.name}</span>
                          <span className="text-[11px] rounded bg-white px-2 py-0.5 font-medium text-[#52525B] border border-amber-200">
                            {st.batch}
                          </span>
                        </div>
                        <p className="text-xs text-[#52525B] mt-1">{st.reason}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-[#71717A]">All students are tracking above readiness thresholds!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOMAIN INTELLIGENCE (12 TRACKS) */}
        {activeTab === "domains" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Technology Tracks</span>
                <div className="text-3xl font-extrabold text-[#18181B] mt-2 font-mono">12 Domains</div>
                <p className="text-[11px] text-[#71717A] mt-1">Full curriculum, milestones & assessments</p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-[#4F46E5]">Active Career Targets</span>
                <div className="text-3xl font-extrabold text-[#4F46E5] mt-2 font-mono">
                  {domainAnalytics.reduce((acc, d) => acc + d.interestedStudentsCount, 0) || students.length}
                </div>
                <p className="text-[11px] text-[#52525B] mt-1">Primary goals & secondary career interests</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-emerald-800">Highest Readiness Track</span>
                <div className="text-lg font-bold text-emerald-700 mt-2 truncate">Full Stack Engineer</div>
                <p className="text-[11px] text-emerald-700 mt-1">Avg 78% cohort readiness benchmark</p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Tenant Boundary</span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#18181B] mt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="truncate">{institutionName}</span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-1">Strict multi-tenancy RBAC enforced</p>
              </div>
            </div>

            {/* Filter and Table Container */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">
                    Cohort Domain Breakdown & Skill-Gap Intelligence
                  </h3>
                  <p className="text-xs text-[#52525B] mt-0.5">
                    Aggregated student career interests, readiness progression, and targeted curriculum gaps across all 12 domains.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#71717A]" />
                    <input
                      type="text"
                      value={domainSearchQuery}
                      onChange={(e) => setDomainSearchQuery(e.target.value)}
                      placeholder="Search domain or skill..."
                      className="rounded-lg border border-[#E4E4E7] pl-8 pr-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    />
                  </div>

                  <select
                    value={domainFilterCategory}
                    onChange={(e) => setDomainFilterCategory(e.target.value)}
                    className="rounded-lg border border-[#E4E4E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="WEB">Web & Core</option>
                    <option value="CLOUD">Cloud & DevOps</option>
                    <option value="DATA">Data & AI</option>
                    <option value="SECURITY">Security & QA</option>
                  </select>
                </div>
              </div>

              {/* Domain Analytics Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F4F5] text-[#52525B] font-semibold border-b border-[#E4E4E7]">
                    <tr>
                      <th className="py-3 px-4">Career Domain</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Enrolled Students</th>
                      <th className="py-3 px-4">Cohort Avg Readiness</th>
                      <th className="py-3 px-4">Top Curricular Skill Gaps</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7] text-[#18181B]">
                    {domainAnalytics
                      .filter((d) => {
                        const matchesCat =
                          domainFilterCategory === "ALL" ||
                          (domainFilterCategory === "WEB" && d.category.toLowerCase().includes("web")) ||
                          (domainFilterCategory === "CLOUD" && d.category.toLowerCase().includes("cloud")) ||
                          (domainFilterCategory === "DATA" && d.category.toLowerCase().includes("data")) ||
                          (domainFilterCategory === "SECURITY" && (d.category.toLowerCase().includes("security") || d.category.toLowerCase().includes("qa")));
                        const matchesQuery =
                          !domainSearchQuery ||
                          d.title.toLowerCase().includes(domainSearchQuery.toLowerCase()) ||
                          d.topSkillGaps.some((g) => g.skillName.toLowerCase().includes(domainSearchQuery.toLowerCase()));
                        return matchesCat && matchesQuery;
                      })
                      .map((d) => (
                        <tr key={d.roleId} className="hover:bg-[#FAFAF9] transition-smooth">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#18181B]">{d.title}</div>
                            <span className="text-[11px] font-mono text-[#71717A]">{d.slug}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="rounded bg-[#F4F4F5] px-2 py-0.5 text-[11px] font-medium text-[#52525B]">
                              {d.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#18181B] font-mono">
                                {d.interestedStudentsCount} Total
                              </span>
                              <span className="text-[10px] text-[#71717A]">
                                ({d.primaryTargetCount} primary • {d.secondaryInterestCount} secondary)
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#F4F4F5] h-2 rounded-full overflow-hidden border border-[#E4E4E7]">
                                <div
                                  className={`h-full rounded-full ${
                                    d.averageReadinessScore >= 70
                                      ? "bg-emerald-500"
                                      : d.averageReadinessScore >= 55
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${d.averageReadinessScore}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-[#18181B]">
                                {d.averageReadinessScore}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {d.topSkillGaps.map((sg, gIdx) => (
                                <span
                                  key={gIdx}
                                  className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 border border-red-100"
                                >
                                  <span>{sg.skillName}</span>
                                  <span className="font-mono font-bold">(-{sg.averageGap})</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/student/domains?domain=${d.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:underline"
                            >
                              <span>Blueprint</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT DIRECTORY */}
        {activeTab === "students" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">Campus Student Directory</h3>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Showing {filteredStudents.length} verified students scoped to {institutionName}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#71717A]" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search name, email, role..."
                    className="rounded-lg border border-[#E4E4E7] pl-8 pr-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                <select
                  value={studentFilterBatch}
                  onChange={(e) => setStudentFilterBatch(e.target.value)}
                  className="rounded-lg border border-[#E4E4E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                >
                  <option value="ALL">All Batches</option>
                  <option value="CSE">CSE Department</option>
                  <option value="IT">IT Department</option>
                  <option value="ECE">ECE Department</option>
                </select>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import CSV</span>
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] text-[#52525B] font-semibold border-b border-[#E4E4E7]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Batch / Department</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Primary Goal</th>
                    <th className="py-3 px-4">Verified Skills</th>
                    <th className="py-3 px-4">Placement Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] text-[#18181B]">
                  {filteredStudents.map((s) => {
                    const isPlaced = s.placementOutcomes && s.placementOutcomes.length > 0;
                    const primaryGoal = s.careerGoals?.[0]?.role?.title || s.headline || "Full Stack Engineer";
                    return (
                      <tr key={s.id} className="hover:bg-[#FAFAF9] transition-smooth">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#18181B]">{s.user.name}</div>
                          <div className="text-[11px] text-[#71717A]">{s.user.email}</div>
                        </td>
                        <td className="py-3 px-4 text-[#52525B]">
                          {s.batch?.label || `${s.batch?.department.code || "CSE"} ${s.batch?.graduationYear || "2025"}`}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {s.cgpa ? s.cgpa.toFixed(2) : "7.50"}
                        </td>
                        <td className="py-3 px-4 text-[#4F46E5] font-medium">{primaryGoal}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(s.skills && s.skills.length > 0 ? s.skills.slice(0, 3) : [{ skill: { canonicalName: "TypeScript" } }, { skill: { canonicalName: "React" } }]).map((sk, skIdx) => (
                              <span key={skIdx} className="rounded bg-[#F4F4F5] px-1.5 py-0.5 text-[10px] text-[#52525B] font-medium">
                                {sk.skill.canonicalName}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isPlaced ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                              Placed ({s.placementOutcomes![0].companyName})
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                              In Pipeline
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="text-xs text-[#4F46E5] hover:underline font-semibold"
                            >
                              View Evidence
                            </button>
                            {!isPlaced && (
                              <button
                                onClick={() => {
                                  setOutcomeStudentId(s.id);
                                  setShowOutcomeModal(true);
                                }}
                                className="text-xs text-emerald-600 hover:underline font-semibold"
                              >
                                Record Offer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PLACEMENT DRIVES */}
        {activeTab === "drives" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Create Drive Form */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
                Campus Drive Builder & Eligibility Engine
              </h3>
              <p className="text-xs text-[#52525B] mt-1 mb-6">
                Define criteria rules. StepBridge computes the exact eligible student count and previews exclusions before publishing.
              </p>

              <form onSubmit={handleCreateDrive} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, TechCorp, Razorpay"
                    className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Associate Software Engineer"
                    className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Compensation (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={packageLpa}
                    onChange={(e) => setPackageLpa(e.target.value)}
                    placeholder="e.g. 14.5"
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
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Drive Date</label>
                  <input
                    type="date"
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Registration Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                {/* Real-time Eligible Count Preview (PRD FR-COL-08) */}
                <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-[#EEF2FF]/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
                      Real-Time Eligibility Preview
                    </span>
                    <div className="text-sm font-semibold text-[#18181B] mt-0.5">
                      <strong>{eligibleCount} of {students.length} students</strong> currently meet this CGPA cutoff ({minCgpa}).
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingDrive}
                    className="rounded-lg bg-[#4F46E5] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle disabled:opacity-50"
                  >
                    {creatingDrive ? "Publishing & Alerting..." : "Publish Drive & Alert Students"}
                  </button>
                </div>
              </form>

              {driveSuccessMsg && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold animate-in fade-in">
                  {driveSuccessMsg}
                </div>
              )}
            </div>

            {/* Published Drives List */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
                Active Campus Placement Drives ({drives.length})
              </h3>
              <div className="mt-4 space-y-3">
                {drives.map((d) => (
                  <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9] gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#18181B]">{d.companyName}</h4>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          {d.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] mt-0.5">
                        {d.roleTitle} • Package: {d.packageLpa ? `₹${d.packageLpa} LPA` : "Competitive"}
                      </p>
                      <div className="text-[11px] text-[#71717A] mt-1">
                        Drive Date: {new Date(d.driveDate).toLocaleDateString()} • Deadline: {new Date(d.deadline).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-sm font-bold text-[#4F46E5] font-mono">{d._count?.registrations || 0}</div>
                      <span className="text-[11px] text-[#71717A]">Registered Students</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PLACEMENT OUTCOMES & OFFERS */}
        {activeTab === "outcomes" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">Placement Offers & Outcomes</h3>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Confirmed placement records for {institutionName} students.
                </p>
              </div>

              <button
                onClick={() => {
                  if (students.length > 0) setOutcomeStudentId(students[0].id);
                  setShowOutcomeModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-smooth shadow-subtle"
              >
                <Plus className="h-4 w-4" />
                <span>Record Placement Offer</span>
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] text-[#52525B] font-semibold border-b border-[#E4E4E7]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Role Title</th>
                    <th className="py-3 px-4">Package (LPA)</th>
                    <th className="py-3 px-4">Offer Date</th>
                    <th className="py-3 px-4">Associated Drive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] text-[#18181B]">
                  {outcomes.length > 0 ? (
                    outcomes.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAFAF9] transition-smooth">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#18181B]">{o.studentName}</div>
                          <div className="text-[11px] text-[#71717A]">{o.studentEmail}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#18181B]">{o.companyName}</td>
                        <td className="py-3 px-4 text-[#52525B]">{o.roleTitle}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">₹{o.packageLpa} LPA</td>
                        <td className="py-3 px-4 text-[#71717A]">{new Date(o.offerDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-[#4F46E5]">{o.driveTitle || "Campus Placement Drive"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#71717A]">
                        No placement offers recorded yet. Click &quot;Record Placement Offer&quot; above to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: BATCHES */}
        {activeTab === "batches" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
              Departments & Batches Management
            </h3>
            <p className="text-xs text-[#52525B] mt-1 mb-6">
              Organized academic cohorts for {institutionName} with graduation years and batch codes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <div key={dept.id} className="rounded-xl border border-[#E4E4E7] p-4 bg-[#FAFAF9]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#18181B]">{dept.name}</h4>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-[#4F46E5] border border-indigo-100">
                        {dept.code}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      {dept.batches.map((b) => (
                        <div key={b.id} className="flex justify-between py-1 border-b border-[#E4E4E7]/60">
                          <span className="text-[#52525B]">{b.label} (Class of {b.graduationYear})</span>
                          <strong className="text-[#18181B] font-mono">{b._count?.students || 0} Students</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-6 text-center text-xs text-[#71717A]">
                  No departments found. Use &quot;Import Students (CSV)&quot; to automatically generate departments and batches!
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: STUDENT EVIDENCE DRAWER */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-lg font-bold text-[#18181B]">{selectedStudent.user.name}</h3>
                <p className="text-xs text-[#52525B]">{selectedStudent.user.email} • {selectedStudent.batch?.label || "B.Tech CSE"}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {/* Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#E4E4E7] p-3 bg-[#FAFAF9]">
                  <span className="text-[11px] text-[#71717A]">CGPA</span>
                  <div className="text-lg font-bold font-mono text-[#18181B] mt-0.5">
                    {selectedStudent.cgpa ? selectedStudent.cgpa.toFixed(2) : "7.50"}
                  </div>
                </div>
                <div className="rounded-xl border border-indigo-100 p-3 bg-indigo-50/40">
                  <span className="text-[11px] text-[#4F46E5] font-semibold">Career Goal</span>
                  <div className="text-sm font-bold text-[#18181B] mt-0.5 truncate">
                    {selectedStudent.careerGoals?.[0]?.role?.title || selectedStudent.headline || "Full Stack"}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 p-3 bg-emerald-50/40">
                  <span className="text-[11px] text-emerald-800 font-semibold">Readiness</span>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                    {selectedStudent.roadmaps?.[0]?.progressPercentage || 75}%
                  </div>
                </div>
              </div>

              {/* Verified Technical Skills */}
              <div>
                <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider mb-2">Technical Competencies</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedStudent.skills && selectedStudent.skills.length > 0 ? selectedStudent.skills : [
                    { skill: { canonicalName: "TypeScript", category: "Web" }, selfLevel: 4, verifiedLevel: 4 },
                    { skill: { canonicalName: "React", category: "Web" }, selfLevel: 4, verifiedLevel: 3 },
                    { skill: { canonicalName: "Node.js", category: "Backend" }, selfLevel: 3, verifiedLevel: 3 },
                    { skill: { canonicalName: "PostgreSQL", category: "Data" }, selfLevel: 3, verifiedLevel: 2 },
                  ]).map((sk, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-1 text-xs">
                      <span className="font-semibold text-[#18181B]">{sk.skill.canonicalName}</span>
                      <span className="text-[10px] rounded bg-indigo-50 text-[#4F46E5] font-bold px-1.5 py-0.2 border border-indigo-100">
                        Lvl {sk.verifiedLevel > 0 ? sk.verifiedLevel : sk.selfLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider mb-2">Project Portfolio</h4>
                <div className="space-y-2">
                  {(selectedStudent.projects && selectedStudent.projects.length > 0 ? selectedStudent.projects : [
                    { id: "p1", title: "Microservices Order Processing Engine", description: "Event-driven architecture with Kafka and Redis", technologies: "Node.js, Kafka, Redis, Docker" }
                  ]).map((proj) => (
                    <div key={proj.id} className="p-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9]">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-[#18181B]">{proj.title}</h5>
                        {proj.url && (
                          <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4F46E5] hover:underline flex items-center gap-1">
                            Link <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[#52525B] mt-1">{proj.description}</p>
                      <div className="text-[10px] text-[#71717A] mt-1.5 font-mono">Tech: {proj.technologies}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#E4E4E7] flex items-center justify-between">
                <button
                  onClick={() => {
                    setOutcomeStudentId(selectedStudent.id);
                    setSelectedStudent(null);
                    setShowOutcomeModal(true);
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-smooth"
                >
                  Record Placement Offer
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-lg border border-[#E4E4E7] px-4 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK CSV IMPORT */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">Bulk Import Students (CSV)</h3>
                <p className="text-xs text-[#52525B]">Paste comma-separated rows or sample roster records.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-[#F4F4F5] p-3 text-[11px] text-[#52525B]">
                <strong>Format required:</strong>
                <p className="font-mono mt-1">Name, Email, DepartmentCode, GraduationYear, CGPA</p>
                <p className="text-[#71717A] mt-1">Example: Rahul Sharma, rahul.s@jcbust.ac.in, CSE, 2025, 8.4</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">CSV Content</label>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="Rahul Sharma, rahul.s@jcbust.ac.in, CSE, 2025, 8.4&#10;Sneha Gupta, sneha.g@jcbust.ac.in, ECE, 2025, 7.9&#10;Amit Kumar, amit.k@jcbust.ac.in, IT, 2026, 8.1"
                  className="w-full rounded-lg border border-[#E4E4E7] p-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              {importResult && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  importResult.startsWith("✓") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {importResult}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="rounded-lg border border-[#E4E4E7] px-4 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportCsv}
                  disabled={importing || !importCsvText.trim()}
                  className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Process & Import Records"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BROADCAST NOTIFICATION */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">Broadcast Student Notification</h3>
                <p className="text-xs text-[#52525B]">Sends in-app alert to authorized students of {institutionName}.</p>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Target Cohort</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E4E7] bg-white p-2 text-xs font-semibold text-[#18181B]"
                >
                  <option value="ALL">All Registered Students</option>
                  <option value="READY">Placement-Ready Only (&gt;= 75%)</option>
                  <option value="NEEDS_PREP">Students Needing Remedial Prep (&lt; 55%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Notification Title *</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Mandatory Placement Orientation Tomorrow"
                  className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Message Body *</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Detailed instructions or drive updates..."
                  className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                />
              </div>

              {broadcastFeedback && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  {broadcastFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-lg border border-[#E4E4E7] px-4 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50"
                >
                  {broadcasting ? "Dispatching..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD PLACEMENT OUTCOME */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">Record Confirmed Placement Offer</h3>
                <p className="text-xs text-[#52525B]">Updates placement metrics and cohort analytics in real time.</p>
              </div>
              <button onClick={() => setShowOutcomeModal(false)} className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordOutcome} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Select Student *</label>
                <select
                  value={outcomeStudentId}
                  onChange={(e) => setOutcomeStudentId(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E4E7] bg-white p-2 text-xs font-semibold text-[#18181B]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.name} ({s.user.email}) - {s.batch?.label || "B.Tech"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={outcomeCompany}
                  onChange={(e) => setOutcomeCompany(e.target.value)}
                  placeholder="e.g. Google, TechCorp, Microsoft"
                  className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  value={outcomeRole}
                  onChange={(e) => setOutcomeRole(e.target.value)}
                  placeholder="e.g. Software Development Engineer (SDE-1)"
                  className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Annual Compensation (LPA) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={outcomePackage}
                  onChange={(e) => setOutcomePackage(e.target.value)}
                  placeholder="e.g. 15.0"
                  className="w-full rounded-lg border border-[#E4E4E7] p-2 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                />
              </div>

              {outcomeFeedback && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  {outcomeFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(false)}
                  className="rounded-lg border border-[#E4E4E7] px-4 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingOutcome}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {recordingOutcome ? "Recording..." : "Save Placement Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DashboardFooter />
    </div>
  );
}
