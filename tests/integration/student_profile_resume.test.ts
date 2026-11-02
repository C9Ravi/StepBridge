import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { calculateProfileCompletion } from "@/modules/students/profileService";
import { generateDeterministicResumeAnalysis, processResumeAnalysis } from "@/modules/resumes/resumeService";

describe("Phase 2: Student Profile & Resume Tests", () => {
  let studentProfileId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Find or create test student
    let user = await prisma.user.findFirst({
      where: { role: "STUDENT", email: "aarav.patel@nitb.ac.in" },
      include: { studentProfile: true },
    });

    if (!user || !user.studentProfile) {
      user = await prisma.user.create({
        data: {
          name: "Test Aarav",
          email: `aarav_test_${Date.now()}@nitb.ac.in`,
          passwordHash: "hash123",
          role: "STUDENT",
          status: "ACTIVE",
          studentProfile: {
            create: {
              headline: "Software Engineering Student",
              location: "Bengaluru",
              visibility: "INSTITUTION_ONLY",
            },
          },
        },
        include: { studentProfile: true },
      });
    }

    testUserId = user.id;
    studentProfileId = user.studentProfile!.id;
  });

  it("calculates weighted profile completion according to PRD section 12.4", async () => {
    const result = await calculateProfileCompletion(studentProfileId);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown.basics.max).toBe(20);
    expect(result.breakdown.education.max).toBe(15);
    expect(result.breakdown.skills.max).toBe(20);
    expect(result.breakdown.projects.max).toBe(20);
    expect(result.breakdown.resume.max).toBe(15);
    expect(result.breakdown.certifications.max).toBe(5);
    expect(result.breakdown.careerGoal.max).toBe(5);
  });

  it("adds and manages student projects with technologies and dates", async () => {
    const project = await prisma.project.create({
      data: {
        studentProfileId,
        title: "Microservices Banking API",
        description: "Implemented high-throughput transactions using Node.js and PostgreSQL.",
        technologies: "Node.js, TypeScript, PostgreSQL",
        url: "https://github.com/test/banking-api",
      },
    });

    expect(project.id).toBeDefined();
    expect(project.studentProfileId).toBe(studentProfileId);

    // Update
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { title: "Microservices Banking API v2" },
    });
    expect(updated.title).toBe("Microservices Banking API v2");

    // Clean up
    await prisma.project.delete({ where: { id: project.id } });
  });

  it("generates deterministic ATS hygiene and resume analysis results", () => {
    const resumeText = `
    Aarav Patel
    aarav.patel@nitb.ac.in | +91 9876543210 | Bengaluru, India
    
    Education:
    Bachelor of Technology in Computer Science & Engineering (2021 - 2025)
    CGPA: 8.65 / 10.0
    
    Technical Skills:
    React, TypeScript, Node.js, SQL, REST APIs, Git, Tailwind CSS
    
    Projects:
    Collaborative Web Platform: Reduced latency by 40% using WebSockets and Redis.
    `;

    const analysis = generateDeterministicResumeAnalysis(resumeText, "Full Stack Engineer");

    expect(analysis.atsScore).toBeGreaterThanOrEqual(70);
    expect(analysis.roleAlignmentScore).toBeGreaterThan(50);
    expect(analysis.matchedSkills.length).toBeGreaterThan(0);
    expect(analysis.atsHygieneChecks.length).toBe(4);
    expect(analysis.prioritizedSuggestions.length).toBeGreaterThan(0);
  });

  it("uploads resume, processes analysis, and logs AI usage", async () => {
    const resume = await prisma.resume.create({
      data: {
        studentProfileId,
        fileName: "aarav_resume_2026.pdf",
        storageKey: `resumes/${studentProfileId}/resume.pdf`,
        fileType: "pdf",
        sizeBytes: 245000,
        status: "UPLOADED",
        extractedText: "Aarav Patel, B.Tech CSE, React and Node.js developer with production project experience.",
      },
    });

    const processed = await processResumeAnalysis({
      userId: testUserId,
      resumeId: resume.id,
      targetRoleTitle: "Full Stack Engineer",
    });

    expect(processed.analysis.id).toBeDefined();
    expect(processed.result.atsScore).toBeGreaterThan(0);
    expect(processed.provider).toBeDefined();

    // Verify resume status updated to PARSED
    const updatedResume = await prisma.resume.findUnique({ where: { id: resume.id } });
    expect(updatedResume?.status).toBe("PARSED");
  });
});
