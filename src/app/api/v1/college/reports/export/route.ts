import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const students = await prisma.studentProfile.findMany({
    where: { institutionId },
    include: {
      user: { select: { name: true, email: true } },
      batch: { include: { department: true } },
      skills: true,
      projects: true,
      _count: { select: { applications: true, driveRegistrations: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const csvRows = [
    ["Student Name", "Email", "Department", "Graduation Year", "CGPA", "Profile Completion %", "Skills Count", "Projects Count", "Applications"].join(","),
  ];

  for (const s of students) {
    const row = [
      `"${s.user.name.replace(/"/g, '""')}"`,
      `"${s.user.email}"`,
      `"${s.batch?.department.code || "N/A"}"`,
      s.batch?.graduationYear || "N/A",
      s.cgpa ? s.cgpa.toFixed(2) : "N/A",
      s.completionPercentage || 0,
      s.skills.length,
      s.projects.length,
      s._count.applications + s._count.driveRegistrations,
    ];
    csvRows.push(row.join(","));
  }

  const csvContent = csvRows.join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stepbridge_cohort_export_${Date.now()}.csv"`,
    },
  });
}
