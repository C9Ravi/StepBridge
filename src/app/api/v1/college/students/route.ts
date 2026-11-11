import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const inviteStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  batchId: z.string().uuid().optional(),
  cgpa: z.number().min(0).max(10).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const searchParams = req.nextUrl.searchParams;
  const batchId = searchParams.get("batchId");
  const search = searchParams.get("search");

  const students = await prisma.studentProfile.findMany({
    where: {
      institutionId,
      ...(batchId ? { batchId } : {}),
      ...(search
        ? {
            user: {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
              ],
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, status: true } },
      batch: { include: { department: true } },
      careerGoals: { where: { isPrimary: true }, include: { role: true } },
      skills: { include: { skill: true } },
      projects: true,
      resumes: true,
      placementOutcomes: { include: { drive: true } },
      roadmaps: { include: { role: true } },
      assessmentAttempts: { include: { assessment: true } },
      _count: { select: { applications: true, assessmentAttempts: true, driveRegistrations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ students });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const body = await req.json();
  const result = inviteStudentSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid student details", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  const { name, email, batchId, cgpa } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return apiError("A user with this email address is already registered.", "CONFLICT", 409);
  }

  const defaultPassword = await bcrypt.hash("Student@NITB2026!", 10);

  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: defaultPassword,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    const profile = await tx.studentProfile.create({
      data: {
        userId: user.id,
        institutionId,
        batchId: batchId || null,
        cgpa: cgpa || 7.0,
        headline: "Engineering Student",
        visibility: "INSTITUTION_ONLY",
        completionPercentage: 40,
      },
    });

    return { user, profile };
  });

  return apiSuccess({ student }, 201);
}
