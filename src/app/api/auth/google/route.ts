import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleAuthorizationUrl,
  getGoogleOAuthCredentials,
} from "@/lib/auth/googleOAuth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "STUDENT";
    const prompt = searchParams.get("prompt") || "select_account";
    const from = searchParams.get("from");
    const returnPath = from === "register" ? "/register" : "/login";

    const { isConfigured } = getGoogleOAuthCredentials();

    if (!isConfigured) {
      // Graceful fallback for unconfigured Google Cloud credentials
      const redirectUrl = new URL(returnPath, req.url);
      redirectUrl.searchParams.set("error", "OAuthConfigurationRequired");
      redirectUrl.searchParams.set(
        "message",
        "Google OAuth credentials are not yet configured on this server. Please add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to your .env file."
      );
      return NextResponse.redirect(redirectUrl);
    }

    const { authUrl, state, codeVerifier } = await createGoogleAuthorizationUrl({
      role,
      prompt,
    });

    const response = NextResponse.redirect(authUrl);

    // Set secure short-lived cookies for state and PKCE verifier
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    };

    response.cookies.set("google_oauth_state", state, cookieOptions);
    response.cookies.set("google_code_verifier", codeVerifier, cookieOptions);

    return response;
  } catch (err: unknown) {
    console.error("Google OAuth Initiation Error:", err);
    let returnPath = "/login";
    try {
      if (new URL(req.url).searchParams.get("from") === "register") {
        returnPath = "/register";
      }
    } catch {}
    const redirectUrl = new URL(returnPath, req.url);
    redirectUrl.searchParams.set("error", "OAuthInitiateFailed");
    redirectUrl.searchParams.set(
      "message",
      err instanceof Error ? err.message : "Failed to initiate Google authentication"
    );
    return NextResponse.redirect(redirectUrl);
  }
}
