import { NextRequest, NextResponse } from "next/server";
import { GET as googleGet } from "../google/route";
import { GET as googleCallbackGet } from "../callback/google/route";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await context.params;
  const path = nextauth.join("/");

  if (path === "signin/google" || path === "signin") {
    return googleGet(req);
  }

  if (path === "callback/google") {
    return googleCallbackGet(req);
  }

  if (path === "providers") {
    return NextResponse.json({
      google: {
        id: "google",
        name: "Google",
        type: "oauth",
        signinUrl: "/api/auth/google",
        callbackUrl: "/api/auth/callback/google",
      },
    });
  }

  return NextResponse.json({ error: "Unsupported NextAuth route" }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await context.params;
  const path = nextauth.join("/");

  if (path === "signin/google") {
    return googleGet(req);
  }

  return NextResponse.json({ error: "Unsupported NextAuth route" }, { status: 404 });
}
