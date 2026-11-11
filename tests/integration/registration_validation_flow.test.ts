import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { passwordSchema } from "@/lib/validation/schemas";
import { NextRequest } from "next/server";
import { POST as registerRoute } from "@/app/api/v1/auth/register/route";
import { GET as googleRoute } from "@/app/api/auth/google/route";
import { createGoogleAuthorizationUrl } from "@/lib/auth/googleOAuth";

describe("StepBridge Registration Validation & Workflow End-to-End Suite", () => {
  const testStudentEmail = "reg.student.test@jcbust.ac.in";
  const testCollegeEmail = "reg.tpo.test@jcbust.ac.in";
  const testRecruiterEmail = "reg.recruiter.test@techfirm.io";

  beforeAll(async () => {
    // Cleanup any existing test users
    await prisma.auditLog.deleteMany({
      where: { metadata: { contains: "reg." } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testStudentEmail, testCollegeEmail, testRecruiterEmail],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup created test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testStudentEmail, testCollegeEmail, testRecruiterEmail],
        },
      },
    });
  });

  describe("1. Password Complexity & Validation Contract", () => {
    it("rejects password shorter than 8 characters", () => {
      const res = passwordSchema.safeParse("Ab1!");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("8 characters");
      }
    });

    it("rejects password without uppercase letter", () => {
      const res = passwordSchema.safeParse("password123!");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.message.includes("uppercase"))).toBe(true);
      }
    });

    it("rejects password without lowercase letter", () => {
      const res = passwordSchema.safeParse("PASSWORD123!");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.message.includes("lowercase"))).toBe(true);
      }
    });

    it("rejects password without a number", () => {
      const res = passwordSchema.safeParse("PasswordSecure!");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.message.includes("number"))).toBe(true);
      }
    });

    it("accepts valid 8-character password meeting all criteria", () => {
      const res = passwordSchema.safeParse("Step1234");
      expect(res.success).toBe(true);
    });
  });

  describe("2. Role Security & Self-Registration Safeguards", () => {
    it("disallows self-registering as SUPER_ADMIN", async () => {
      const superAdminPayload = {
        name: "Hacker Admin",
        email: "hacker@evil.com",
        password: "ValidPassword123!",
        role: "SUPER_ADMIN",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(superAdminPayload),
      });

      const res = await registerRoute(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.error?.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("3. Student Registration Flow", () => {
    it("successfully registers a student with initial profile and verification token", async () => {
      const payload = {
        name: "Ravi Test Student",
        email: testStudentEmail,
        password: "StudentPass123!",
        role: "STUDENT",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await registerRoute(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.role).toBe("STUDENT");
      expect(json.data.requiresVerification).toBe(true);

      // Verify database record
      const dbUser = await prisma.user.findUnique({
        where: { email: testStudentEmail },
        include: { studentProfile: true, emailTokens: true },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.role).toBe("STUDENT");
      expect(dbUser?.studentProfile).not.toBeNull();
      expect(dbUser?.emailTokens.length).toBeGreaterThan(0);
      expect(dbUser?.emailTokens[0].purpose).toBe("EMAIL_VERIFICATION");
    });

    it("rejects duplicate registration with clear conflict message", async () => {
      const payload = {
        name: "Duplicate Ravi",
        email: testStudentEmail, // already created in previous test
        password: "StudentPass123!",
        role: "STUDENT",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await registerRoute(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error?.code).toBe("CONFLICT");
      expect(json.error?.message).toContain("already exists");
    });
  });

  describe("4. College TPO Registration Flow", () => {
    it("requires institutionName for College TPO registration", async () => {
      const payload = {
        name: "Dr. TPO Incomplete",
        email: testCollegeEmail,
        password: "CollegePass123!",
        role: "COLLEGE_ADMIN",
        institutionName: "", // Missing
      };

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await registerRoute(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.error?.message).toContain("Institution name is required");
    });

    it("successfully registers College TPO with pending tenant creation", async () => {
      const payload = {
        name: "Dr. TPO Complete",
        email: testCollegeEmail,
        password: "CollegePass123!",
        role: "COLLEGE_ADMIN",
        institutionName: "JCBUST, YMCA Faridabad",
        city: "Faridabad",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await registerRoute(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.role).toBe("COLLEGE_ADMIN");

      // Verify institutional membership created in database
      const dbUser = await prisma.user.findUnique({
        where: { email: testCollegeEmail },
        include: { institutionMemberships: { include: { institution: true } } },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.institutionMemberships.length).toBe(1);
      expect(dbUser?.institutionMemberships[0].institution.name).toBe("JCBUST, YMCA Faridabad");
      expect(dbUser?.institutionMemberships[0].institution.verificationStatus).toBe("PENDING");
    });
  });

  describe("5. Recruiter Registration Flow", () => {
    it("requires companyName for Recruiter registration", async () => {
      const payload = {
        name: "Recruiter Incomplete",
        email: testRecruiterEmail,
        password: "RecruiterPass123!",
        role: "RECRUITER",
        companyName: " ", // Missing/whitespace
      };

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await registerRoute(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.error?.message).toContain("Company name is required");
    });

    it("successfully registers Recruiter with pending company tenant", async () => {
      const payload = {
        name: "Ananya Recruiter",
        email: testRecruiterEmail,
        password: "RecruiterPass123!",
        role: "RECRUITER",
        companyName: "Innovate Labs Global",
        location: "Bengaluru",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await registerRoute(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.role).toBe("RECRUITER");

      // Verify company membership created in database
      const dbUser = await prisma.user.findUnique({
        where: { email: testRecruiterEmail },
        include: { companyMemberships: { include: { company: true } } },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.companyMemberships.length).toBe(1);
      expect(dbUser?.companyMemberships[0].company.name).toBe("Innovate Labs Global");
      expect(dbUser?.companyMemberships[0].company.verificationStatus).toBe("PENDING");
    });
  });

  describe("6. Google OAuth Initiation & Redirect Guard", () => {
    it("redirects back to /register when from=register if credentials unconfigured", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/google?role=STUDENT&from=register"
      );

      const res = await googleRoute(req);
      expect(res.status).toBe(307); // NextResponse.redirect

      const location = res.headers.get("location");
      expect(location).toContain("/register");
      expect(location).toContain("OAuthConfigurationRequired");
    });

    it("preserves requested role parameter in OAuth authorization flow", async () => {
      // Simulate configured credentials to verify state payload
      process.env.AUTH_GOOGLE_ID = "test-client-id.apps.googleusercontent.com";
      process.env.AUTH_GOOGLE_SECRET = "test-client-secret";

      try {
        const { state } = await createGoogleAuthorizationUrl({ role: "RECRUITER" });
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
        expect(decoded.role).toBe("RECRUITER");
      } finally {
        delete process.env.AUTH_GOOGLE_ID;
        delete process.env.AUTH_GOOGLE_SECRET;
      }
    });
  });
});
