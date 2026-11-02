"use client";

import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  Building,
  Briefcase,
  DollarSign,
  Activity,
  Search,
  Filter,
} from "lucide-react";

export default function SuperAdminWorkspace() {
  const [activeTab, setActiveTab] = useState<"verification" | "users" | "ai" | "audit">("verification");

  // Verification queue state
  const [pendingTenants, setPendingTenants] = useState([
    {
      id: "inst_new_1",
      type: "INSTITUTION",
      name: "Vellore Institute of Technology, Chennai",
      domain: "vit.ac.in",
      city: "Chennai",
      state: "Tamil Nadu",
      submittedAt: "Oct 31, 2026",
      status: "PENDING",
    },
    {
      id: "comp_new_1",
      type: "COMPANY",
      name: "FinStack Global Technologies",
      domain: "finstack.io",
      industry: "Cloud Banking",
      submittedAt: "Nov 01, 2026",
      status: "PENDING",
    },
  ]);

  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const handleVerify = (id: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectReason[id]?.trim()) {
      alert("A rejection reason is required.");
      return;
    }
    setPendingTenants((prev) => prev.filter((t) => t.id !== id));
    alert(`Tenant ${action === "APPROVE" ? "Approved" : "Rejected"} successfully! Audit log created.`);
  };

  // AI Usage Metrics
  const aiMetrics = {
    totalCalls: 342,
    totalTokens: "1.42M",
    totalCostUsd: "$0.497",
    breakdown: [
      { feature: "Resume Parsing & ATS Analysis", calls: 124, tokens: "620K", cost: "$0.217" },
      { feature: "8-Week Career Roadmap Generation", calls: 86, tokens: "430K", cost: "$0.150" },
      { feature: "Technical Interview Rubric Feedback", calls: 78, tokens: "234K", cost: "$0.081" },
      { feature: "Grounded AI Career Assistant", calls: 54, tokens: "135K", cost: "$0.047" },
    ],
  };

  // Audit Logs
  const auditLogs = [
    { id: "log1", action: "PUBLISH_DRIVE", actor: "Dr. Ramesh Sharma (College TPO)", resource: "PlacementDrive:TechCorp", timestamp: "Nov 02, 2026 22:45" },
    { id: "log2", action: "STAGE_CHANGE", actor: "Ananya Deshmukh (Recruiter)", resource: "Application:Aarav Patel -> SHORTLISTED", timestamp: "Nov 02, 2026 22:15" },
    { id: "log3", action: "TENANT_APPROVED", actor: "Super Admin", resource: "Institution:NIT Bangalore", timestamp: "Nov 01, 2026 14:10" },
    { id: "log4", action: "USER_REGISTER", actor: "Aarav Patel", resource: "User:Student", timestamp: "Nov 01, 2026 12:00" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Navbar currentRole="SUPER_ADMIN" onRoleSwitch={(r) => {
        if (r === "STUDENT") window.location.href = "/student";
        if (r === "COLLEGE_ADMIN") window.location.href = "/college";
        if (r === "RECRUITER") window.location.href = "/recruiter";
      }} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="mb-8 rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5] font-bold text-xl border border-indigo-100">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#18181B]">Global Platform Administration</h1>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-[#4F46E5] border border-indigo-200">
                  Root Governance
                </span>
              </div>
              <p className="text-xs text-[#52525B] mt-0.5">
                Tenant Verification Queue • Moderation • AI Token & Cost Control • System Audit Trail
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-t border-[#F4F4F5] mt-6 pt-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab("verification")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth ${
                activeTab === "verification"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Verification Queue ({pendingTenants.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth ${
                activeTab === "ai"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>AI Token & Cost Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth ${
                activeTab === "audit"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Security Audit Trail</span>
            </button>
          </div>
        </div>

        {/* TAB 1: VERIFICATION QUEUE */}
        {activeTab === "verification" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
                Pending Tenant Verifications (FR-ADM-01)
              </h3>
              <p className="text-xs text-[#52525B] mt-1 mb-6">
                Review submitted institution and company evidence before unlocking placement drives or student discovery.
              </p>

              {pendingTenants.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#71717A] italic">
                  Verification queue is completely clear. All submitted tenants have been reviewed.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTenants.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-[#E4E4E7] p-5 bg-[#FAFAF9] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-white border border-[#E4E4E7] px-2 py-0.5 text-[10px] font-bold text-[#52525B]">
                            {t.type}
                          </span>
                          <h4 className="text-sm font-bold text-[#18181B]">{t.name}</h4>
                        </div>
                        <p className="text-xs text-[#52525B] mt-1">Domain: {t.domain} • Submitted: {t.submittedAt}</p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <input
                          type="text"
                          placeholder="Rejection reason if denying..."
                          value={rejectReason[t.id] || ""}
                          onChange={(e) =>
                            setRejectReason((prev) => ({ ...prev, [t.id]: e.target.value }))
                          }
                          className="rounded-lg border border-[#E4E4E7] px-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                        />
                        <button
                          onClick={() => handleVerify(t.id, "REJECT")}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-smooth"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerify(t.id, "APPROVE")}
                          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-smooth"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI COST & TOKEN ANALYTICS */}
        {activeTab === "ai" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Total AI Generations</span>
                <div className="text-3xl font-extrabold text-[#18181B] mt-2 font-mono">{aiMetrics.totalCalls}</div>
                <p className="text-[11px] text-[#71717A] mt-1">100% structured schema compliance</p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Total Tokens Consumed</span>
                <div className="text-3xl font-extrabold text-[#4F46E5] mt-2 font-mono">{aiMetrics.totalTokens}</div>
                <p className="text-[11px] text-[#71717A] mt-1">Gemini 1.5 Flash Provider</p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Estimated AI Cost</span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">{aiMetrics.totalCostUsd}</div>
                <p className="text-[11px] text-[#71717A] mt-1">Well within monthly free tier bounds</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
                Feature Breakdown & Quotas
              </h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F4F5] text-[#52525B] font-semibold border-b border-[#E4E4E7]">
                    <tr>
                      <th className="py-3 px-4">Feature</th>
                      <th className="py-3 px-4">Invocations</th>
                      <th className="py-3 px-4">Tokens</th>
                      <th className="py-3 px-4">Estimated Cost</th>
                      <th className="py-3 px-4">Fallback Engine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]">
                    {aiMetrics.breakdown.map((b, idx) => (
                      <tr key={idx} className="hover:bg-[#FAFAF9]">
                        <td className="py-3 px-4 font-semibold text-[#18181B]">{b.feature}</td>
                        <td className="py-3 px-4 font-mono">{b.calls}</td>
                        <td className="py-3 px-4 font-mono">{b.tokens}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-700">{b.cost}</td>
                        <td className="py-3 px-4">
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                            Active (Deterministic)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === "audit" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
              Platform Audit Trail (FR-ADM-09)
            </h3>
            <p className="text-xs text-[#52525B] mt-1 mb-4">
              Cryptographically verified event logs of all security, stage change, and tenant administrative operations.
            </p>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-lg border border-[#E4E4E7] bg-[#FAFAF9] text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#4F46E5] font-mono mr-2">{log.action}</span>
                    <span className="text-[#18181B]">{log.resource}</span>
                    <div className="text-[11px] text-[#71717A] mt-0.5">Actor: {log.actor}</div>
                  </div>
                  <span className="text-[11px] font-mono text-[#71717A]">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
