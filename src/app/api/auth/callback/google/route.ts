import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCodeForProfile,
  authenticateOrLinkGoogleUser,
} from "@/lib/auth/googleOAuth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      console.warn("Google OAuth callback error:", oauthError);
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("error", "OAuthAccessDenied");
      redirectUrl.searchParams.set(
        "message",
        oauthError === "access_denied"
          ? "Google sign-in was cancelled."
          : `Google authentication error: ${oauthError}`
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!code || !state) {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("error", "InvalidOAuthCallback");
      redirectUrl.searchParams.set("message", "Missing OAuth authorization code or state token.");
      return NextResponse.redirect(redirectUrl);
    }

    const storedState = req.cookies.get("google_oauth_state")?.value;
    const storedCodeVerifier = req.cookies.get("google_code_verifier")?.value;

    if (!storedState || storedState !== state) {
      console.error("State validation mismatch. Potential CSRF attempt.");
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("error", "OAuthStateMismatch");
      redirectUrl.searchParams.set(
        "message",
        "OAuth security verification failed. Please try signing in again."
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!storedCodeVerifier) {
      console.error("Missing PKCE code verifier in cookie.");
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("error", "OAuthMissingVerifier");
      redirectUrl.searchParams.set(
        "message",
        "OAuth session expired. Please attempt sign in again."
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Decode state to retrieve optional requested role
    let requestedRole = "STUDENT";
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
      if (decodedState.role) {
        requestedRole = decodedState.role;
      }
    } catch {
      // Fallback to STUDENT
    }

    // Exchange authorization code for Google profile
    const { tokens, profile } = await exchangeGoogleCodeForProfile(code, storedCodeVerifier);

    // Authenticate or safely link account
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Google OAuth Web";

    const { redirectPath, sessionToken } = await authenticateOrLinkGoogleUser({
      profile,
      tokens,
      requestedRole,
      ipAddress,
      userAgent,
    });

    const destinationUrl = new URL(redirectPath, req.url);
    const response = NextResponse.redirect(destinationUrl);

    // Explicitly attach session cookie to redirect response
    response.cookies.set("stepbridge_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Clean up temporary OAuth cookies
    response.cookies.delete("google_oauth_state");
    response.cookies.delete("google_code_verifier");

    return response;
  } catch (err: unknown) {
    console.error("Google OAuth Callback Processing Error:", err);
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("error", "OAuthProcessingFailed");
    redirectUrl.searchParams.set(
      "message",
      err instanceof Error ? err.message : "Failed to complete Google authentication"
    );
    return NextResponse.redirect(redirectUrl);
  }
}
