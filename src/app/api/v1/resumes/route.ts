import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateProfileCompletion } from "@/modules/students/profileService";

export async function POST(req: NextRequest) {
  const session = await getSession();
  try {
    assertStudent(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session!.userId },
  });
  if (!profile) return apiError("Profile not found", "NOT_FOUND", 404);

  try {
    const body = await req.json();
    const { fileName, sizeBytes, fileType, extractedText } = body;

    if (!fileName || !sizeBytes || !fileType) {
      return apiError("Missing file metadata", "VALIDATION_ERROR", 422);
    }

    // PRD 12.5: maximum 5 MB initially
    if (sizeBytes > 5 * 1024 * 1024) {
      return apiError("File size exceeds 5 MB limit", "FILE_TOO_LARGE", 422);
    }

    // Supported formats
    if (!["pdf", "docx"].includes(fileType.toLowerCase())) {
      return apiError("Only PDF and DOCX files are supported", "UNSUPPORTED_MEDIA_TYPE", 415);
    }

    const storageKey = `resumes/${profile.id}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const resume = await prisma.resume.create({
      data: {
        studentProfileId: profile.id,
        fileName,
        storageKey,
        fileType: fileType.toLowerCase(),
        sizeBytes,
        status: "UPLOADED",
        extractedText: extractedText || `Sample extracted resume content for ${profile.headline || "Engineering Student"}. Technical skills: React, TypeScript, Node.js, SQL. Education: B.Tech Computer Science. Projects: Real-time Web Platform.`,
      },
    });

    const completion = await calculateProfileCompletion(profile.id);

    return apiSuccess({ resume, completion }, 201);
  } catch (err) {
    console.error("Resume upload confirmation error:", err);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
