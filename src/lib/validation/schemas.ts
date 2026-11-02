import { z } from "zod";

// Password rule: minimum 10 characters, at least 1 number, 1 uppercase, 1 lowercase
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter");

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .transform((val) => val.toLowerCase().trim());

// Authentication Schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["STUDENT", "COLLEGE_ADMIN", "RECRUITER"]),
  // Optional tenant details when registering as college or company
  institutionName: z.string().optional(),
  companyName: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10, "Invalid verification token"),
});

// Student Profile Schemas
export const studentProfileUpdateSchema = z.object({
  headline: z.string().max(160).optional(),
  bio: z.string().max(1000).optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
  cgpa: z.number().min(0).max(10).optional(),
  visibility: z.enum(["PRIVATE", "INSTITUTION_ONLY", "VERIFIED_RECRUITERS"]).optional(),
});

export const projectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  technologies: z.string().min(2).max(255),
  url: z.string().url().optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Placement Drive Schema
export const createDriveSchema = z.object({
  companyName: z.string().min(2).max(100),
  roleTitle: z.string().min(2).max(100),
  packageLpa: z.number().positive().optional(),
  driveDate: z.string().datetime(),
  deadline: z.string().datetime(),
  eligibilityRules: z.object({
    minCgpa: z.number().min(0).max(10).optional(),
    allowedBranches: z.array(z.string()).optional(),
    graduationYears: z.array(z.number()).optional(),
  }),
  notes: z.string().max(1000).optional(),
});

// Opportunity / Job Schema
export const createJobSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(["FULL_TIME", "INTERNSHIP"]),
  description: z.string().min(20).max(5000),
  location: z.string().min(2).max(100),
  salaryRange: z.string().max(50).optional(),
  deadline: z.string().datetime().optional(),
  skills: z.array(
    z.object({
      skillId: z.string().uuid(),
      requiredLevel: z.number().min(1).max(5),
      importance: z.enum(["REQUIRED", "PREFERRED"]),
    })
  ).min(1, "At least one skill is required"),
  eligibilityRules: z.array(
    z.object({
      ruleType: z.enum(["MIN_CGPA", "ALLOWED_BATCHES", "ALLOWED_DEPARTMENTS", "MAX_BACKLOGS"]),
      operator: z.enum(["GTE", "IN", "EQUALS"]),
      valueJson: z.string(),
    })
  ).optional(),
});

// Application Schema
export const applySchema = z.object({
  opportunityId: z.string().uuid(),
  resumeId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

// Roadmap Generation Schema
export const roadmapGenerationSchema = z.object({
  roleId: z.string().uuid(),
  horizonWeeks: z.union([z.literal(4), z.literal(8), z.literal(12)]),
  weeklyHours: z.number().min(5).max(60).default(15),
  preferences: z.string().max(500).optional(),
});
