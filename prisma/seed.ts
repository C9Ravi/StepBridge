import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding StepBridge database...");

  // 1. Super Admin
  const adminPassword = await bcrypt.hash("Admin@StepBridge2026!", 10);
  const superAdmin = await prisma.user.upsert({
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

  // 2. Roles & Taxonomy
  const roleFrontend = await prisma.role.upsert({
    where: { title: "Frontend Engineer" },
    update: {},
    create: {
      title: "Frontend Engineer",
      description: "Builds modern, responsive, and accessible web user interfaces with React, Next.js, TypeScript, and modern CSS architectures.",
      category: "Engineering",
      active: true,
    },
  });

  const roleBackend = await prisma.role.upsert({
    where: { title: "Backend Engineer" },
    update: {},
    create: {
      title: "Backend Engineer",
      description: "Architects high-performance APIs, database models, caching strategies, and secure services using Node.js, Python, and PostgreSQL.",
      category: "Engineering",
      active: true,
    },
  });

  const roleFullStack = await prisma.role.upsert({
    where: { title: "Full Stack Engineer" },
    update: {},
    create: {
      title: "Full Stack Engineer",
      description: "Delivers complete end-to-end applications bridging frontend experiences with robust backend microservices and databases.",
      category: "Engineering",
      active: true,
    },
  });

  const roleDevOps = await prisma.role.upsert({
    where: { title: "DevOps & Cloud Engineer" },
    update: {},
    create: {
      title: "DevOps & Cloud Engineer",
      description: "Automates CI/CD pipelines, provisions cloud infrastructure, and manages containerized workloads with Docker, Kubernetes, and AWS.",
      category: "Cloud & Infrastructure",
      active: true,
    },
  });

  // 3. Core Skills
  const skillsData = [
    { canonicalName: "React", category: "Frontend", aliases: JSON.stringify(["React.js", "ReactJS", "Next.js"]) },
    { canonicalName: "TypeScript", category: "Frontend", aliases: JSON.stringify(["TS", "JavaScript"]) },
    { canonicalName: "Tailwind CSS", category: "Frontend", aliases: JSON.stringify(["Tailwind", "CSS3"]) },
    { canonicalName: "Node.js", category: "Backend", aliases: JSON.stringify(["Node", "Express", "NestJS"]) },
    { canonicalName: "SQL & Databases", category: "Backend", aliases: JSON.stringify(["PostgreSQL", "MySQL", "Prisma"]) },
    { canonicalName: "REST API Design", category: "Backend", aliases: JSON.stringify(["REST", "API Development"]) },
    { canonicalName: "Data Structures & Algorithms", category: "Computer Science", aliases: JSON.stringify(["DSA", "Algorithms"]) },
    { canonicalName: "Docker & Containers", category: "DevOps", aliases: JSON.stringify(["Docker", "Containers"]) },
    { canonicalName: "Git & Version Control", category: "DevOps", aliases: JSON.stringify(["Git", "GitHub", "CI/CD"]) },
    { canonicalName: "System Design", category: "Computer Science", aliases: JSON.stringify(["Architecture", "Scalability"]) },
  ];

  const skillMap: Record<string, string> = {};
  for (const s of skillsData) {
    const skill = await prisma.skill.upsert({
      where: { canonicalName: s.canonicalName },
      update: {},
      create: s,
    });
    skillMap[s.canonicalName] = skill.id;
  }

  // 4. Role Skills mapping
  const roleSkillMappings = [
    // Full Stack Engineer
    { roleId: roleFullStack.id, skillId: skillMap["React"], level: 4, weight: 5 },
    { roleId: roleFullStack.id, skillId: skillMap["TypeScript"], level: 4, weight: 5 },
    { roleId: roleFullStack.id, skillId: skillMap["Node.js"], level: 4, weight: 5 },
    { roleId: roleFullStack.id, skillId: skillMap["SQL & Databases"], level: 3, weight: 4 },
    { roleId: roleFullStack.id, skillId: skillMap["REST API Design"], level: 4, weight: 4 },
    { roleId: roleFullStack.id, skillId: skillMap["Git & Version Control"], level: 3, weight: 3 },
    // Frontend Engineer
    { roleId: roleFrontend.id, skillId: skillMap["React"], level: 4, weight: 5 },
    { roleId: roleFrontend.id, skillId: skillMap["TypeScript"], level: 4, weight: 5 },
    { roleId: roleFrontend.id, skillId: skillMap["Tailwind CSS"], level: 4, weight: 4 },
    { roleId: roleFrontend.id, skillId: skillMap["REST API Design"], level: 3, weight: 3 },
    // Backend Engineer
    { roleId: roleBackend.id, skillId: skillMap["Node.js"], level: 4, weight: 5 },
    { roleId: roleBackend.id, skillId: skillMap["SQL & Databases"], level: 4, weight: 5 },
    { roleId: roleBackend.id, skillId: skillMap["REST API Design"], level: 4, weight: 5 },
    { roleId: roleBackend.id, skillId: skillMap["System Design"], level: 3, weight: 4 },
    { roleId: roleBackend.id, skillId: skillMap["Docker & Containers"], level: 3, weight: 3 },
  ];

  for (const rsm of roleSkillMappings) {
    await prisma.roleSkill.upsert({
      where: { roleId_skillId: { roleId: rsm.roleId, skillId: rsm.skillId } },
      update: {},
      create: {
        roleId: rsm.roleId,
        skillId: rsm.skillId,
        requiredLevel: rsm.level,
        importanceWeight: rsm.weight,
      },
    });
  }

  // 5. Skill Assessments and Questions
  const assessmentReact = await prisma.assessment.create({
    data: {
      title: "React & Modern UI Architecture",
      topic: "React",
      durationMinutes: 15,
      questionCount: 4,
      status: "ACTIVE",
    },
  });

  const reactQuestions = [
    {
      assessmentId: assessmentReact.id,
      skillId: skillMap["React"],
      difficulty: "BEGINNER",
      question: "What is the primary purpose of the React `useEffect` dependency array?",
      options: JSON.stringify([
        "To declare which state variables can be read inside the effect",
        "To specify which values the effect relies upon and trigger re-execution when they change",
        "To render JSX asynchronously in the background",
        "To prevent any component rerenders permanently",
      ]),
      answerKey: 1,
      explanation: "React compares each dependency with its previous value using Object.is. If any dependency changes, the effect runs again.",
    },
    {
      assessmentId: assessmentReact.id,
      skillId: skillMap["React"],
      difficulty: "INTERMEDIATE",
      question: "In React 18/19 Server Components, what is true regarding client-side state hooks like `useState`?",
      options: JSON.stringify([
        "Server Components can use useState if marked with async/await",
        "Server Components cannot use useState or client lifecycle hooks; they must be in Client Components with 'use client'",
        "useState is automatically replaced with useReducer on the server",
        "Server Components store state in server sessions across reloads",
      ]),
      answerKey: 1,
      explanation: "Server components execute exclusively on the server and do not retain client interactive state like useState.",
    },
    {
      assessmentId: assessmentReact.id,
      skillId: skillMap["React"],
      difficulty: "INTERMEDIATE",
      question: "When should you prefer `useCallback` over regular inline functions?",
      options: JSON.stringify([
        "For every single function defined in every component",
        "When passing callbacks to optimized child components that rely on reference equality (e.g. React.memo) to prevent unnecessary re-renders",
        "Only when making HTTP fetch calls",
        "To convert synchronous code to run inside web workers",
      ]),
      answerKey: 1,
      explanation: "useCallback caches function definitions between renders to maintain referential identity when passed to memoized children.",
    },
    {
      assessmentId: assessmentReact.id,
      skillId: skillMap["React"],
      difficulty: "ADVANCED",
      question: "What is the core benefit of optimistic UI updates in interactive applications?",
      options: JSON.stringify([
        "It eliminates all backend database validation",
        "It provides immediate user feedback by rendering the expected state before the server confirms the mutation",
        "It automatically retries failed HTTP requests indefinitely",
        "It replaces the need for server-side error handling",
      ]),
      answerKey: 1,
      explanation: "Optimistic UI immediately reflects user actions, creating a perceived instant response while reconciling in the background.",
    },
  ];

  for (const q of reactQuestions) {
    await prisma.assessmentQuestion.create({ data: q });
  }

  // 6. Pilot Institution: NIT Bangalore
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

  // 7. Verified Company: TechCorp Innovations
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

  // 8. Published Opportunities
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
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
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

  // 9. Placement Drive
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

  // 10. Sample Student with Complete Profile & Evidence
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

    await prisma.careerGoal.create({
      data: {
        studentProfileId: studentProfile.id,
        roleId: roleFullStack.id,
        isPrimary: true,
        status: "ACTIVE",
      },
    });

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

  console.log("Database seeded successfully with initial users, taxonomy, institution, company, and sample student!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
