"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import {
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Briefcase,
  Bot,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Send,
  HelpCircle,
  BarChart3,
  Calendar,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function StudentWorkspace() {
  const [activeTab, setActiveTab] = useState<
    "readiness" | "roadmap" | "assessment" | "resume" | "opportunities" | "interview" | "assistant"
  >("readiness");

  // Live state for student
  const [readinessScore, setReadinessScore] = useState(78);
  const [confidence, setConfidence] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [targetRole, setTargetRole] = useState("Full Stack Engineer");
  const [profileCompletion, setProfileCompletion] = useState(85);

  // Roadmap tasks state
  const [tasks, setTasks] = useState([
    { id: "t1", week: 1, title: "Deep Dive into React 19 Actions & Server Functions", category: "Official Documentation", minutes: 120, completed: true, notes: "Reviewed form actions and useActionState" },
    { id: "t2", week: 1, title: "Solve 3 Optimistic UI State Challenges", category: "Coding Practice", minutes: 180, completed: true, notes: "Implemented useOptimistic in shopping cart" },
    { id: "t3", week: 2, title: "PostgreSQL Advanced Indexing & Query Plans", category: "Official Documentation", minutes: 150, completed: false, notes: "" },
    { id: "t4", week: 2, title: "Build Redis Caching Layer for REST Endpoints", category: "Project Implementation", minutes: 240, completed: false, notes: "" },
    { id: "t5", week: 3, title: "System Design: Microservices Event Driven Architecture", category: "Architecture & System Design", minutes: 180, completed: false, notes: "" },
  ]);

  // Assessment simulator state
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [assessmentResult, setAssessmentResult] = useState<{ score: number; passed: boolean; correctCount: number } | null>(null);

  const sampleQuestions = [
    {
      id: "q1",
      question: "What is the primary purpose of the React `useEffect` dependency array?",
      options: [
        "To declare which state variables can be read inside the effect",
        "To specify which values the effect relies upon and trigger re-execution when they change",
        "To render JSX asynchronously in the background",
        "To prevent any component re-renders permanently",
      ],
      correctKey: 1,
      explanation: "React compares dependencies with their previous values using Object.is to trigger re-runs only when dependencies change.",
    },
    {
      id: "q2",
      question: "In React Server Components, what is true regarding client-side state hooks like `useState`?",
      options: [
        "Server Components can use useState if marked with async/await",
        "Server Components cannot use useState or client lifecycle hooks; they must be in Client Components with 'use client'",
        "useState is automatically replaced with useReducer on the server",
        "Server Components store state in server sessions across reloads",
      ],
      correctKey: 1,
      explanation: "Server components execute exclusively on the server and do not retain interactive state like useState.",
    },
    {
      id: "q3",
      question: "What is the core benefit of optimistic UI updates in interactive web applications?",
      options: [
        "It eliminates all backend database validation",
        "It provides immediate user feedback by rendering the expected state before the server confirms the mutation",
        "It automatically retries failed HTTP requests indefinitely",
        "It replaces the need for server-side error handling",
      ],
      correctKey: 1,
      explanation: "Optimistic UI immediately reflects user actions, creating a perceived instant response while reconciling in the background.",
    },
  ];

  // Resume analysis state
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeAtsScore, setResumeAtsScore] = useState(82);

  // Interview simulator state
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [evaluatingInterview, setEvaluatingInterview] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState<{
    score: number;
    positives: string[];
    missing: string[];
    advice: string;
  } | null>(null);

  // Assistant state
  const [assistantMessages, setAssistantMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "Hello Aarav! I'm your StepBridge Career Advisor. I see you're preparing for Full Stack Engineer roles with a 78% readiness score and strong React evidence. How can I guide your preparation today?",
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [quotaRemaining, setQuotaRemaining] = useState(13);

  // Application state
  const [applications, setApplications] = useState([
    {
      id: "app1",
      company: "TechCorp Innovations",
      role: "Junior Full Stack Engineer",
      salary: "10 - 14 LPA",
      type: "FULL_TIME",
      stage: "SHORTLISTED",
      appliedAt: "Oct 28, 2026",
      history: [
        { stage: "SHORTLISTED", date: "Nov 01, 2026", note: "Candidate selected for technical evaluation round." },
        { stage: "APPLIED", date: "Oct 28, 2026", note: "Application submitted with verified resume." },
      ],
    },
  ]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAssessmentSubmit = () => {
    let correct = 0;
    sampleQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctKey) correct++;
    });
    const score = Math.round((correct / sampleQuestions.length) * 100);
    setAssessmentResult({
      score,
      passed: score >= 70,
      correctCount: correct,
    });
    if (score >= 70) {
      setReadinessScore((prev) => Math.min(100, prev + 5));
    }
  };

  const handleEvaluateInterview = () => {
    if (!interviewAnswer.trim()) return;
    setEvaluatingInterview(true);
    setTimeout(() => {
      setInterviewFeedback({
        score: 85,
        positives: [
          "Accurately articulated the Node.js event loop and libuv thread pool distinction.",
          "Clearly identified non-blocking I/O benefits for high-concurrency systems.",
        ],
        missing: [
          "Could mention worker threads for CPU-intensive offloading.",
          "Give a concrete project example where you optimized an async bottleneck.",
        ],
        advice: "Great technical depth! Always anchor your conceptual answers with a 1-sentence real experience from your projects.",
      });
      setEvaluatingInterview(false);
    }, 1000);
  };

  const handleSendAssistant = () => {
    if (!inputMsg.trim() || quotaRemaining <= 0) return;
    const userText = inputMsg;
    setInputMsg("");
    setAssistantMessages((prev) => [...prev, { role: "user", text: userText }]);

    setTimeout(() => {
      setAssistantMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Based on your profile at NIT Bangalore (CGPA 8.65) and your target role of Full Stack Engineer:
          
To close your gap in **System Design and PostgreSQL Indexing**, focus on completing Milestone 2 in your roadmap this week. Also, you qualify for the upcoming TechCorp campus drive since your CGPA exceeds the 7.5 minimum cutoff!`,
        },
      ]);
      setQuotaRemaining((prev) => Math.max(0, prev - 1));
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Navbar currentRole="STUDENT" onRoleSwitch={(r) => {
        if (r === "COLLEGE_ADMIN") window.location.href = "/college";
        if (r === "RECRUITER") window.location.href = "/recruiter";
        if (r === "SUPER_ADMIN") window.location.href = "/admin";
      }} />

      {/* Main Content Shell */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Profile Header Banner */}
        <section className="mb-8 rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] font-bold text-xl border border-indigo-100">
                AP
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-[#18181B]">Aarav Patel</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Student
                  </span>
                </div>
                <p className="text-xs text-[#52525B] mt-0.5">
                  B.Tech Computer Science (2021–2025) • National Institute of Technology, Bangalore
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#71717A]">
                  <span>CGPA: <strong className="text-[#18181B]">8.65</strong> / 10.0</span>
                  <span>•</span>
                  <span>Target Role: <strong className="text-[#4F46E5] font-semibold">{targetRole}</strong></span>
                  <span>•</span>
                  <span>Visibility: <strong className="text-emerald-700">Recruiters & Campus Cell</strong></span>
                </div>
              </div>
            </div>

            {/* Profile Completeness Gauge */}
            <div className="flex flex-col md:items-end min-w-[200px]">
              <div className="flex items-center justify-between md:justify-end gap-2 w-full text-xs font-semibold">
                <span className="text-[#52525B]">Profile Completeness</span>
                <span className="text-[#4F46E5]">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-[#F4F4F5] h-2.5 rounded-full overflow-hidden mt-1.5 border border-[#E4E4E7]">
                <div
                  className="bg-[#4F46E5] h-full rounded-full transition-smooth"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <span className="text-[11px] text-[#71717A] mt-1">
                All core sections verified with assessment proof
              </span>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto border-t border-[#F4F4F5] mt-6 pt-4 text-xs font-medium scrollbar-none">
            {[
              { id: "readiness", label: "Readiness & Gaps", icon: TrendingUp },
              { id: "roadmap", label: "Action Roadmap", icon: Target },
              { id: "assessment", label: "Skill Assessments", icon: Award },
              { id: "resume", label: "Resume & ATS Analysis", icon: FileText },
              { id: "opportunities", label: "Jobs & Campus Drives", icon: Briefcase },
              { id: "interview", label: "Interview Practice", icon: HelpCircle },
              { id: "assistant", label: "AI Career Mentor", icon: Bot },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 transition-smooth ${
                    isActive
                      ? "bg-[#4F46E5] text-white shadow-subtle font-semibold"
                      : "text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* TAB 1: READINESS & SKILL GAPS */}
        {activeTab === "readiness" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Overall Role Readiness</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-[#18181B] font-mono">{readinessScore}%</span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Confidence: {confidence}
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-2">
                  Measured against verified assessments & projects (not hiring guarantee).
                </p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Verified Assessments</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-[#4F46E5] font-mono">100%</span>
                  <span className="text-xs text-[#71717A]">React Architecture</span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-2">Verified level 4 awarded based on score.</p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Project Evidence Score</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-teal-700 font-mono">80%</span>
                  <span className="text-xs text-[#71717A]">GitHub Verified</span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-2">Collaborative canvas app using WebSockets.</p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-subtle">
                <span className="text-xs font-medium text-[#52525B]">Active Drive Eligibility</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-emerald-700 font-mono">Eligible</span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-2">Meets CGPA (8.65 &gt;= 7.5) and batch rules.</p>
              </div>
            </div>

            {/* Skill Gaps Breakdown Table */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">
                    Skill Gap Analysis — {targetRole}
                  </h3>
                  <p className="text-xs text-[#52525B] mt-0.5">
                    Deterministic comparison between required role benchmarks and verified student evidence.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("roadmap")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                >
                  <span>Open Roadmap</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F4F5] text-[#52525B] font-semibold border-b border-[#E4E4E7]">
                    <tr>
                      <th className="py-3 px-4">Skill</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Required</th>
                      <th className="py-3 px-4">Current Evidence</th>
                      <th className="py-3 px-4">Evidence Source</th>
                      <th className="py-3 px-4">Gap</th>
                      <th className="py-3 px-4">Suggested Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7] text-[#18181B]">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-[#4F46E5]">React</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Frontend</td>
                      <td className="py-3.5 px-4 font-mono font-medium">Level 4</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">Level 4</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          Assessment Verified (100%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-semibold font-mono">0 (Proficient)</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Maintain through advanced practice.</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-[#4F46E5]">TypeScript</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Frontend</td>
                      <td className="py-3.5 px-4 font-mono font-medium">Level 4</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-700">Level 3</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                          Project Backed
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-amber-600 font-semibold font-mono">-1 Level</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Review generics & type narrowing patterns.</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-[#4F46E5]">Node.js & Express</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Backend</td>
                      <td className="py-3.5 px-4 font-mono font-medium">Level 4</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-700">Level 3</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                          Project Backed
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-amber-600 font-semibold font-mono">-1 Level</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Complete Milestone 1 Roadmap task.</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-[#4F46E5]">SQL & Database Design</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Backend</td>
                      <td className="py-3.5 px-4 font-mono font-medium">Level 4</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-amber-600">Level 2</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                          Self-Declared
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-red-600 font-semibold font-mono">-2 Levels</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Take the PostgreSQL assessment to establish proof.</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-[#4F46E5]">System Design</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Architecture</td>
                      <td className="py-3.5 px-4 font-mono font-medium">Level 3</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-red-600">Level 0</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
                          Missing Evidence
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-red-600 font-semibold font-mono">-3 Levels</td>
                      <td className="py-3.5 px-4 text-[#52525B]">Follow Roadmap Milestone 3 on distributed scaling.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIONABLE ROADMAP */}
        {activeTab === "roadmap" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#18181B]">8-Week Career Action Roadmap</h3>
                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-semibold text-[#4F46E5] border border-indigo-100">
                    Active Horizon
                  </span>
                </div>
                <p className="text-xs text-[#52525B] mt-0.5">
                  15 hours/week planned • Targeting Full Stack Engineer • Milestone-based tracking
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#52525B]">
                  Progress: <strong className="text-[#4F46E5]">{tasks.filter((t) => t.completed).length} / {tasks.length} tasks completed</strong>
                </span>
                <button
                  onClick={() => alert("Roadmap replanned with latest assessment deltas!")}
                  className="rounded-lg border border-[#E4E4E7] bg-white px-3 py-1.5 text-xs font-medium text-[#18181B] hover:bg-[#F4F4F5] transition-smooth"
                >
                  Replan Horizon
                </button>
              </div>
            </div>

            {/* Tasks list */}
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-4 rounded-xl border p-4.5 transition-smooth ${
                    task.completed
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-[#E4E4E7] bg-white shadow-subtle hover:border-[#4F46E5]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-smooth ${
                        task.completed
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-[#D4D4D8] bg-white hover:border-[#4F46E5]"
                      }`}
                      aria-label="Toggle task completion"
                    >
                      {task.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">
                          Week {task.week}
                        </span>
                        <span className="text-[11px] rounded bg-[#F4F4F5] px-2 py-0.5 text-[#52525B]">
                          {task.category}
                        </span>
                        <span className="text-[11px] text-[#71717A] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.minutes} mins
                        </span>
                      </div>
                      <h4
                        className={`text-sm font-semibold mt-1 ${
                          task.completed ? "text-[#52525B] line-through" : "text-[#18181B]"
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.notes && (
                        <p className="text-xs text-emerald-800 bg-emerald-100/60 rounded px-2 py-1 mt-1.5 font-mono text-[11px]">
                          Note: {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-[#52525B] whitespace-nowrap">
                    {task.completed ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SKILL ASSESSMENTS */}
        {activeTab === "assessment" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {!assessmentStarted && !assessmentResult ? (
              <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
                <div className="max-w-2xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
                    Standardized Assessment
                  </span>
                  <h3 className="text-lg font-bold text-[#18181B] mt-1">
                    React & Modern Architecture Assessment
                  </h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed">
                    Test your proficiency in React 18/19, state architecture, and rendering performance. Successful completion (score &gt;= 70%) elevates your verified skill level to Level 4 on your readiness profile.
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-[#71717A]">
                    <span>Duration: <strong>15 Minutes</strong></span>
                    <span>•</span>
                    <span>Questions: <strong>{sampleQuestions.length} Questions</strong></span>
                    <span>•</span>
                    <span>Cooldown: <strong>24 Hours</strong></span>
                  </div>
                  <button
                    onClick={() => setAssessmentStarted(true)}
                    className="mt-6 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
                  >
                    Start Assessment Attempt
                  </button>
                </div>
              </div>
            ) : assessmentStarted && !assessmentResult ? (
              <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle max-w-3xl mx-auto">
                <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7]">
                  <div>
                    <span className="text-xs font-medium text-[#52525B]">Question {currentQuestionIndex + 1} of {sampleQuestions.length}</span>
                    <h3 className="text-sm font-bold text-[#18181B] mt-0.5">
                      React & Modern Architecture
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                    <Clock className="h-3.5 w-3.5" />
                    <span>14:32 remaining</span>
                  </div>
                </div>

                <div className="my-6">
                  <h4 className="text-base font-semibold text-[#18181B]">
                    {sampleQuestions[currentQuestionIndex].question}
                  </h4>
                  <div className="space-y-2.5 mt-4">
                    {sampleQuestions[currentQuestionIndex].options.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        onClick={() => setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: oIdx }))}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-smooth ${
                          selectedAnswers[currentQuestionIndex] === oIdx
                            ? "border-[#4F46E5] bg-[#EEF2FF]/60 text-[#18181B]"
                            : "border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#52525B]"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${currentQuestionIndex}`}
                          checked={selectedAnswers[currentQuestionIndex] === oIdx}
                          onChange={() => {}}
                          className="mt-0.5 text-[#4F46E5] focus:ring-[#4F46E5]"
                        />
                        <span className="text-xs font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E7]">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((p) => p - 1)}
                    className="rounded-lg border border-[#E4E4E7] px-3.5 py-1.5 text-xs font-medium text-[#52525B] hover:bg-[#F4F4F5] disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {currentQuestionIndex < sampleQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((p) => p + 1)}
                      className="rounded-lg bg-[#4F46E5] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleAssessmentSubmit}
                      className="rounded-lg bg-emerald-600 px-5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-smooth"
                    >
                      Submit Assessment
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-subtle max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#18181B]">Assessment Completed & Graded</h3>
                    <p className="text-xs text-[#52525B]">Your verified evidence level has been updated.</p>
                  </div>
                </div>

                <div className="my-6 rounded-xl bg-emerald-50/70 p-4 border border-emerald-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-emerald-900">Score Achieved:</span>
                    <span className="text-2xl font-bold font-mono text-emerald-800">{assessmentResult?.score}%</span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    Correct: {assessmentResult?.correctCount} / {sampleQuestions.length} questions
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">Topic Review</h4>
                  {sampleQuestions.map((q, idx) => (
                    <div key={q.id} className="rounded-lg border border-[#E4E4E7] p-3 text-xs">
                      <div className="font-semibold text-[#18181B]">Q{idx + 1}: {q.question}</div>
                      <div className="mt-1 text-[#52525B]">Explanation: {q.explanation}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setAssessmentResult(null);
                    setAssessmentStarted(false);
                  }}
                  className="mt-6 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth"
                >
                  Return to Assessments
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RESUME & ATS ANALYSIS */}
        {activeTab === "resume" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">Resume & ATS Parser Engine</h3>
                  <p className="text-xs text-[#52525B] mt-0.5">
                    Private storage • Magic-byte validation • Section completeness & ATS hygiene feedback
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAnalyzingResume(true);
                    setTimeout(() => {
                      setAnalyzingResume(false);
                      setResumeAtsScore(88);
                      alert("Resume parsed successfully using Gemini & ATS rules engine!");
                    }, 1200);
                  }}
                  disabled={analyzingResume}
                  className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth"
                >
                  {analyzingResume ? "Analyzing Resume..." : "Re-Analyze Uploaded Resume"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="rounded-xl border border-[#E4E4E7] bg-[#FAFAF9] p-5">
                  <span className="text-xs font-semibold text-[#52525B]">ATS Hygiene Score</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-extrabold text-[#18181B] font-mono">{resumeAtsScore}/100</span>
                    <span className="text-xs font-bold text-emerald-700">Strong</span>
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-2">
                    Contact details, standard headings, and single-column formatting pass scan checks.
                  </p>
                </div>

                <div className="md:col-span-2 rounded-xl border border-[#E4E4E7] bg-white p-5">
                  <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                    ATS Hygiene Rule Checks
                  </h4>
                  <div className="space-y-2.5 mt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#18181B]">Contact Info (Email & Phone detected)</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#18181B]">Standard Sections (Education, Skills, Projects)</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#18181B]">Action Verbs & Measurable Metrics</span>
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Suggestion
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <h4 className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Prioritized Suggestions for {targetRole}
                </h4>
                <ul className="list-disc list-inside mt-2 text-xs text-[#52525B] space-y-1">
                  <li>Explicitly highlight your Redis and WebSocket experience at the top of your Projects section.</li>
                  <li>Include latency benchmarks or throughput numbers (e.g. &apos;sub-50ms message latency&apos;).</li>
                  <li>Ensure your GitHub repository links are active and include a README architecture overview.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: OPPORTUNITIES & APPLICATIONS */}
        {activeTab === "opportunities" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Campus Drives & Opportunities List */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7]">
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">Eligible Opportunities & Placement Drives</h3>
                  <p className="text-xs text-[#52525B] mt-0.5">
                    Direct server-evaluated eligibility based on your CGPA (8.65) and B.Tech CSE 2025 cohort.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  1 Open Opportunity
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/20 p-5 hover:border-[#4F46E5] transition-smooth">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
                          TechCorp Innovations
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Eligible
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#18181B] mt-1">
                        Junior Full Stack Engineer
                      </h4>
                      <p className="text-xs text-[#52525B] mt-1">
                        Bengaluru (Hybrid) • ₹10 – 14 LPA • Deadline: 30 days remaining
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="rounded bg-white px-2 py-0.5 text-xs text-[#18181B] border border-[#E4E4E7]">React</span>
                        <span className="rounded bg-white px-2 py-0.5 text-xs text-[#18181B] border border-[#E4E4E7]">TypeScript</span>
                        <span className="rounded bg-white px-2 py-0.5 text-xs text-[#18181B] border border-[#E4E4E7]">Node.js</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        Matches 3 of 4 required skills
                      </span>
                      <button
                        onClick={() => alert("Application submitted with immutable snapshot and resume!")}
                        className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] transition-smooth shadow-subtle"
                      >
                        Apply with Resume Snapshot
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Active Applications Tracker */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle">
              <h3 className="text-base font-bold text-[#18181B] pb-4 border-b border-[#E4E4E7]">
                My Applications & Stage Timelines
              </h3>
              <div className="mt-4 space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="rounded-xl border border-[#E4E4E7] p-4.5 bg-[#FAFAF9]">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#18181B]">{app.role}</h4>
                        <p className="text-xs text-[#52525B]">{app.company} • {app.salary}</p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-[#4F46E5] border border-indigo-200">
                        Stage: {app.stage}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t border-[#E4E4E7]/60 space-y-2">
                      {app.history.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-2.5 text-xs">
                          <span className="h-2 w-2 rounded-full bg-[#4F46E5] mt-1" />
                          <div>
                            <span className="font-semibold text-[#18181B]">{h.stage}</span>
                            <span className="text-[11px] text-[#71717A] ml-2">{h.date}</span>
                            <p className="text-[#52525B] mt-0.5">{h.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INTERVIEW PRACTICE */}
        {activeTab === "interview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-subtle max-w-3xl mx-auto">
              <div className="pb-4 border-b border-[#E4E4E7]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
                  Role-Specific Interview Simulator
                </span>
                <h3 className="text-base font-bold text-[#18181B] mt-1">
                  Node.js Concurrency & Event Loop Architecture
                </h3>
                <p className="text-xs text-[#52525B] mt-1">
                  Topic: Backend Systems • Difficulty: Intermediate
                </p>
              </div>

              <div className="my-5">
                <h4 className="text-sm font-semibold text-[#18181B]">
                  Question: How does asynchronous execution work in the Node.js event loop, and what happens when CPU-bound computation blocks the main thread?
                </h4>
                <textarea
                  rows={5}
                  value={interviewAnswer}
                  onChange={(e) => setInterviewAnswer(e.target.value)}
                  placeholder="Type your explanation here. Touch upon the libuv thread pool, microtasks, timers, and non-blocking I/O..."
                  className="w-full rounded-xl border border-[#E4E4E7] p-3.5 text-xs text-[#18181B] mt-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleEvaluateInterview}
                  disabled={evaluatingInterview || !interviewAnswer.trim()}
                  className="rounded-lg bg-[#4F46E5] px-5 py-2 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth"
                >
                  {evaluatingInterview ? "Evaluating Answer..." : "Submit for Feedback"}
                </button>
              </div>

              {interviewFeedback && (
                <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-200/50">
                    <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
                      Evaluation Rubric Feedback
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700 font-mono">
                      Score: {interviewFeedback.score}/100
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <strong className="text-emerald-800">What went well:</strong>
                      <ul className="list-disc list-inside text-[#52525B] mt-1 space-y-0.5">
                        {interviewFeedback.positives.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <strong className="text-amber-800">Key concepts to incorporate:</strong>
                      <ul className="list-disc list-inside text-[#52525B] mt-1 space-y-0.5">
                        {interviewFeedback.missing.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <p className="pt-2 text-xs text-[#4F46E5] font-medium border-t border-indigo-200/50 mt-2">
                      Mentor Advice: {interviewFeedback.advice}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: GROUNDED AI CAREER ASSISTANT */}
        {activeTab === "assistant" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-[#E4E4E7] bg-white shadow-subtle max-w-3xl mx-auto overflow-hidden flex flex-col h-[600px]">
              {/* Header */}
              <div className="p-4 border-b border-[#E4E4E7] bg-[#FAFAF9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5] text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#18181B]">Grounded Career Advisor</h3>
                    <p className="text-[11px] text-[#52525B]">Aware of your profile, target role & active gaps</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#52525B]">
                  <span>Quota: <strong>{quotaRemaining} / 15 remaining</strong></span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {assistantMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#4F46E5] text-white rounded-br-none"
                          : "bg-[#F4F4F5] text-[#18181B] rounded-bl-none border border-[#E4E4E7] whitespace-pre-line"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Box */}
              <div className="p-3 border-t border-[#E4E4E7] bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendAssistant()}
                  placeholder="Ask for advice on skill gaps, interview answers, or campus drives..."
                  className="flex-1 rounded-lg border border-[#E4E4E7] px-3.5 py-2 text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-smooth"
                />
                <button
                  onClick={handleSendAssistant}
                  disabled={!inputMsg.trim() || quotaRemaining <= 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50 transition-smooth"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
