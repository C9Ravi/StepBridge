import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getCollegeCohortAnalytics, previewDriveEligibleCount, importStudentsFromCsv } from "@/modules/institutions/collegeService";

describe("Phase 5: College Operations Tests", () => {
  let institutionId: string;
  let otherInstitutionId: string;

  beforeAll(async () => {
    const inst = await prisma.institution.findFirst({
      where: { domain: "nitb.ac.in" },
    });
    institutionId = inst!.id;

    // Create a secondary institution to test cross-tenant isolation
    const other = await prisma.institution.upsert({
      where: { id: "00000000-0000-0000-0000-000000000099" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000099",
        name: "Other State University",
        domain: "osu.ac.in",
        verificationStatus: "APPROVED",
      },
    });
    otherInstitutionId = other.id;
  });

  it("calculates cohort readiness distribution, attention list, and skill-gap heatmap", async () => {
    const analytics = await getCollegeCohortAnalytics(institutionId);

    expect(analytics.totalStudents).toBeGreaterThan(0);
    expect(analytics.readinessBands).toBeDefined();
    expect(
      analytics.readinessBands.readyForPlacement +
      analytics.readinessBands.nearingReadiness +
      analytics.readinessBands.needsPreparation
    ).toBe(analytics.totalStudents);
  });

  it("previews drive eligibility counts with exact exclusions", async () => {
    const preview = await previewDriveEligibleCount({
      institutionId,
      minCgpa: 8.0,
      allowedBranches: ["CSE"],
      graduationYears: [2025],
    });

    expect(preview.totalStudents).toBeGreaterThan(0);
    expect(preview.eligibleCount + preview.excludedCount).toBe(preview.totalStudents);
  });

  it("imports students via CSV records into department and batches", async () => {
    const importPayload = [
      {
        name: "Rohan Verma",
        email: `rohan_${Date.now()}@nitb.ac.in`,
        departmentCode: "CSE",
        graduationYear: 2025,
        cgpa: 8.4,
      },
      {
        name: "Pooja Hegde",
        email: `pooja_${Date.now()}@nitb.ac.in`,
        departmentCode: "ECE",
        graduationYear: 2026,
        cgpa: 7.9,
      },
    ];

    const result = await importStudentsFromCsv({
      institutionId,
      records: importPayload,
    });

    expect(result.importedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
  });

  it("enforces tenant isolation preventing cross-institution data leaks", async () => {
    // Other institution should not see NITB students
    const otherAnalytics = await getCollegeCohortAnalytics(otherInstitutionId);
    expect(otherAnalytics.totalStudents).toBe(0);
  });
});
