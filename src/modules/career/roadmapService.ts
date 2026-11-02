import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { executeAiTask } from "@/lib/ai/provider";
import { calculateStudentReadiness } from "./readinessService";

export const roadmapTaskSchema = z.object({
  title: z.string(),
  skillName: z.string().optional(),
  instructions: z.string(),
  estimatedMinutes: z.number().default(90),
  resourceCategory: z.enum(["Official Documentation", "Coding Practice", "Project Implementation", "Architecture & System Design"]),
  completionCriteria: z.string(),
});

export const roadmapMilestoneSchema = z.object({
  weekNumber: z.number(),
  title: z.string(),
  tasks: z.array(roadmapTaskSchema),
});

export const roadmapOutputSchema = z.object({
  title: z.string(),
  overview: z.string(),
  milestones: z.array(roadmapMilestoneSchema),
});

export type RoadmapOutput = z.infer<typeof roadmapOutputSchema>;

/**
 * Deterministic fallback roadmap generator.
 * Produces structured weekly milestones addressing specific gaps.
 */
export function generateDeterministicRoadmap(params: {
  roleTitle: string;
  horizonWeeks: number;
  weeklyHours: number;
  gapSkills: string[];
}): RoadmapOutput {
  const { roleTitle, horizonWeeks, gapSkills } = params;
  const milestones: z.infer<typeof roadmapMilestoneSchema>[] = [];

  const targetSkills = gapSkills.length > 0 ? gapSkills : ["React", "TypeScript", "Node.js", "SQL & Databases"];

  for (let week = 1; week <= horizonWeeks; week++) {
    const focusSkill = targetSkills[(week - 1) % targetSkills.length] || "Core Fundamentals";
    
    milestones.push({
      weekNumber: week,
      title: `Week ${week}: Mastering ${focusSkill} & Practical Engineering`,
      tasks: [
        {
          title: `Deep Dive into ${focusSkill} Concepts & Best Practices`,
          skillName: focusSkill,
          instructions: `Review canonical documentation, patterns, and architectural trade-offs for ${focusSkill}.`,
          estimatedMinutes: 120,
          resourceCategory: "Official Documentation",
          completionCriteria: `Summarize key concepts and write a 1-page cheatsheet covering core APIs and lifecycle methods.`,
        },
        {
          title: `Targeted Problem Solving & Hands-on Exercises`,
          skillName: focusSkill,
          instructions: `Implement 3 real-world algorithmic or state-management mini-challenges using ${focusSkill}.`,
          estimatedMinutes: 180,
          resourceCategory: "Coding Practice",
          completionCriteria: `All tests passing locally with clean code and no memory leaks.`,
        },
        {
          title: `Integrate ${focusSkill} into a Portfolio Project Module`,
          skillName: focusSkill,
          instructions: `Build and deploy an observable feature utilizing ${focusSkill} with proper error handling and logging.`,
          estimatedMinutes: 240,
          resourceCategory: "Project Implementation",
          completionCriteria: `Commit code to GitHub with descriptive README and deploy live demo.`,
        },
      ],
    });
  }

  return {
    title: `${horizonWeeks}-Week Actionable Preparation Plan for ${roleTitle}`,
    overview: `Structured milestone roadmap designed to close evidence gaps across ${targetSkills.join(", ")} within ${horizonWeeks} weeks (${params.weeklyHours} hrs/week).`,
    milestones,
  };
}

export async function createStudentRoadmap(params: {
  studentProfileId: string;
  userId: string;
  roleId: string;
  horizonWeeks: 4 | 8 | 12;
  weeklyHours: number;
  preferences?: string;
}) {
  const role = await prisma.role.findUnique({ where: { id: params.roleId } });
  if (!role) throw new Error("Role not found");

  // Read current readiness gaps
  const readiness = await calculateStudentReadiness(params.studentProfileId);
  const gapSkills = (readiness?.skillGaps || [])
    .filter((g) => g.gapSize > 0)
    .sort((a, b) => b.importanceWeight - a.importanceWeight)
    .map((g) => g.skillName);

  const prompt = `Generate a structured, actionable ${params.horizonWeeks}-week career preparation roadmap for an engineering student targeting the role of: "${role.title}".
Available weekly time: ${params.weeklyHours} hours/week.
Identified skill gaps needing mastery: ${gapSkills.join(", ") || "Foundational stack"}.
User preferences: ${params.preferences || "None specified"}.

Format response strictly according to this JSON schema:
{
  "title": string,
  "overview": string,
  "milestones": [
    {
      "weekNumber": number,
      "title": string,
      "tasks": [
        {
          "title": string,
          "skillName": string,
          "instructions": string,
          "estimatedMinutes": number,
          "resourceCategory": "Official Documentation" | "Coding Practice" | "Project Implementation" | "Architecture & System Design",
          "completionCriteria": string
        }
      ]
    }
  ]
}`;

  const aiResult = await executeAiTask<RoadmapOutput>({
    userId: params.userId,
    feature: "roadmap",
    prompt,
    schema: roadmapOutputSchema,
    deterministicFallback: () =>
      generateDeterministicRoadmap({
        roleTitle: role.title,
        horizonWeeks: params.horizonWeeks,
        weeklyHours: params.weeklyHours,
        gapSkills,
      }),
  });

  // Archive any currently active roadmaps (PRD 12.6, 12.9)
  await prisma.roadmap.updateMany({
    where: { studentProfileId: params.studentProfileId, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });

  // Persist new roadmap with milestones and tasks
  const roadmap = await prisma.$transaction(async (tx) => {
    const createdRoadmap = await tx.roadmap.create({
      data: {
        studentProfileId: params.studentProfileId,
        roleId: role.id,
        horizonWeeks: params.horizonWeeks,
        status: "ACTIVE",
        generatedBy: aiResult.provider === "GEMINI" ? "AI_ASSISTED" : "RULE_FALLBACK",
        version: 1,
      },
    });

    for (const milestone of aiResult.data.milestones) {
      const createdMilestone = await tx.roadmapMilestone.create({
        data: {
          roadmapId: createdRoadmap.id,
          weekNumber: milestone.weekNumber,
          title: milestone.title,
          status: milestone.weekNumber === 1 ? "IN_PROGRESS" : "PENDING",
          sortOrder: milestone.weekNumber,
        },
      });

      for (const task of milestone.tasks) {
        await tx.roadmapTask.create({
          data: {
            milestoneId: createdMilestone.id,
            title: task.title,
            instructions: `${task.instructions} Completion Criteria: ${task.completionCriteria}`,
            estimatedMinutes: task.estimatedMinutes,
            resourceCategory: task.resourceCategory,
            status: "PENDING",
          },
        });
      }
    }

    return createdRoadmap;
  });

  return {
    roadmap,
    roadmapDetails: aiResult.data,
    provider: aiResult.provider,
  };
}
