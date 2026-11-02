import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DOMAIN_CATALOG } from "../src/modules/career/domainCatalog";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding StepBridge database with full 12-domain career ecosystem...");

  // 1. Super Admin
  const adminPassword = await bcrypt.hash("Admin@StepBridge2026!", 10);
  await prisma.user.upsert({
    where: { email: "admin@stepbridge.ai" },
    update: {},
    create: {
      name: "Global Platform Administrator",
      email: "admin@stepbridge.ai",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  // 2. Seed All Skills from Catalog & Core Foundation
  const baseSkills = [
    { canonicalName: "React", category: "Frontend", aliases: JSON.stringify(["React.js", "ReactJS", "Next.js"]) },
    { canonicalName: "TypeScript", category: "Frontend", aliases: JSON.stringify(["TS", "JavaScript"]) },
    { canonicalName: "Tailwind CSS", category: "Frontend", aliases: JSON.stringify(["Tailwind", "CSS3"]) },
    { canonicalName: "Node.js", category: "Backend", aliases: JSON.stringify(["Node", "Express", "NestJS"]) },
    { canonicalName: "Python", category: "Backend", aliases: JSON.stringify(["Py", "Python3", "FastAPI"]) },
    { canonicalName: "SQL & Databases", category: "Backend", aliases: JSON.stringify(["PostgreSQL", "MySQL", "Prisma", "SQL"]) },
    { canonicalName: "REST API Design", category: "Backend", aliases: JSON.stringify(["REST", "API Development", "HTTP"]) },
    { canonicalName: "Data Structures & Algorithms", category: "Computer Science", aliases: JSON.stringify(["DSA", "Algorithms", "Problem Solving"]) },
    { canonicalName: "Docker & Containers", category: "DevOps", aliases: JSON.stringify(["Docker", "Containers", "Podman"]) },
    { canonicalName: "Git & Version Control", category: "DevOps", aliases: JSON.stringify(["Git", "GitHub", "CI/CD"]) },
    { canonicalName: "System Design", category: "Computer Science", aliases: JSON.stringify(["Architecture", "Scalability", "High Availability"]) },
  ];

  const skillMap: Record<string, string> = {};

  for (const s of baseSkills) {
    const record = await prisma.skill.upsert({
      where: { canonicalName: s.canonicalName },
      update: { category: s.category, aliases: s.aliases },
      create: s,
    });
    skillMap[s.canonicalName] = record.id;
  }

  // Ensure all skills mentioned across all 12 domains exist
  for (const domain of DOMAIN_CATALOG) {
    for (const sk of domain.skills) {
      if (!skillMap[sk.skillName]) {
        const record = await prisma.skill.upsert({
          where: { canonicalName: sk.skillName },
          update: { category: sk.category },
          create: {
            canonicalName: sk.skillName,
            category: sk.category,
            active: true,
          },
        });
        skillMap[sk.skillName] = record.id;
      }
    }
  }

  // 3. Seed All 12 Roles / Domains from DOMAIN_CATALOG
  const roleMap: Record<string, string> = {};

  for (const domain of DOMAIN_CATALOG) {
    const roleRecord = await prisma.role.upsert({
      where: { title: domain.title },
      update: {
        slug: domain.slug,
        description: domain.description,
        category: domain.category,
        overview: domain.overview,
        careerOpportunities: JSON.stringify(domain.careerOpportunities),
        coreCsSubjects: JSON.stringify(domain.coreCsSubjects),
        keyConcepts: JSON.stringify(domain.keyConcepts),
        recommendedTools: JSON.stringify(domain.recommendedTools),
        portfolioExpectations: domain.portfolioExpectations,
        interviewTopics: JSON.stringify(domain.interviewTopics),
        projectIdeas: JSON.stringify(domain.projects),
        entryLevelGuidance: domain.entryLevelGuidance,
        milestoneOutcomes: JSON.stringify(domain.milestoneOutcomes),
        active: true,
      },
      create: {
        slug: domain.slug,
        title: domain.title,
        description: domain.description,
        category: domain.category,
        overview: domain.overview,
        careerOpportunities: JSON.stringify(domain.careerOpportunities),
        coreCsSubjects: JSON.stringify(domain.coreCsSubjects),
        keyConcepts: JSON.stringify(domain.keyConcepts),
        recommendedTools: JSON.stringify(domain.recommendedTools),
        portfolioExpectations: domain.portfolioExpectations,
        interviewTopics: JSON.stringify(domain.interviewTopics),
        projectIdeas: JSON.stringify(domain.projects),
        entryLevelGuidance: domain.entryLevelGuidance,
        milestoneOutcomes: JSON.stringify(domain.milestoneOutcomes),
        active: true,
      },
    });

    roleMap[domain.slug] = roleRecord.id;
    roleMap[domain.title] = roleRecord.id;

    // Map Domain Skills
    for (const sk of domain.skills) {
      const skillId = skillMap[sk.skillName];
      if (skillId) {
        await prisma.roleSkill.upsert({
          where: { roleId_skillId: { roleId: roleRecord.id, skillId } },
          update: {
            requiredLevel: sk.requiredLevel,
            importanceWeight: sk.importanceWeight,
          },
          create: {
            roleId: roleRecord.id,
            skillId,
            requiredLevel: sk.requiredLevel,
            importanceWeight: sk.importanceWeight,
          },
        });
      }
    }

    // Seed Assessment for each domain if questions exist
    if (domain.questions && domain.questions.length > 0) {
      let assessment = await prisma.assessment.findFirst({
        where: { topic: domain.title },
      });

      if (!assessment) {
        assessment = await prisma.assessment.create({
          data: {
            title: `${domain.title} Assessment`,
            topic: domain.title,
            durationMinutes: 20,
            questionCount: domain.questions.length,
            status: "ACTIVE",
          },
        });
      }

      for (const q of domain.questions) {
        const skillId = skillMap[q.skillName] || skillMap["System Design"] || skillMap["React"] || skillMap["Python"];
        if (skillId) {
          const existingQuestion = await prisma.assessmentQuestion.findFirst({
            where: { assessmentId: assessment.id, question: q.question },
          });

          if (!existingQuestion) {
            await prisma.assessmentQuestion.create({
              data: {
                assessmentId: assessment.id,
                skillId,
                difficulty: q.difficulty,
                question: q.question,
                options: JSON.stringify(q.options),
                answerKey: q.answerKey,
                explanation: q.explanation,
                status: "ACTIVE",
              },
            });
          }
        }
      }
    }
  }

  // 4. Pilot Institution: NIT Bangalore
  let institution = await prisma.institution.findFirst({ where: { domain: "nitb.ac.in" } });
  if (!institution) {
    institution = await prisma.institution.create({
      data: {
        name: "National Institute of Technology, Bangalore",
        website: "https://nitb.ac.in",
        domain: "nitb.ac.in",
        city: "Bengaluru",
        state: "Karnataka",
        verificationStatus: "APPROVED",
      },
    });
  }

  let deptCSE = await prisma.department.findFirst({ where: { institutionId: institution.id, code: "CSE" } });
  if (!deptCSE) {
    deptCSE = await prisma.department.create({
      data: {
        institutionId: institution.id,
        name: "Computer Science & Engineering",
        code: "CSE",
      },
    });
  }

  let deptECE = await prisma.department.findFirst({ where: { institutionId: institution.id, code: "ECE" } });
  if (!deptECE) {
    deptECE = await prisma.department.create({
      data: {
        institutionId: institution.id,
        name: "Electronics & Communication Engineering",
        code: "ECE",
      },
    });
  }

  let batchCSE2025 = await prisma.batch.findFirst({ where: { institutionId: institution.id, graduationYear: 2025 } });
  if (!batchCSE2025) {
    batchCSE2025 = await prisma.batch.create({
      data: {
        institutionId: institution.id,
        departmentId: deptCSE.id,
        graduationYear: 2025,
        label: "B.Tech CSE Class of 2025",
      },
    });
  }

  let batchCSE2026 = await prisma.batch.findFirst({ where: { institutionId: institution.id, graduationYear: 2026 } });
  if (!batchCSE2026) {
    batchCSE2026 = await prisma.batch.create({
      data: {
        institutionId: institution.id,
        departmentId: deptCSE.id,
        graduationYear: 2026,
        label: "B.Tech CSE Class of 2026",
      },
    });
  }

  // College Admin user
  const collegeAdminPassword = await bcrypt.hash("CollegeAdmin2026!", 10);
  const collegeAdminUser = await prisma.user.upsert({
    where: { email: "tpo@nitb.ac.in" },
    update: {},
    create: {
      name: "Dr. Ramesh Sharma",
      email: "tpo@nitb.ac.in",
      passwordHash: collegeAdminPassword,
      role: "COLLEGE_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.institutionMembership.upsert({
    where: { userId_institutionId: { userId: collegeAdminUser.id, institutionId: institution.id } },
    update: {},
    create: {
      userId: collegeAdminUser.id,
      institutionId: institution.id,
      role: "COLLEGE_ADMIN",
      status: "ACTIVE",
      permissions: "all",
    },
  });

  // 5. Verified Company: TechCorp Innovations
  let company = await prisma.company.findFirst({ where: { domain: "techcorp-innovations.io" } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "TechCorp Innovations",
        website: "https://techcorp-innovations.io",
        domain: "techcorp-innovations.io",
        industry: "Fintech & Cloud Systems",
        description: "Leading enterprise cloud fintech infrastructure company powering millions of real-time transactions.",
        verificationStatus: "APPROVED",
      },
    });
  }

  const recruiterPassword = await bcrypt.hash("Recruiter2026!", 10);
  const recruiterUser = await prisma.user.upsert({
    where: { email: "ananya.recruiter@techcorp-innovations.io" },
    update: {},
    create: {
      name: "Ananya Deshmukh",
      email: "ananya.recruiter@techcorp-innovations.io",
      passwordHash: recruiterPassword,
      role: "RECRUITER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId: recruiterUser.id, companyId: company.id } },
    update: {},
    create: {
      userId: recruiterUser.id,
      companyId: company.id,
      role: "RECRUITER",
      status: "ACTIVE",
    },
  });

  // 6. Published Opportunity
  let opportunity1 = await prisma.opportunity.findFirst({ where: { title: "Junior Full Stack Engineer" } });
  if (!opportunity1) {
    opportunity1 = await prisma.opportunity.create({
      data: {
        companyId: company.id,
        title: "Junior Full Stack Engineer",
        type: "FULL_TIME",
        description: "Join our core payments experience team building reactive frontend dashboards and resilient backend APIs with React, TypeScript, and Node.js.",
        location: "Bengaluru (Hybrid)",
        salaryRange: "10 - 14 LPA",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED",
      },
    });

    await prisma.opportunitySkill.createMany({
      data: [
        { opportunityId: opportunity1.id, skillId: skillMap["React"], requiredLevel: 4, importance: "REQUIRED" },
        { opportunityId: opportunity1.id, skillId: skillMap["TypeScript"], requiredLevel: 3, importance: "REQUIRED" },
        { opportunityId: opportunity1.id, skillId: skillMap["Node.js"], requiredLevel: 3, importance: "REQUIRED" },
        { opportunityId: opportunity1.id, skillId: skillMap["SQL & Databases"], requiredLevel: 3, importance: "PREFERRED" },
      ],
    });

    await prisma.eligibilityRule.createMany({
      data: [
        { opportunityId: opportunity1.id, ruleType: "MIN_CGPA", operator: "GTE", valueJson: JSON.stringify({ minCgpa: 7.0 }) },
        { opportunityId: opportunity1.id, ruleType: "ALLOWED_BATCHES", operator: "IN", valueJson: JSON.stringify({ years: [2025, 2026] }) },
      ],
    });
  }

  // 7. Placement Drive
  const existingDrive = await prisma.placementDrive.findFirst({ where: { institutionId: institution.id, roleTitle: "Campus Associate Software Engineer" } });
  if (!existingDrive) {
    await prisma.placementDrive.create({
      data: {
        institutionId: institution.id,
        companyName: "TechCorp Innovations",
        roleTitle: "Campus Associate Software Engineer",
        packageLpa: 12.5,
        driveDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED",
        eligibilityRules: JSON.stringify({ minCgpa: 7.5, allowedBranches: ["CSE", "IT", "ECE"], graduationYears: [2025] }),
        notes: "Online assessment followed by 2 technical interviews and HR discussion.",
      },
    });
  }

  // 8. Sample Student with Complete Profile & Evidence
  const studentPassword = await bcrypt.hash("Student2026!", 10);
  const studentUser = await prisma.user.upsert({
    where: { email: "aarav.patel@nitb.ac.in" },
    update: {},
    create: {
      name: "Aarav Patel",
      email: "aarav.patel@nitb.ac.in",
      passwordHash: studentPassword,
      role: "STUDENT",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  const existingProfile = await prisma.studentProfile.findUnique({ where: { userId: studentUser.id } });
  if (!existingProfile) {
    const studentProfile = await prisma.studentProfile.create({
      data: {
        userId: studentUser.id,
        institutionId: institution.id,
        batchId: batchCSE2025.id,
        headline: "Aspiring Full Stack Engineer | React & Node.js Developer",
        bio: "Final year B.Tech student at NIT Bangalore passionate about high-scale web platforms and distributed systems.",
        phone: "+91 98765 43210",
        location: "Bengaluru, Karnataka",
        cgpa: 8.65,
        visibility: "VERIFIED_RECRUITERS",
        completionPercentage: 85,
      },
    });

    await prisma.studentEducation.create({
      data: {
        studentProfileId: studentProfile.id,
        degree: "B.Tech",
        branch: "Computer Science & Engineering",
        institution: "National Institute of Technology, Bangalore",
        cgpa: 8.65,
        startYear: 2021,
        endYear: 2025,
      },
    });

    const fullStackRoleId = roleMap["Full Stack Engineer"];
    if (fullStackRoleId) {
      await prisma.careerGoal.create({
        data: {
          studentProfileId: studentProfile.id,
          roleId: fullStackRoleId,
          isPrimary: true,
          status: "ACTIVE",
        },
      });
    }

    await prisma.studentSkill.createMany({
      data: [
        { studentProfileId: studentProfile.id, skillId: skillMap["React"], selfLevel: 4, verifiedLevel: 4, evidenceMetadata: JSON.stringify({ source: "Assessment score: 100%" }) },
        { studentProfileId: studentProfile.id, skillId: skillMap["TypeScript"], selfLevel: 4, verifiedLevel: 3, evidenceMetadata: JSON.stringify({ source: "Verified GitHub projects" }) },
        { studentProfileId: studentProfile.id, skillId: skillMap["Node.js"], selfLevel: 3, verifiedLevel: 3, evidenceMetadata: JSON.stringify({ source: "Backend REST project" }) },
        { studentProfileId: studentProfile.id, skillId: skillMap["SQL & Databases"], selfLevel: 3, verifiedLevel: 2, evidenceMetadata: JSON.stringify({ source: "Coursework & schema design" }) },
      ],
    });

    await prisma.project.create({
      data: {
        studentProfileId: studentProfile.id,
        title: "Real-time Collaborative Whiteboard",
        description: "Interactive multi-user canvas application using React, WebSockets, Redis pub/sub, and Node.js with sub-50ms latency synchronization.",
        technologies: "React, TypeScript, WebSockets, Redis, Node.js",
        url: "https://github.com/aaravpatel/whiteboard-app",
        startDate: new Date("2024-01-10"),
        endDate: new Date("2024-04-15"),
      },
    });
  }

  console.log("Database seeded successfully with all 12 domains, skills, assessments, and sample student!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
