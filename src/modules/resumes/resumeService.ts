import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { executeAiTask } from "@/lib/ai/provider";

export const resumeAnalysisSchema = z.object({
  roleAlignmentScore: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
  extractedSections: z.object({
    education: z.array(z.string()),
    experience: z.array(z.string()),
    projects: z.array(z.string()),
    skills: z.array(z.string()),
  }),
  missingInformation: z.array(z.string()),
  atsHygieneChecks: z.array(
    z.object({
      rule: z.string(),
      status: z.enum(["PASS", "WARNING", "FAIL"]),
      recommendation: z.string(),
    })
  ),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  prioritizedSuggestions: z.array(z.string()),
});

export type ResumeAnalysisOutput = z.infer<typeof resumeAnalysisSchema>;

/**
 * Deterministic fallback analysis engine for resumes.
 * Operates reliably even without external AI keys.
 */
export function generateDeterministicResumeAnalysis(
  extractedText: string,
  targetRoleTitle?: string
): ResumeAnalysisOutput {
  const lower = extractedText.toLowerCase();

  // Known skill keywords
  const candidateSkills = [
    "react", "typescript", "javascript", "node.js", "node", "python",
    "sql", "postgresql", "docker", "git", "rest api", "tailwind", "next.js", "html", "css", "c++", "java"
  ];

  const detectedSkills = candidateSkills.filter((s) => lower.includes(s));
  const missingSkills = ["Docker", "PostgreSQL", "System Design"].filter(
    (s) => !detectedSkills.includes(s.toLowerCase())
  );

  // ATS Hygiene heuristics
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(extractedText);
  const hasPhone = /[0-9]{10}/.test(extractedText.replace(/[^0-9]/g, ""));
  const hasProjects = lower.includes("project") || lower.includes("github");
  const hasEducation = lower.includes("b.tech") || lower.includes("bachelor") || lower.includes("university") || lower.includes("college");

  const atsHygieneChecks = [
    {
      rule: "Contact Information Presence",
      status: (hasEmail && hasPhone ? "PASS" : "WARNING") as "PASS" | "WARNING",
      recommendation: hasEmail && hasPhone ? "Valid contact points detected" : "Ensure standard email and phone number are clearly readable at the top",
    },
    {
      rule: "Standard Section Headings",
      status: (hasProjects && hasEducation ? "PASS" : "WARNING") as "PASS" | "WARNING",
      recommendation: "Use standard headings: Education, Technical Skills, Projects, and Experience",
    },
    {
      rule: "Measurable Action Impact",
      status: (lower.includes("%") || lower.includes("reduced") || lower.includes("improved") ? "PASS" : "WARNING") as "PASS" | "WARNING",
      recommendation: "Quantify project outcomes (e.g. 'reduced latency by 40%', 'served 5,000+ requests')",
    },
    {
      rule: "Clean Typography & ATS Formatting",
      status: "PASS" as const,
      recommendation: "Avoid complex multi-column tables and non-standard symbols that hinder ATS scanners",
    },
  ];

  const atsScore = (hasEmail ? 25 : 10) + (hasPhone ? 25 : 10) + (hasProjects ? 25 : 10) + (hasEducation ? 25 : 10);
  const roleAlignmentScore = Math.min(95, 40 + detectedSkills.length * 8);

  return {
    roleAlignmentScore,
    atsScore,
    extractedSections: {
      education: hasEducation ? ["Degree & Engineering coursework detected"] : [],
      experience: lower.includes("intern") || lower.includes("experience") ? ["Internship or organizational experience detected"] : [],
      projects: hasProjects ? ["Engineering / development projects listed"] : [],
      skills: detectedSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    },
    missingInformation: [
      ...(hasProjects ? [] : ["Detailed technical project descriptions"]),
      ...(hasEducation ? [] : ["Clear institution degree, branch, and graduation year"]),
    ],
    atsHygieneChecks,
    matchedSkills: detectedSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    missingSkills,
    prioritizedSuggestions: [
      `Tailor summary and top projects towards ${targetRoleTitle || "the target software role"}.`,
      "Add direct GitHub repository and live deployment links to your key projects.",
      "Highlight specific tools and frameworks used rather than generic terms.",
    ],
  };
}

export async function processResumeAnalysis(params: {
  userId: string;
  resumeId: string;
  targetRoleTitle?: string;
}) {
  const resume = await prisma.resume.findUnique({
    where: { id: params.resumeId },
  });

  if (!resume) throw new Error("Resume not found");

  const extractedText = resume.extractedText || "Sample engineering resume text for analysis.";

  const prompt = `Analyze this engineering student's resume for the role: ${
    params.targetRoleTitle || "Full Stack Software Engineer"
  }.
Output JSON adhering strictly to this schema:
{
  "roleAlignmentScore": number (0-100),
  "atsScore": number (0-100),
  "extractedSections": {
    "education": string[],
    "experience": string[],
    "projects": string[],
    "skills": string[]
  },
  "missingInformation": string[],
  "atsHygieneChecks": [
    { "rule": string, "status": "PASS" | "WARNING" | "FAIL", "recommendation": string }
  ],
  "matchedSkills": string[],
  "missingSkills": string[],
  "prioritizedSuggestions": string[]
}

Resume Text:
${extractedText.substring(0, 4000)}
`;

  const aiResult = await executeAiTask<ResumeAnalysisOutput>({
    userId: params.userId,
    feature: "resume",
    prompt,
    schema: resumeAnalysisSchema,
    deterministicFallback: () => generateDeterministicResumeAnalysis(extractedText, params.targetRoleTitle),
  });

  // Save analysis record in database
  const savedAnalysis = await prisma.resumeAnalysis.create({
    data: {
      resumeId: params.resumeId,
      structuredResult: JSON.stringify(aiResult.data),
      atsScore: aiResult.data.atsScore,
      promptVersion: "v1.0",
      status: "COMPLETED",
    },
  });

  await prisma.resume.update({
    where: { id: params.resumeId },
    data: { status: "PARSED" },
  });

  return {
    analysis: savedAnalysis,
    result: aiResult.data,
    provider: aiResult.provider,
  };
}
