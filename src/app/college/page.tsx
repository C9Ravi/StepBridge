"use client";

import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import {
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Download,
  Plus,
  CheckCircle,
  Filter,
  Search,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function CollegeWorkspace() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "students" | "drives" | "batches">("dashboard");

  // Drive builder state
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [packageLpa, setPackageLpa] = useState("12.0");
  const [minCgpa, setMinCgpa] = useState(7.5);
  const [allowedBranches, setAllowedBranches] = useState<string[]>(["CSE", "ECE"]);
  const [driveCreated, setDriveCreated] = useState(false);

  // Mocked interactive state based on seed
  const cohortMetrics = {
    institutionName: "National Institute of Technology, Bangalore",
    totalStudents: 142,
    readyCount: 58,
    nearingCount: 64,
    needsPrepCount: 20,
    averageReadiness: 72,
    activeDrives: 2,
  };

  const students = [
    { id: "s1", name: "Aarav Patel", email: "aarav.patel@nitb.ac.in", batch: "B.Tech CSE 2025", cgpa: 8.65, readiness: 78, status: "Ready", goal: "Full Stack Engineer" },
    { id: "s2", name: "Rohan Verma", email: "rohan.v@nitb.ac.in", batch: "B.Tech CSE 2025", cgpa: 8.40, readiness: 74, status: "Nearing", goal: "Backend Engineer" },
    { id: "s3", name: "Pooja Hegde", email: "pooja.h@nitb.ac.in", batch: "B.Tech ECE 2026", cgpa: 7.90, readiness: 68, status: "Nearing", goal: "DevOps Engineer" },
    { id: "s4", name: "Kavya Nair", email: "kavya.n@nitb.ac.in", batch: "B.Tech CSE 2025", cgpa: 7.10, readiness: 45, status: "Needs Prep", goal: "Frontend Engineer" },
  ];

  const attentionList = [
    { name: "Kavya Nair", reason: "Incomplete profile (45% completed). Missing key project evidence.", batch: "CSE 2025" },
    { name: "Nikhil Joshi", reason: "Zero verified assessments completed before upcoming TechCorp drive.", batch: "CSE 2025" },
    { name: "Divya Rao", reason: "Low readiness score (42%) for targeted Data Analyst role.", batch: "ECE 2025" },
  ];

  const skillGaps = [
    { skill: "System Design & Distributed Scalability", gap: "-2.4 Levels", count: 86 },
    { skill: "PostgreSQL Schema & Index Optimization", gap: "-1.8 Levels", count: 72 },
    { skill: "Docker & Container Orchestration", gap: "-1.5 Levels", count: 54 },
    { skill: "React 19 Advanced Performance", gap: "-0.8 Levels", count: 32 },
  ];

  const [drives, setDrives] = useState([
    {
      id: "d1",
      company: "TechCorp Innovations",
      role: "Campus Associate Software Engineer",
      package: "₹12.5 LPA",
      date: "Nov 16, 2026",
      status: "PUBLISHED",
      registeredCount: 38,
      minCgpa: 7.5,
      branches: "CSE, ECE",
    },
  ]);

  const previewEligibleCount = () => {
    return students.filter((s) => s.cgpa >= minCgpa).length;
  };

  const handleCreateDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !roleTitle) return;

    setDrives((prev) => [
      ...prev,
      {
        id: `d_${Date.now()}`,
        company: companyName,
        role: roleTitle,
        package: `₹${packageLpa} LPA`,
        date: "Dec 05, 2026",
        status: "PUBLISHED",
        registeredCount: 0,
        minCgpa,
        branches: allowedBranches.join(", "),
      },
    ]);
    setDriveCreated(true);
    setTimeout(() => {
      setDriveCreated(false);
      setCompanyName("");
      setRoleTitle("");
      setActiveTab("drives");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Navbar currentRole="COLLEGE_ADMIN" onRoleSwitch={(r) => {
        if (r === "STUDENT") window.location.href = "/student";
        if (r === "RECRUITER") window.location.href = "/recruiter";
        if (r === "SUPER_ADMIN") window.location.href = "/admin";
      }} />

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
                  <h1 className="text-xl font-bold text-[#18181B]">{cohortMetrics.institutionName}</h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    Verified Campus
                  </span>
                </div>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Training & Placement Cell • Placement Season 2025–2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/api/v1/college/reports/export"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
              >
                <Download className="h-4 w-4" />
                <span>Export Cohort CSV</span>
              </a>
              <button
                onClick={() => setActiveTab("drives")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
              >
                <Plus className="h-4 w-4" />
                <span>Create Campus Drive</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-t border-[#F4F4F5] mt-6 pt-4 text-xs font-medium">
            {[
              { id: "dashboard", label: "Cohort Readiness Analytics", icon: TrendingUp },
              { id: "students", label: "Student Directory", icon: Users },
              { id: "drives", label: "Placement Drives & Funnel", icon: Briefcase },
              { id: "batches", label: "Departments & Batches", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth ${
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
                <p className="text-[11px] text-[#71717A] mt-1">Across CSE, IT, and ECE batches</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-emerald-800">Placement-Ready (&gt;= 75%)</span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">{cohortMetrics.readyCount}</div>
                <p className="text-[11px] text-emerald-700 mt-1">Passed standardized role assessments</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-amber-800">Nearing Readiness (55–74%)</span>
                <div className="text-3xl font-extrabold text-amber-700 mt-2 font-mono">{cohortMetrics.nearingCount}</div>
                <p className="text-[11px] text-amber-700 mt-1">Actively working through roadmaps</p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50/40 p-5 shadow-subtle">
                <span className="text-xs font-semibold text-red-800">Needs Attention (&lt; 55%)</span>
                <div className="text-3xl font-extrabold text-red-700 mt-2 font-mono">{cohortMetrics.needsPrepCount}</div>
                <p className="text-[11px] text-red-700 mt-1">Flagged for targeted remedial prep</p>
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
                  Aggregated competency gaps across students targeting Software & Systems roles.
                </p>

                <div className="space-y-3">
                  {skillGaps.map((sg, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAF9]">
                      <div>
                        <div className="text-xs font-semibold text-[#18181B]">{sg.skill}</div>
                        <span className="text-[11px] text-[#71717A]">{sg.count} students needing intervention</span>
                      </div>
                      <span className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-700 font-mono border border-red-200">
                        {sg.gap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Students Needing Attention */}
              <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
                <h3 className="text-sm font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Students Needing Attention</span>
                </h3>
                <p className="text-xs text-[#52525B] mt-1 mb-4">
                  Deterministic alerts based on incomplete profile benchmarks or zero assessment evidence.
                </p>

                <div className="space-y-3">
                  {attentionList.map((st, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#18181B]">{st.name}</span>
                        <span className="text-[11px] rounded bg-white px-2 py-0.5 font-medium text-[#52525B] border border-amber-200">
                          {st.batch}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] mt-1">{st.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT DIRECTORY */}
        {activeTab === "students" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">Campus Student Directory</h3>
                <p className="text-xs text-[#52525B] mt-0.5">Strictly scoped to {cohortMetrics.institutionName} students.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#71717A]" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="rounded-lg border border-[#E4E4E7] pl-8 pr-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] text-[#52525B] font-semibold border-b border-[#E4E4E7]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Batch / Branch</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Primary Goal</th>
                    <th className="py-3 px-4">Readiness</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] text-[#18181B]">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAFAF9] transition-smooth">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-[11px] text-[#71717A]">{s.email}</div>
                      </td>
                      <td className="py-3 px-4 text-[#52525B]">{s.batch}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{s.cgpa.toFixed(2)}</td>
                      <td className="py-3 px-4 text-[#4F46E5] font-medium">{s.goal}</td>
                      <td className="py-3 px-4 font-mono font-bold">{s.readiness}%</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            s.status === "Ready"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : s.status === "Nearing"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => alert(`Opening verified evidence portfolio for ${s.name}...`)}
                          className="text-xs text-[#4F46E5] hover:underline font-semibold"
                        >
                          View Evidence
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLACEMENT DRIVES */}
        {activeTab === "drives" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Create Drive Form */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
                Drive Builder & Eligibility Engine
              </h3>
              <p className="text-xs text-[#52525B] mt-1 mb-6">
                Define criteria rules. StepBridge computes the exact eligible student count and previews exclusions before publishing.
              </p>

              <form onSubmit={handleCreateDrive} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Company Name</label>
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
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Role Title</label>
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
                    type="text"
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

                {/* Real-time Eligible Count Preview (PRD FR-COL-08) */}
                <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-[#EEF2FF]/60 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
                      Real-Time Eligibility Preview
                    </span>
                    <div className="text-sm font-semibold text-[#18181B] mt-0.5">
                      <strong>{previewEligibleCount()} of {students.length} students</strong> currently meet this CGPA cutoff ({minCgpa}).
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#4F46E5] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
                  >
                    Publish Drive & Alert Students
                  </button>
                </div>
              </form>

              {driveCreated && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold animate-in fade-in">
                  ✓ Placement Drive successfully created and published! Eligible students have been notified.
                </div>
              )}
            </div>

            {/* Published Drives List */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
                Active Placement Drives
              </h3>
              <div className="mt-4 space-y-3">
                {drives.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#18181B]">{d.company}</h4>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          {d.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] mt-0.5">{d.role} • Package: {d.package}</p>
                      <div className="text-[11px] text-[#71717A] mt-1">
                        Criteria: Min CGPA {d.minCgpa} • Branches: {d.branches}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-[#4F46E5] font-mono">{d.registeredCount}</div>
                      <span className="text-[11px] text-[#71717A]">Registered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BATCHES */}
        {activeTab === "batches" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
              Departments & Batches Management
            </h3>
            <p className="text-xs text-[#52525B] mt-1 mb-6">
              Organized academic cohorts for NIT Bangalore with graduation years and batch codes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E4E4E7] p-4 bg-[#FAFAF9]">
                <h4 className="text-sm font-bold text-[#18181B]">Computer Science & Engineering (CSE)</h4>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#E4E4E7]/60">
                    <span className="text-[#52525B]">B.Tech CSE Class of 2025</span>
                    <strong className="text-[#18181B]">78 Students</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#52525B]">B.Tech CSE Class of 2026</span>
                    <strong className="text-[#18181B]">64 Students</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] p-4 bg-[#FAFAF9]">
                <h4 className="text-sm font-bold text-[#18181B]">Electronics & Communication (ECE)</h4>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#E4E4E7]/60">
                    <span className="text-[#52525B]">B.Tech ECE Class of 2025</span>
                    <strong className="text-[#18181B]">45 Students</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#52525B]">B.Tech ECE Class of 2026</span>
                    <strong className="text-[#18181B]">50 Students</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
