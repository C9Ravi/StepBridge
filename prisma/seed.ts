import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DOMAIN_CATALOG } from "../src/modules/career/domainCatalog";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding StepBridge database with full 12-domain career ecosystem...");

  // 1. Super Admin
  const adminPassword = await bcrypt.hash("Admin@StepBridge2026!", 10);
  await prisma.user.upsert({
    where: { email: "admin@stepbridge.in" },
    update: { passwordHash: adminPassword, role: "SUPER_ADMIN", status: "ACTIVE" },
    create: {
      name: "Global Platform Administrator",
      email: "admin@stepbridge.in",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@stepbridge.ai" },
    update: { passwordHash: adminPassword, role: "SUPER_ADMIN", status: "ACTIVE" },
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

  // 4. Pilot Institution: JCBUST, YMCA Faridabad
  let institution = await prisma.institution.findFirst({
    where: {
      OR: [
        { domain: "jcbust.ac.in" },
        { domain: "nitb.ac.in" },
      ],
    },
  });
  if (!institution) {
    institution = await prisma.institution.create({
      data: {
        name: "JCBUST, YMCA Faridabad",
        website: "https://jcboseust.ac.in",
        domain: "jcbust.ac.in",
        city: "Faridabad",
        state: "Haryana",
        verificationStatus: "APPROVED",
      },
    });
  } else {
    institution = await prisma.institution.update({
      where: { id: institution.id },
      data: {
        name: "JCBUST, YMCA Faridabad",
        website: "https://jcboseust.ac.in",
        domain: "jcbust.ac.in",
        city: "Faridabad",
        state: "Haryana",
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
  const collegeAdminPassword = await bcrypt.hash("College@StepBridge2026!", 10);
  const collegeAdminUser = await prisma.user.upsert({
    where: { email: "tpo@jcbust.ac.in" },
    update: { passwordHash: collegeAdminPassword, role: "COLLEGE_ADMIN", status: "ACTIVE" },
    create: {
      name: "Dr. Ramesh Sharma",
      email: "tpo@jcbust.ac.in",
      passwordHash: collegeAdminPassword,
      role: "COLLEGE_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "tpo@nitb.ac.in" },
    update: { passwordHash: collegeAdminPassword, role: "COLLEGE_ADMIN", status: "ACTIVE" },
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

  const recruiterPassword = await bcrypt.hash("Recruiter@StepBridge2026!", 10);
  const recruiterUser = await prisma.user.upsert({
    where: { email: "ananya.recruiter@techcorp-innovations.io" },
    update: { passwordHash: recruiterPassword, role: "RECRUITER", status: "ACTIVE" },
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

  // 8. Sample Student with Complete Profile & Evidence: Ravi Chauhan
  const studentPassword = await bcrypt.hash("Student@StepBridge2026!", 10);
  const studentUser = await prisma.user.upsert({
    where: { email: "ravi.chauhan@jcbust.ac.in" },
    update: {
      name: "Ravi Chauhan",
      passwordHash: studentPassword,
      role: "STUDENT",
      status: "ACTIVE",
    },
    create: {
      name: "Ravi Chauhan",
      email: "ravi.chauhan@jcbust.ac.in",
      passwordHash: studentPassword,
      role: "STUDENT",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  // Ensure legacy email is also updated to Ravi Chauhan for test compatibility
  const legacyUser = await prisma.user.upsert({
    where: { email: "aarav.patel@nitb.ac.in" },
    update: {
      name: "Ravi Chauhan",
      passwordHash: studentPassword,
      role: "STUDENT",
      status: "ACTIVE",
    },
    create: {
      name: "Ravi Chauhan",
      email: "aarav.patel@nitb.ac.in",
      passwordHash: studentPassword,
      role: "STUDENT",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  // Update all student records to JCBUST and Ravi Chauhan
  await prisma.user.updateMany({
    where: { role: "STUDENT" },
    data: { name: "Ravi Chauhan" },
  });

  await prisma.studentEducation.updateMany({
    data: { institution: "JCBUST, YMCA Faridabad" },
  });

  const targetUsers = [studentUser, legacyUser];
  for (const u of targetUsers) {
    const existingProfile = await prisma.studentProfile.findUnique({ where: { userId: u.id } });
    if (!existingProfile) {
      const studentProfile = await prisma.studentProfile.create({
        data: {
          userId: u.id,
          institutionId: institution.id,
          batchId: batchCSE2025.id,
          headline: "Aspiring Full Stack Engineer | React & Node.js Developer",
          bio: "Final year B.Tech student at JCBUST, YMCA Faridabad passionate about high-scale web platforms and distributed systems.",
          phone: "+91 98765 43210",
          location: "Faridabad, Haryana",
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
          institution: "JCBUST, YMCA Faridabad",
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
          url: "https://github.com/ravichauhan/whiteboard-app",
          startDate: new Date("2024-01-10"),
          endDate: new Date("2024-04-15"),
        },
      });
    } else {
      await prisma.studentProfile.update({
        where: { id: existingProfile.id },
        data: {
          location: "Faridabad, Haryana",
          bio: "Final year B.Tech student at JCBUST, YMCA Faridabad passionate about high-scale web platforms and distributed systems.",
        },
      });
    }
  }

  // 9. Seed Resume and ATS Analysis for Ravi Chauhan
  const raviProfile = await prisma.studentProfile.findFirst({
    where: { user: { email: "ravi.chauhan@jcbust.ac.in" } },
  });

  if (raviProfile) {
    let raviResume = await prisma.resume.findFirst({
      where: { studentProfileId: raviProfile.id },
    });
    if (!raviResume) {
      raviResume = await prisma.resume.create({
        data: {
          studentProfileId: raviProfile.id,
          fileName: "Ravi_Chauhan_FullStack_Resume.pdf",
          storageKey: "resumes/seed_ravi_chauhan.pdf",
          fileType: "pdf",
          sizeBytes: 148200,
          status: "PARSED",
          extractedText:
            "Ravi Chauhan | JCBUST YMCA Faridabad | B.Tech CSE 2025 | CGPA 8.65. Technical Skills: React, Next.js, TypeScript, Node.js, PostgreSQL, Prisma, Redis, Docker, Git. Projects: Real-time Whiteboard, StepBridge Career Readiness Platform.",
        },
      });

      await prisma.resumeAnalysis.create({
        data: {
          resumeId: raviResume.id,
          targetRoleId: roleMap["Full Stack Engineer"] || null,
          atsScore: 88,
          status: "COMPLETED",
          structuredResult: JSON.stringify({
            overallAssessment: "Strong candidate for Full Stack Engineer roles with verified React and Node.js capabilities.",
            atsHygiene: {
              contactInfo: true,
              standardHeadings: true,
              singleColumnFormat: true,
              actionVerbs: true,
            },
            extractedSkills: ["React", "TypeScript", "Node.js", "SQL & Databases", "Git"],
            missingSkills: ["Redis Caching", "PostgreSQL Query Optimization"],
            suggestions: [
              "Explicitly highlight your Redis and WebSocket experience at the top of your Projects section.",
              "Include latency benchmarks or throughput numbers (e.g. 'sub-50ms message latency').",
              "Ensure your GitHub repository links are active and include a README architecture overview.",
            ],
          }),
        },
      });
    }

    // 10. Seed Application for Ravi to TechCorp
    if (opportunity1) {
      const existingApp = await prisma.application.findFirst({
        where: { opportunityId: opportunity1.id, studentId: raviProfile.id },
      });
      if (!existingApp) {
        const app = await prisma.application.create({
          data: {
            opportunityId: opportunity1.id,
            studentId: raviProfile.id,
            resumeId: raviResume.id,
            stage: "INTERVIEW",
            profileSnapshot: JSON.stringify({
              name: "Ravi Chauhan",
              email: "ravi.chauhan@jcbust.ac.in",
              institution: "JCBUST, YMCA Faridabad",
              cgpa: 8.65,
              skills: ["React", "TypeScript", "Node.js", "SQL & Databases"],
            }),
          },
        });

        await prisma.applicationStageEvent.createMany({
          data: [
            {
              applicationId: app.id,
              fromStage: "APPLIED",
              toStage: "APPLIED",
              note: "Application submitted with verified student profile and resume snapshot.",
            },
            {
              applicationId: app.id,
              fromStage: "APPLIED",
              toStage: "SHORTLISTED",
              note: "Candidate profile shortlisted based on 8.65 CGPA and verified React skills.",
            },
            {
              applicationId: app.id,
              fromStage: "SHORTLISTED",
              toStage: "INTERVIEW",
              note: "Round 1 Technical Interview scheduled on Node.js architecture & Event Loop.",
            },
          ],
        });

        await prisma.interviewSchedule.create({
          data: {
            applicationId: app.id,
            interviewerName: "Siddharth Verma (Engineering Lead)",
            roundTitle: "Node.js Architecture & System Design",
            scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            durationMinutes: 45,
            meetingUrl: "https://meet.google.com/xyz-stepbridge-demo",
            status: "SCHEDULED",
            notes: "Candidate has demonstrated solid understanding of non-blocking I/O.",
          },
        });
      }
    }
  }

  // 11. Seed SaaS Subscriptions & Payments
  // Student subscription
  const existingStudentSub = await prisma.subscription.findFirst({ where: { userId: studentUser.id } });
  if (!existingStudentSub) {
    const sub = await prisma.subscription.create({
      data: {
        userId: studentUser.id,
        planTier: "STUDENT_PREMIUM",
        status: "ACTIVE",
        billingInterval: "ANNUALLY",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.paymentRecord.create({
      data: {
        subscriptionId: sub.id,
        userId: studentUser.id,
        amount: 2999,
        currency: "INR",
        status: "SUCCESS",
        provider: "RAZORPAY",
        providerPaymentId: "pay_demo_student_premium_2026",
      },
    });
  }

  // Institution subscription
  const existingInstSub = await prisma.subscription.findFirst({ where: { institutionId: institution.id } });
  if (!existingInstSub) {
    const sub = await prisma.subscription.create({
      data: {
        institutionId: institution.id,
        planTier: "COLLEGE_PILOT",
        status: "ACTIVE",
        billingInterval: "ANNUALLY",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.paymentRecord.create({
      data: {
        subscriptionId: sub.id,
        amount: 49999,
        currency: "INR",
        status: "SUCCESS",
        provider: "MANUAL",
        providerPaymentId: "inv_jcbust_pilot_2026",
      },
    });
  }

  // Company subscription
  const existingCompanySub = await prisma.subscription.findFirst({ where: { companyId: company.id } });
  if (!existingCompanySub) {
    const sub = await prisma.subscription.create({
      data: {
        companyId: company.id,
        planTier: "RECRUITER_PRO",
        status: "ACTIVE",
        billingInterval: "MONTHLY",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.paymentRecord.create({
      data: {
        subscriptionId: sub.id,
        amount: 19999,
        currency: "INR",
        status: "SUCCESS",
        provider: "RAZORPAY",
        providerPaymentId: "pay_demo_recruiter_pro_2026",
      },
    });
  }

  console.log("Database seeded successfully with all 12 domains, skills, assessments, subscriptions, and sample student Ravi Chauhan (JCBUST, YMCA Faridabad)!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
