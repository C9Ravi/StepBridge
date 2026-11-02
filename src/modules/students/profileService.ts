import { prisma } from "@/lib/db/prisma";

export interface ProfileCompletionResult {
  score: number;
  breakdown: {
    basics: { score: number; max: 20; complete: boolean };
    education: { score: number; max: 15; complete: boolean };
    skills: { score: number; max: 20; complete: boolean };
    projects: { score: number; max: 20; complete: boolean };
    resume: { score: number; max: 15; complete: boolean };
    certifications: { score: number; max: 5; complete: boolean };
    careerGoal: { score: number; max: 5; complete: boolean };
  };
  missingPrompts: string[];
}

export async function calculateProfileCompletion(studentProfileId: string): Promise<ProfileCompletionResult> {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      user: { select: { name: true, email: true } },
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      careerGoals: { where: { isPrimary: true, status: "ACTIVE" } },
      resumes: true,
    },
  });

  if (!profile) {
    return {
      score: 0,
      breakdown: {
        basics: { score: 0, max: 20, complete: false },
        education: { score: 0, max: 15, complete: false },
        skills: { score: 0, max: 20, complete: false },
        projects: { score: 0, max: 20, complete: false },
        resume: { score: 0, max: 15, complete: false },
        certifications: { score: 0, max: 5, complete: false },
        careerGoal: { score: 0, max: 5, complete: false },
      },
      missingPrompts: ["Profile not found"],
    };
  }

  const missingPrompts: string[] = [];
  let totalScore = 0;

  // 1. Basics (20%)
  const hasBasics = !!(profile.headline && profile.location && profile.phone);
  const basicsScore = hasBasics ? 20 : (profile.headline ? 10 : 0) + (profile.location ? 5 : 0) + (profile.phone ? 5 : 0);
  totalScore += basicsScore;
  if (!hasBasics) {
    if (!profile.headline) missingPrompts.push("Add a professional headline");
    if (!profile.location) missingPrompts.push("Specify your current location");
    if (!profile.phone) missingPrompts.push("Add a contact phone number");
  }

  // 2. Education (15%)
  const hasEducation = profile.education.length > 0;
  const educationScore = hasEducation ? 15 : 0;
  totalScore += educationScore;
  if (!hasEducation) {
    missingPrompts.push("Add your degree, branch, and current CGPA");
  }

  // 3. Skills (20%)
  const skillsCount = profile.skills.length;
  const skillsScore = skillsCount >= 3 ? 20 : skillsCount > 0 ? 10 : 0;
  totalScore += skillsScore;
  if (skillsCount < 3) {
    missingPrompts.push(`Add at least ${3 - skillsCount} more technical skill(s)`);
  }

  // 4. Projects (20%)
  const projectsCount = profile.projects.length;
  const projectsScore = projectsCount >= 1 ? 20 : 0;
  totalScore += projectsScore;
  if (projectsCount === 0) {
    missingPrompts.push("Add at least one engineering project with GitHub / demo link");
  }

  // 5. Resume (15%)
  const hasResume = profile.resumes.length > 0;
  const resumeScore = hasResume ? 15 : 0;
  totalScore += resumeScore;
  if (!hasResume) {
    missingPrompts.push("Upload your PDF/DOCX resume for ATS analysis");
  }

  // 6. Certifications (5%)
  const hasCert = profile.certifications.length > 0;
  const certScore = hasCert ? 5 : 0;
  totalScore += certScore;
  if (!hasCert) {
    missingPrompts.push("Add relevant course certifications (optional)");
  }

  // 7. Career Goal (5%)
  const hasGoal = profile.careerGoals.length > 0;
  const goalScore = hasGoal ? 5 : 0;
  totalScore += goalScore;
  if (!hasGoal) {
    missingPrompts.push("Select a primary target role (e.g. Full Stack Engineer)");
  }

  // Save updated completion percentage
  await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: { completionPercentage: totalScore },
  });

  return {
    score: totalScore,
    breakdown: {
      basics: { score: basicsScore, max: 20, complete: basicsScore === 20 },
      education: { score: educationScore, max: 15, complete: educationScore === 15 },
      skills: { score: skillsScore, max: 20, complete: skillsScore === 20 },
      projects: { score: projectsScore, max: 20, complete: projectsScore === 20 },
      resume: { score: resumeScore, max: 15, complete: resumeScore === 15 },
      certifications: { score: certScore, max: 5, complete: certScore === 5 },
      careerGoal: { score: goalScore, max: 5, complete: goalScore === 5 },
    },
    missingPrompts,
  };
}
