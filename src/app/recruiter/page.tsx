"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function RecruiterWorkspace() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "jobs" | "post">("pipeline");

  // Pipeline stages conforming to PRD FR-REC-05
  const stages = ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"] as const;

  const [applicants, setApplicants] = useState([
    {
      id: "a1",
      name: "Ravi Chauhan",
      email: "ravi.chauhan@jcbust.ac.in",
      institution: "JCBUST, YMCA Faridabad",
      role: "Junior Full Stack Engineer",
      cgpa: 8.65,
      stage: "SHORTLISTED",
      matchScore: 75,
      matchedSkills: ["React", "TypeScript", "Node.js"],
      missingSkills: ["SQL & Databases"],
      notes: [
        { author: "Ananya Deshmukh", text: "Exceptional React assessment proof (100%) and clean project code on GitHub." },
      ],
    },
    {
      id: "a2",
      name: "Rohan Verma",
      email: "rohan.v@jcbust.ac.in",
      institution: "JCBUST, YMCA Faridabad",
      role: "Junior Full Stack Engineer",
      cgpa: 8.40,
      stage: "APPLIED",
      matchScore: 65,
      matchedSkills: ["Node.js", "SQL & Databases"],
      missingSkills: ["React"],
      notes: [],
    },
    {
      id: "a3",
      name: "Sneha Reddy",
      email: "sneha.r@jcbust.ac.in",
      institution: "JCBUST, YMCA Faridabad",
      role: "Junior Full Stack Engineer",
      cgpa: 8.90,
      stage: "INTERVIEW",
      matchScore: 90,
      matchedSkills: ["React", "TypeScript", "Node.js", "SQL & Databases"],
      missingSkills: [],
      notes: [
        { author: "Ananya Deshmukh", text: "Passed live technical evaluation with flying colors. Advancing to team fit." },
      ],
    },
  ]);

  const [selectedApplicant, setSelectedApplicant] = useState<(typeof applicants)[0] | null>(null);
  const [newNote, setNewNote] = useState("");

  const moveStage = (applicantId: string, newStage: string) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicantId ? { ...a, stage: newStage } : a))
    );
    if (selectedApplicant && selectedApplicant.id === applicantId) {
      setSelectedApplicant((prev) => prev ? { ...prev, stage: newStage } : null);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedApplicant) return;

    const noteObj = {
      author: "Ananya Deshmukh (You)",
      text: newNote,
    };

    setApplicants((prev) =>
      prev.map((a) =>
        a.id === selectedApplicant.id
          ? { ...a, notes: [...a.notes, noteObj] }
          : a
      )
    );

    setSelectedApplicant((prev) =>
      prev ? { ...prev, notes: [...prev.notes, noteObj] } : null
    );
    setNewNote("");
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Navbar currentRole="RECRUITER" onRoleSwitch={(r) => {
        if (r === "STUDENT") window.location.href = "/student";
        if (r === "COLLEGE_ADMIN") window.location.href = "/college";
        if (r === "SUPER_ADMIN") window.location.href = "/admin";
      }} />

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
                  <h1 className="text-xl font-bold text-[#18181B]">TechCorp Innovations</h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    Verified Employer
                  </span>
                </div>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Recruiter Workspace • High-Throughput Fintech Platform Team
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("post")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
              >
                <Plus className="h-4 w-4" />
                <span>Post New Role</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-t border-[#F4F4F5] mt-6 pt-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth ${
                activeTab === "pipeline"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Applicant Pipeline (Kanban)</span>
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth ${
                activeTab === "jobs"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>My Published Jobs (1)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: KANBAN PIPELINE */}
        {activeTab === "pipeline" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18181B]">
                  Hiring Pipeline — Junior Full Stack Engineer
                </h3>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Review applicant evidence, advance hiring stages, and record private notes.
                </p>
              </div>
              <span className="text-xs text-[#52525B]">
                Total Applicants: <strong className="text-[#18181B] font-mono">{applicants.length}</strong>
              </span>
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

                    <div className="space-y-2.5 flex-1">
                      {stageApplicants.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApplicant(app)}
                          className="rounded-lg border border-[#E4E4E7] bg-white p-3 shadow-subtle cursor-pointer hover:border-[#4F46E5] transition-smooth"
                        >
                          <div className="font-semibold text-xs text-[#18181B]">{app.name}</div>
                          <div className="text-[11px] text-[#71717A] mt-0.5">CGPA: {app.cgpa.toFixed(2)}</div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#4F46E5]">{app.matchScore}% match</span>
                            <span className="text-[10px] text-[#71717A]">
                              {app.notes.length} note(s)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MY JOBS */}
        {activeTab === "jobs" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
              Published Opportunities
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9]">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#18181B]">Junior Full Stack Engineer</h4>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      PUBLISHED
                    </span>
                  </div>
                  <p className="text-xs text-[#52525B] mt-0.5">
                    Bengaluru (Hybrid) • ₹10 – 14 LPA • Skills: React, TypeScript, Node.js, SQL
                  </p>
                  <p className="text-[11px] text-[#71717A] mt-1">
                    Eligibility: Minimum CGPA 7.0 • Batches: 2025, 2026
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-[#4F46E5] font-mono">{applicants.length}</div>
                  <span className="text-[11px] text-[#71717A]">Total Applicants</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* APPLICANT DETAIL MODAL WITH PRIVATE RECRUITER NOTES */}
        {selectedApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-2xl rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-lg font-bold text-[#18181B]">{selectedApplicant.name}</h3>
                  <p className="text-xs text-[#52525B] mt-0.5">
                    {selectedApplicant.institution} • CGPA {selectedApplicant.cgpa.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                >
                  ✕
                </button>
              </div>

              {/* Stage Progression Selector */}
              <div className="my-5 rounded-xl border border-[#E4E4E7] bg-[#FAFAF9] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#52525B]">Move Pipeline Stage:</span>
                <div className="flex flex-wrap gap-1.5">
                  {stages.map((stg) => (
                    <button
                      key={stg}
                      onClick={() => moveStage(selectedApplicant.id, stg)}
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

              {/* Skills Match Breakdown */}
              <div className="space-y-2 mb-6">
                <span className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                  Explainable Skills Match
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedApplicant.matchedSkills.map((sk) => (
                    <span key={sk} className="rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 border border-emerald-200">
                      ✓ {sk}
                    </span>
                  ))}
                  {selectedApplicant.missingSkills.map((sk) => (
                    <span key={sk} className="rounded-md bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 border border-amber-200">
                      ⚠ Missing: {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Private Recruiter Notes (FR-REC-06) */}
              <div className="space-y-3 pt-4 border-t border-[#E4E4E7]">
                <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#4F46E5]" />
                  Private Recruiter Notes (Internal only)
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedApplicant.notes.length === 0 ? (
                    <p className="text-xs text-[#71717A] italic">No private notes recorded yet.</p>
                  ) : (
                    selectedApplicant.notes.map((note, idx) => (
                      <div key={idx} className="rounded-lg bg-[#F4F4F5] p-3 text-xs">
                        <div className="font-semibold text-[#18181B] text-[11px]">{note.author}</div>
                        <p className="text-[#52525B] mt-0.5">{note.text}</p>
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
                    className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
      <DashboardFooter />
    </div>
  );
}
