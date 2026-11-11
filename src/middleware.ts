import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "stepbridge_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "stepbridge_jwt_secret_development_key_32_characters_minimum_length"
);

interface TokenPayload {
  userId: string;
  email: string;
  role: "STUDENT" | "COLLEGE_ADMIN" | "RECRUITER" | "SUPER_ADMIN";
  status: string;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let session: TokenPayload | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = payload as unknown as TokenPayload;
    } catch {
      session = null;
    }
  }

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isStudentRoute = pathname.startsWith("/student");
  const isCollegeRoute = pathname.startsWith("/college");
  const isRecruiterRoute = pathname.startsWith("/recruiter");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute = isStudentRoute || isCollegeRoute || isRecruiterRoute || isAdminRoute;

  // 1. If user is already authenticated and visits /login or /register, redirect to their workspace
  if (isAuthRoute && session && session.status !== "SUSPENDED") {
    if (session.role === "STUDENT") return NextResponse.redirect(new URL("/student", req.url));
    if (session.role === "COLLEGE_ADMIN") return NextResponse.redirect(new URL("/college", req.url));
    if (session.role === "RECRUITER") return NextResponse.redirect(new URL("/recruiter", req.url));
    if (session.role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
  }

  // 2. If visiting a protected workspace without valid authentication, redirect to /login
  if (isProtectedRoute) {
    if (!session || session.status === "SUSPENDED") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 3. Role-based authorization enforcement
    // Super Admins can inspect any workspace
    if (session.role === "SUPER_ADMIN") {
      const res = NextResponse.next();
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.headers.set("Pragma", "no-cache");
      return res;
    }

    if (isStudentRoute && session.role !== "STUDENT") {
      return NextResponse.redirect(new URL(getRoleHome(session.role), req.url));
    }

    if (isCollegeRoute && session.role !== "COLLEGE_ADMIN") {
      return NextResponse.redirect(new URL(getRoleHome(session.role), req.url));
    }

    if (isRecruiterRoute && session.role !== "RECRUITER") {
      return NextResponse.redirect(new URL(getRoleHome(session.role), req.url));
    }

    if (isAdminRoute) {
      return NextResponse.redirect(new URL(getRoleHome(session.role), req.url));
    }

    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  }

  return NextResponse.next();
}

function getRoleHome(role: string): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "COLLEGE_ADMIN":
      return "/college";
    case "RECRUITER":
      return "/recruiter";
    case "SUPER_ADMIN":
      return "/admin";
    default:
      return "/login";
  }
}

export const config = {
  matcher: [
    "/student/:path*",
    "/college/:path*",
    "/recruiter/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
