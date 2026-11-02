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

import { DOMAIN_CATALOG } from "./domainCatalog";

/**
 * Deterministic domain-specialized roadmap generator.
 * Produces authentic, domain-specific milestones and tasks across all 12 technology tracks.
 */
export function generateDeterministicRoadmap(params: {
  roleTitle: string;
  horizonWeeks: number;
  weeklyHours: number;
  gapSkills: string[];
}): RoadmapOutput {
  const { roleTitle, horizonWeeks, gapSkills } = params;
  const blueprint = DOMAIN_CATALOG.find(
    (d) => d.title.toLowerCase() === roleTitle.toLowerCase() || d.slug.toLowerCase() === roleTitle.toLowerCase()
  );

  const milestones: z.infer<typeof roadmapMilestoneSchema>[] = [];
  const targetSkills = gapSkills.length > 0 ? gapSkills : (blueprint?.skills.map((s) => s.skillName) || ["Core Fundamentals"]);

  for (let week = 1; week <= horizonWeeks; week++) {
    const focusSkill = targetSkills[(week - 1) % targetSkills.length] || "Core Engineering";
    const sampleProject = blueprint?.projects?.[(week - 1) % (blueprint.projects.length || 1)];
    const csSubject = blueprint?.coreCsSubjects?.[(week - 1) % (blueprint.coreCsSubjects.length || 1)] || "Data Structures & Algorithms";
    const keyConcept = blueprint?.keyConcepts?.[(week - 1) % (blueprint.keyConcepts.length || 1)] || "System Architecture";
    const interviewTopic = blueprint?.interviewTopics?.[(week - 1) % (blueprint.interviewTopics.length || 1)] || "Technical Problem Solving";

    milestones.push({
      weekNumber: week,
      title: `Week ${week}: ${focusSkill} & ${keyConcept}`,
      tasks: [
        {
          title: `Master ${focusSkill}: Theoretical Foundation & ${csSubject}`,
          skillName: focusSkill,
          instructions: `Review canonical documentation, core CS principles of ${csSubject}, and key patterns for ${keyConcept}.`,
          estimatedMinutes: 120,
          resourceCategory: "Official Documentation",
          completionCriteria: `Synthesize a 1-page architectural cheatsheet covering ${focusSkill} APIs, lifecycle methods, and operational trade-offs.`,
        },
        {
          title: `Technical Interview Prep: ${interviewTopic}`,
          skillName: focusSkill,
          instructions: `Solve 2 technical challenges and articulate architectural responses around: "${interviewTopic}".`,
          estimatedMinutes: 180,
          resourceCategory: "Coding Practice",
          completionCriteria: `Write clean code meeting optimal time/space complexity with zero memory leaks.`,
        },
        {
          title: sampleProject
            ? `Hands-on Project: ${sampleProject.title}`
            : `Integrate ${focusSkill} into Portfolio Repository`,
          skillName: focusSkill,
          instructions: sampleProject
            ? `${sampleProject.description} Technologies: ${sampleProject.technologies.join(", ")}.`
            : `Build an observable, production-ready module utilizing ${focusSkill} with automated unit tests and error handling.`,
          estimatedMinutes: 240,
          resourceCategory: "Project Implementation",
          completionCriteria: sampleProject
            ? `Deliverables: ${sampleProject.deliverables.join("; ")}.`
            : `Commit code to GitHub with descriptive README, setup script, and architecture diagram.`,
        },
      ],
    });
  }

  return {
    title: `${horizonWeeks}-Week Actionable Career Roadmap for ${roleTitle}`,
    overview: `Domain-specialized learning plan calibrated to close skill gaps in ${targetSkills.slice(0, 4).join(", ")} within ${horizonWeeks} weeks (${params.weeklyHours} hrs/week). Covers core CS subjects, hands-on portfolio projects, and technical interview questions.`,
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
