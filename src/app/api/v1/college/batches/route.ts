import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createBatchSchema = z.object({
  departmentName: z.string().min(2),
  departmentCode: z.string().min(2).max(10),
  graduationYear: z.number().int().min(2020).max(2035),
  label: z.string().min(3),
});

export async function GET() {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const departments = await prisma.department.findMany({
    where: { institutionId },
    include: {
      batches: {
        include: {
          _count: { select: { students: true } },
        },
        orderBy: { graduationYear: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return apiSuccess({ departments });
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
  const result = createBatchSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid batch creation payload", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  const { departmentName, departmentCode, graduationYear, label } = result.data;

  // Find or create department
  let dept = await prisma.department.findFirst({
    where: { institutionId, code: departmentCode.toUpperCase() },
  });

  if (!dept) {
    dept = await prisma.department.create({
      data: {
        institutionId,
        name: departmentName,
        code: departmentCode.toUpperCase(),
      },
    });
  }

  const batch = await prisma.batch.create({
    data: {
      institutionId,
      departmentId: dept.id,
      graduationYear,
      label,
    },
  });

  return apiSuccess({ batch }, 201);
}
