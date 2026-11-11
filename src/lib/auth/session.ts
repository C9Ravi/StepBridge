import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "../db/prisma";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "stepbridge_jwt_secret_development_key_32_characters_minimum_length"
);

export const COOKIE_NAME = "stepbridge_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string; // institutionId or companyId
  tenantType?: "INSTITUTION" | "COMPANY" | "NONE";
  status: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    // Check if user is still active in database (blocked server-side)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { status: true },
    });

    if (!user || user.status === "SUSPENDED") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  } catch {
    // Safe fallback when invoked in background workers, CLI, or test runners
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Safe fallback outside request scope
  }
}

export async function revokeServerSessions(userId: string) {
  try {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Ignore in case session table is empty
  }
}

// Generate random cryptographic single-use hex token
export function generateCryptoToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
