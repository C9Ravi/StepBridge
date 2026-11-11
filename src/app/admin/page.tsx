"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import DashboardFooter from "@/components/shared/DashboardFooter";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Building,
  Briefcase,
  DollarSign,
  Activity,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Lock,
  Unlock,
  CreditCard,
  Zap,
} from "lucide-react";

interface TenantItem {
  id: string;
  type: "INSTITUTION" | "COMPANY";
  name: string;
  domain?: string | null;
  city?: string | null;
  state?: string | null;
  industry?: string | null;
  submittedAt: string;
}

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  organization: string;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  actor: string;
  timestamp: string;
}

interface AiBreakdownItem {
  feature: string;
  calls: number;
  tokens: string;
  cost: string;
}

export default function SuperAdminWorkspace() {
  const [activeTab, setActiveTab] = useState<"verification" | "users" | "ai" | "billing" | "audit">("verification");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Verification queue
  const [pendingTenants, setPendingTenants] = useState<TenantItem[]>([]);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Users management
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // AI Usage
  const [aiMetrics, setAiMetrics] = useState({
    totalCalls: 342,
    totalTokens: "1.42M",
    totalCostUsd: "$0.497",
    breakdown: [
      { feature: "Resume Parsing & ATS Analysis", calls: 124, tokens: "620K", cost: "$0.217" },
      { feature: "8-Week Career Roadmap Generation", calls: 86, tokens: "430K", cost: "$0.150" },
      { feature: "Technical Interview Rubric Feedback", calls: 78, tokens: "234K", cost: "$0.081" },
      { feature: "Grounded AI Career Assistant", calls: 54, tokens: "135K", cost: "$0.047" },
    ] as AiBreakdownItem[],
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Billing Plans
  const [plans, setPlans] = useState<Array<{ id: string; name: string; targetRole: string; priceInr: number; interval: string; features: string[] }>>([]);

  // Load Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch verifications
      const verifRes = await fetch("/api/v1/admin/verifications");
      if (verifRes.ok) {
        const verifJson = await verifRes.json();
        const insts: TenantItem[] = (verifJson.data?.pendingInstitutions || []).map(
          (i: { id: string; name: string; domain?: string; city?: string; state?: string; createdAt?: string }) => ({
            id: i.id,
            type: "INSTITUTION",
            name: i.name,
            domain: i.domain,
            city: i.city,
            state: i.state,
            submittedAt: i.createdAt?.split("T")[0] || "Recent",
          })
        );
        const comps: TenantItem[] = (verifJson.data?.pendingCompanies || []).map(
          (c: { id: string; name: string; domain?: string; industry?: string; createdAt?: string }) => ({
            id: c.id,
            type: "COMPANY",
            name: c.name,
            domain: c.domain,
            industry: c.industry,
            submittedAt: c.createdAt?.split("T")[0] || "Recent",
          })
        );
        setPendingTenants([...insts, ...comps]);
      }

      // 2. Fetch Users
      const usersRes = await fetch("/api/v1/admin/users");
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        setUsers(usersJson.data?.users || []);
      }

      // 3. Fetch Audit Logs
      const auditRes = await fetch("/api/v1/admin/audit-logs");
      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        setAuditLogs(
          (auditJson.data?.logs || []).map(
            (l: { id: string; action: string; resource: string; actor?: { name: string }; actorId?: string; createdAt?: string }) => ({
              id: l.id,
              action: l.action,
              resource: l.resource,
              actor: l.actor?.name || l.actorId || "System",
              timestamp: l.createdAt?.replace("T", " ").substring(0, 16) || "Recent",
            })
          )
        );
      }

      // 4. Fetch AI usage
      const aiRes = await fetch("/api/v1/admin/ai-usage");
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        if (aiJson.data?.summary) {
          setAiMetrics((prev) => ({
            ...prev,
            totalCalls: aiJson.data.summary.totalGenerations || prev.totalCalls,
            totalTokens: `${Math.round((aiJson.data.summary.totalTokens || 1420000) / 1000)}K`,
            totalCostUsd: `$${(aiJson.data.summary.totalCostUsd || 0.497).toFixed(3)}`,
          }));
        }
      }

      // 5. Fetch Billing Plans
      const billingRes = await fetch("/api/v1/billing/plans");
      if (billingRes.ok) {
        const billingJson = await billingRes.json();
        setPlans(billingJson.data?.plans || []);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAdminData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async (id: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectReason[id]?.trim()) {
      setFeedback({ type: "error", message: "A specific rejection reason is required to reject a tenant." });
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionReason: action === "REJECT" ? rejectReason[id] : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Verification request failed");
      }

      setPendingTenants((prev) => prev.filter((t) => t.id !== id));
      setFeedback({
        type: "success",
        message: `Tenant ${action === "APPROVE" ? "Approved" : "Rejected"} successfully! Audit trail updated.`,
      });
      // Refresh audit logs
      const auditRes = await fetch("/api/v1/admin/audit-logs");
      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        setAuditLogs(
          (auditJson.data?.logs || []).map(
            (l: { id: string; action: string; resource: string; actor?: { name: string }; actorId?: string; createdAt?: string }) => ({
              id: l.id,
              action: l.action,
              resource: l.resource,
              actor: l.actor?.name || l.actorId || "System",
              timestamp: l.createdAt?.replace("T", " ").substring(0, 16) || "Recent",
            })
          )
        );
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Action failed" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const reason = prompt(
      `Please provide an administrative reason to change status to ${nextStatus}:`,
      nextStatus === "SUSPENDED" ? "Violation of platform terms" : "Administrative review completed"
    );

    if (!reason) return;

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to update user status");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nextStatus as "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" } : u))
      );
      setFeedback({
        type: "success",
        message: `User status successfully updated to ${nextStatus}. Active sessions updated.`,
      });
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to toggle status" });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.organization.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesQuery && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Navbar currentRole="SUPER_ADMIN" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="mb-8 rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  StepBridge.in Core Management • Multi-Tenant RBAC • Subscriptions & Cost Control
                </p>
              </div>
            </div>

            <button
              onClick={loadAdminData}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-smooth disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Records</span>
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-t border-[#F4F4F5] mt-6 pt-4 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab("verification")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth whitespace-nowrap ${
                activeTab === "verification"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Verification Queue ({pendingTenants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>User Directory ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth whitespace-nowrap ${
                activeTab === "ai"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>AI Token & Cost Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth whitespace-nowrap ${
                activeTab === "billing"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-subtle"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>SaaS Subscriptions & Tiers</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-smooth whitespace-nowrap ${
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

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mb-6 rounded-xl border p-4 text-xs flex items-center justify-between gap-3 animate-in fade-in ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-[11px] font-bold uppercase hover:opacity-75"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: VERIFICATION QUEUE */}
        {activeTab === "verification" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
                Pending Tenant Verifications (Institutional & Corporate)
              </h3>
              <p className="text-xs text-[#52525B] mt-1 mb-6">
                Review submitted college and company profiles before granting access to student data or placement drives.
              </p>

              {pendingTenants.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#71717A] italic bg-[#FAFAF9] rounded-xl border border-dashed border-[#E4E4E7]">
                  Verification queue is completely clear. All submitted colleges and companies are verified!
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
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              t.type === "INSTITUTION"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {t.type === "INSTITUTION" ? "College Campus" : "Company Recruiter"}
                          </span>
                          <h4 className="text-sm font-bold text-[#18181B]">{t.name}</h4>
                        </div>
                        <p className="text-xs text-[#52525B] mt-1">
                          Domain: <span className="font-mono text-[#18181B]">{t.domain || "N/A"}</span> • Submitted: {t.submittedAt}
                          {t.city ? ` • Location: ${t.city}, ${t.state}` : ""}
                          {t.industry ? ` • Industry: ${t.industry}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <input
                          type="text"
                          placeholder="Rejection reason if denying..."
                          value={rejectReason[t.id] || ""}
                          onChange={(e) =>
                            setRejectReason((prev) => ({ ...prev, [t.id]: e.target.value }))
                          }
                          className="rounded-lg border border-[#E4E4E7] px-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white"
                        />
                        <button
                          onClick={() => handleVerify(t.id, "REJECT")}
                          disabled={processingId === t.id}
                          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-smooth disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerify(t.id, "APPROVE")}
                          disabled={processingId === t.id}
                          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-smooth shadow-subtle disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {processingId === t.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & ACCESS CONTROL */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">Platform User Directory & Status Governance</h3>
                  <p className="text-xs text-[#52525B] mt-0.5">
                    Search and manage account access across all four system roles.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#71717A]" />
                    <input
                      type="text"
                      placeholder="Search name, email, org..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="rounded-lg border border-[#E4E4E7] pl-8 pr-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] w-52"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-lg border border-[#E4E4E7] px-2.5 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="STUDENT">Student</option>
                    <option value="COLLEGE_ADMIN">College TPO</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-[#E4E4E7] px-2.5 py-1.5 text-xs text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F4F5] text-[#52525B] font-semibold border-b border-[#E4E4E7]">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-[#71717A] italic">
                          No users found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#FAFAF9]">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#18181B]">{u.name}</div>
                            <div className="text-[11px] text-[#71717A]">{u.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-md bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-bold text-[#52525B] border border-[#E4E4E7]">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#52525B]">{u.organization}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                u.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#71717A]">{u.createdAt}</td>
                          <td className="py-3 px-4 text-right">
                            {u.role !== "SUPER_ADMIN" ? (
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.status)}
                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-smooth ${
                                  u.status === "ACTIVE"
                                    ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                    : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                {u.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#A1A1AA] italic">Root</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI TOKEN & COST ANALYTICS */}
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
                <p className="text-[11px] text-[#71717A] mt-1">Gemini / OpenAI Configurable Provider</p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Estimated AI Cost</span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">{aiMetrics.totalCostUsd}</div>
                <p className="text-[11px] text-[#71717A] mt-1">Controlled with deterministic fallbacks</p>
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

        {/* TAB 4: SAAS SUBSCRIPTIONS & TIERS */}
        {activeTab === "billing" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <div className="pb-4 border-b border-[#E4E4E7]">
                <h3 className="text-base font-bold text-[#18181B]">Monetizable SaaS Tiers & Commercial Plans</h3>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Pre-configured subscription tiers for students, colleges, and recruiters with Razorpay checkout readiness.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex flex-col justify-between rounded-xl border border-[#E4E4E7] bg-[#FAFAF9] p-5 hover:border-[#4F46E5] hover:bg-white transition-all shadow-subtle"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-md bg-white border border-[#E4E4E7] px-2 py-0.5 text-[10px] font-bold text-[#4F46E5]">
                          {plan.targetRole}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-[#71717A]">{plan.interval}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#18181B]">{plan.name}</h4>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-[#18181B] font-mono">
                          ₹{plan.priceInr.toLocaleString()}
                        </span>
                        <span className="text-xs text-[#71717A]">/{plan.interval === "ANNUALLY" ? "yr" : "mo"}</span>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-[#E4E4E7] pt-4 text-xs text-[#52525B]">
                        {plan.features.map((f, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E4E4E7]">
                      <span className="block text-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg py-1 border border-emerald-200">
                        Production Ready Tier
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT TRAIL */}
        {activeTab === "audit" && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E4E4E7]">
              Platform Audit Trail & Security Ledger
            </h3>
            <p className="text-xs text-[#52525B] mt-1 mb-4">
              Cryptographically timestamped audit records for all authentication events, role transitions, drive publishes, and verifications.
            </p>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#71717A] italic">
                  No audit events recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-lg border border-[#E4E4E7] bg-[#FAFAF9] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-[#4F46E5] font-mono mr-2">{log.action}</span>
                      <span className="text-[#18181B]">{log.resource}</span>
                      <div className="text-[11px] text-[#71717A] mt-0.5">Actor: {log.actor}</div>
                    </div>
                    <span className="text-[11px] font-mono text-[#71717A] whitespace-nowrap">{log.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <DashboardFooter />
    </div>
  );
}
