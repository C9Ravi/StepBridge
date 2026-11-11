import { prisma } from "../src/lib/db/prisma";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestReport {
  name: string;
  passed: boolean;
  details: string;
}

const reports: TestReport[] = [];

function assert(condition: boolean, name: string, details: string) {
  reports.push({
    name,
    passed: condition,
    details,
  });
  const symbol = condition ? "✅ PASS" : "❌ FAIL";
  console.log(`${symbol} - ${name}: ${details}`);
}

async function runE2EVerification() {
  console.log("\n========================================================");
  console.log("🚀 STEPBRIDGE REGISTRATION VALIDATION E2E SUITE");
  console.log(`Target: ${BASE_URL}`);
  console.log("========================================================\n");

  const cleanEmails = [
    "live.test.student@jcbust.ac.in",
    "live.test.tpo@jcbust.ac.in",
    "live.test.recruiter@techcorp.io",
  ];

  await prisma.auditLog.deleteMany({
    where: { metadata: { contains: "live.test." } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: cleanEmails } },
  });

  // 1. Opening the page shows no validation error
  try {
    const res = await fetch(`${BASE_URL}/register`);
    const html = await res.text();
    const hasValidationError = html.includes("Validation failed") || html.includes("register-server-error");
    assert(
      res.status === 200 && !hasValidationError,
      "1. Opening Register Page",
      "Page loaded with 200 OK and contains zero 'Validation failed' errors on initial load."
    );
  } catch (err) {
    assert(false, "1. Opening Register Page", `Failed to load page: ${err}`);
  }

  // 2. Submitting empty form / invalid payload to register API
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    assert(
      res.status === 422 && json.error?.message !== "Validation failed" && json.error?.code === "VALIDATION_ERROR",
      "2. Empty Form Submission",
      `Returns 422 with specific message: "${json.error?.message}" rather than generic "Validation failed".`
    );
  } catch (err) {
    assert(false, "2. Empty Form Submission", `Error: ${err}`);
  }

  // 3. Invalid email displays an email-specific error
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "not-an-email",
        password: "ValidPassword123!",
        role: "STUDENT",
      }),
    });
    const json = await res.json();
    assert(
      res.status === 422 && json.error?.message === "Invalid email address",
      "3. Invalid Email Validation",
      `Returns 422 with email-specific error: "${json.error?.message}"`
    );
  } catch (err) {
    assert(false, "3. Invalid Email Validation", `Error: ${err}`);
  }

  // 4. Weak password displays password requirements
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@jcbust.ac.in",
        password: "short", // < 8 characters
        role: "STUDENT",
      }),
    });
    const json = await res.json();
    assert(
      res.status === 422 && json.error?.message.includes("8 characters"),
      "4. Weak Password Requirements",
      `Returns 422 with password-specific error: "${json.error?.message}"`
    );
  } catch (err) {
    assert(false, "4. Weak Password Requirements", `Error: ${err}`);
  }

  // 5. Valid Student form submission creates an account
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Live Student User",
        email: cleanEmails[0],
        password: "StudentPass2026!",
        role: "STUDENT",
      }),
    });
    const json = await res.json();
    assert(
      res.status === 201 && json.data?.role === "STUDENT" && json.data?.requiresVerification === true,
      "5. Valid Student Form Submission",
      `Account created (ID: ${json.data?.userId}, Role: ${json.data?.role}, RequiresVerification: ${json.data?.requiresVerification}).`
    );
  } catch (err) {
    assert(false, "5. Valid Student Form Submission", `Error: ${err}`);
  }

  // 6. Duplicate email shows a clear message (409 Conflict)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: cleanEmails[0],
        password: "AnotherPassword123!",
        role: "STUDENT",
      }),
    });
    const json = await res.json();
    assert(
      res.status === 409 &&
        json.error?.code === "CONFLICT" &&
        json.error?.message.includes("already exists"),
      "6. Duplicate Email Conflict",
      `Returns 409 Conflict with message: "${json.error?.message}"`
    );
  } catch (err) {
    assert(false, "6. Duplicate Email Conflict", `Error: ${err}`);
  }

  // 7. Student registration DB verification
  try {
    const studentUser = await prisma.user.findUnique({
      where: { email: cleanEmails[0] },
      include: { studentProfile: true, emailTokens: true },
    });
    assert(
      Boolean(studentUser && studentUser.studentProfile && studentUser.emailTokens.length > 0),
      "7. Student DB Verification",
      `User confirmed in SQLite with StudentProfile (completion: ${studentUser?.studentProfile?.completionPercentage}%) and EmailToken.`
    );
  } catch (err) {
    assert(false, "7. Student DB Verification", `Error: ${err}`);
  }

  // 8. College TPO registration works
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dr. Ramesh TPO",
        email: cleanEmails[1],
        password: "CollegePass2026!",
        role: "COLLEGE_ADMIN",
        institutionName: "JCBUST, YMCA Faridabad",
        city: "Faridabad",
      }),
    });
    const collegeUser = await prisma.user.findUnique({
      where: { email: cleanEmails[1] },
      include: { institutionMemberships: { include: { institution: true } } },
    });
    assert(
      res.status === 201 &&
        collegeUser?.role === "COLLEGE_ADMIN" &&
        collegeUser?.institutionMemberships[0]?.institution?.name === "JCBUST, YMCA Faridabad",
      "8. College TPO Registration",
      `TPO account created with Institution: "${collegeUser?.institutionMemberships[0]?.institution?.name}".`
    );
  } catch (err) {
    assert(false, "8. College TPO Registration", `Error: ${err}`);
  }

  // 9. Recruiter registration works
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ananya Recruiter",
        email: cleanEmails[2],
        password: "RecruiterPass2026!",
        role: "RECRUITER",
        companyName: "Innovate AI Global",
        location: "Bengaluru",
      }),
    });
    const recruiterUser = await prisma.user.findUnique({
      where: { email: cleanEmails[2] },
      include: { companyMemberships: { include: { company: true } } },
    });
    assert(
      res.status === 201 &&
        recruiterUser?.role === "RECRUITER" &&
        recruiterUser?.companyMemberships[0]?.company?.name === "Innovate AI Global",
      "9. Recruiter Registration",
      `Recruiter account created with Company: "${recruiterUser?.companyMemberships[0]?.company?.name}".`
    );
  } catch (err) {
    assert(false, "9. Recruiter Registration", `Error: ${err}`);
  }

  // 10. Google Registration endpoint & parameter preservation
  try {
    const res = await fetch(`${BASE_URL}/api/auth/google?role=COLLEGE_ADMIN&from=register`, {
      redirect: "manual",
    });
    const location = res.headers.get("location");
    // When unconfigured, gracefully redirects back to /register with error details
    assert(
      Boolean(
        res.status === 307 &&
          location?.includes("/register") &&
          location?.includes("OAuthConfigurationRequired")
      ),
      "10. Google Registration Route & Redirect",
      `Redirects cleanly back to /register with OAuthConfigurationRequired advisory: "${location}".`
    );
  } catch (err) {
    assert(false, "10. Google Registration Route & Redirect", `Error: ${err}`);
  }

  // 11. Login and logout after registration
  try {
    // Attempt login with newly registered student
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmails[0],
        password: "StudentPass2026!",
      }),
    });
    const loginJson = await loginRes.json();
    const setCookie = loginRes.headers.get("set-cookie") || "";

    const loginSuccess = loginRes.status === 200 && Boolean(loginJson.data?.user?.id);

    // Now attempt logout
    let logoutSuccess = false;
    if (loginSuccess) {
      const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Cookie: setCookie },
      });
      logoutSuccess = logoutRes.status === 200;
    }

    assert(
      loginSuccess && logoutSuccess,
      "11. Login and Logout Flow",
      `Login succeeded (Status ${loginRes.status}) and Logout cleared session successfully.`
    );
  } catch (err) {
    assert(false, "11. Login and Logout Flow", `Error: ${err}`);
  }

  // Cleanup
  await prisma.user.deleteMany({
    where: { email: { in: cleanEmails } },
  });

  console.log("\n========================================================");
  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  console.log(`📊 Summary: ${passed} / ${total} E2E Checks Passed`);
  console.log("========================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runE2EVerification().catch((err) => {
  console.error("Fatal error running verification:", err);
  process.exit(1);
});
