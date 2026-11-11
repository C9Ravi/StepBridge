import { prisma } from "../db/prisma";
import {
  createSessionToken,
  setSessionCookie,
  hashToken,
  generateCryptoToken,
  SessionPayload,
} from "./session";

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export function getGoogleOAuthCredentials() {
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production" ? "https://stepbridge.in" : "http://localhost:3000");

  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/callback/google`;

  return { clientId, clientSecret, redirectUri, isConfigured: Boolean(clientId && clientSecret) };
}

/**
 * Generate PKCE code_verifier and code_challenge (S256)
 */
export async function generatePkcePair() {
  const codeVerifier = generateCryptoToken() + generateCryptoToken();
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64Digest = Buffer.from(digest)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { codeVerifier, codeChallenge: base64Digest };
}

/**
 * Generates the Google OAuth 2.0 authorization URL
 * Scopes: openid, email, profile (Identity only, no unnecessary scopes)
 */
export async function createGoogleAuthorizationUrl(options?: {
  role?: string;
  prompt?: string;
}) {
  const { clientId, redirectUri, isConfigured } = getGoogleOAuthCredentials();

  if (!isConfigured || !clientId) {
    throw new Error(
      "Google OAuth is not configured. Please set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in your .env file."
    );
  }

  const { codeVerifier, codeChallenge } = await generatePkcePair();
  const rawState = generateCryptoToken();
  
  // Encode state with optional requested role for new registration onboarding
  const statePayload = JSON.stringify({
    csrf: rawState,
    role: options?.role || "STUDENT",
  });
  const state = Buffer.from(statePayload).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: options?.prompt || "select_account",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return { authUrl, state, codeVerifier };
}

export interface GoogleOAuthTokens {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

/**
 * Exchange OAuth authorization code for Google ID token and Profile
 */
export async function exchangeGoogleCodeForProfile(
  code: string,
  codeVerifier: string
): Promise<{ tokens: GoogleOAuthTokens; profile: GoogleUserInfo }> {
  const { clientId, clientSecret, redirectUri, isConfigured } = getGoogleOAuthCredentials();

  if (!isConfigured || !clientId || !clientSecret) {
    throw new Error("Google OAuth credentials missing on server.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error("Google Token Exchange Failed:", errorBody);
    throw new Error(`Google token exchange failed: ${tokenResponse.statusText}`);
  }

  const tokens = await tokenResponse.json();

  // Fetch Google User Profile using access token
  const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userinfoResponse.ok) {
    throw new Error("Failed to retrieve Google user profile");
  }

  const profile: GoogleUserInfo = await userinfoResponse.json();

  return { tokens, profile };
}

/**
 * Safe Account Linking and User Sign-In/Provisioning
 * Prevents account takeover by ensuring email is verified by Google.
 */
export async function authenticateOrLinkGoogleUser(params: {
  profile: GoogleUserInfo;
  tokens: GoogleOAuthTokens;
  requestedRole?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { profile, tokens, requestedRole, ipAddress, userAgent } = params;

  if (!profile.email) {
    throw new Error("Google account did not return a valid email address.");
  }

  const normalizedEmail = profile.email.toLowerCase().trim();

  // Check if this specific Google account is already linked to a user
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: profile.sub,
      },
    },
    include: {
      user: {
        include: {
          studentProfile: true,
          institutionMemberships: true,
          companyMemberships: true,
        },
      },
    },
  });

  let user = existingAccount?.user || null;

  if (user) {
    // 1. Account already linked: Verify user account status
    if (user.status === "SUSPENDED") {
      throw new Error("Your account has been suspended. Please contact platform support.");
    }

    // Refresh Google access tokens on file
    await prisma.account.update({
      where: { id: existingAccount!.id },
      data: {
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || existingAccount!.refreshToken,
        expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
        idToken: tokens.id_token || null,
        tokenType: tokens.token_type || "Bearer",
      },
    });
  } else {
    // 2. Not linked by provider ID yet: Look up by normalized email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        studentProfile: true,
        institutionMemberships: true,
        companyMemberships: true,
      },
    });

    if (existingUserByEmail) {
      // SECURITY RULE: Account Takeover Prevention
      // Only link if Google has officially verified this email address!
      if (!profile.email_verified) {
        throw new Error(
          "Security alert: The Google account email is not verified. To prevent account takeover, linking is disallowed."
        );
      }

      if (existingUserByEmail.status === "SUSPENDED") {
        throw new Error("Your account has been suspended. Please contact platform support.");
      }

      user = existingUserByEmail;

      // Link Google Account to the existing user record
      await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: profile.sub,
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
          expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
          idToken: tokens.id_token || null,
          scope: tokens.scope || "openid email profile",
          tokenType: tokens.token_type || "Bearer",
        },
      });

      // Update user avatar and verify email if not already marked
      await prisma.user.update({
        where: { id: user.id },
        data: {
          image: user.image || profile.picture || null,
          emailVerifiedAt: user.emailVerifiedAt || new Date(),
        },
      });

      // Record audit event
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "OAUTH_ACCOUNT_LINKED",
          resource: `User:${user.id}`,
          metadata: JSON.stringify({ provider: "google", email: normalizedEmail }),
          ipAddress,
        },
      });
    } else {
      // 3. Brand New User: Auto-provision account with role
      // Super Admin CANNOT be created via public OAuth
      const allowedRole =
        requestedRole === "COLLEGE_ADMIN" || requestedRole === "RECRUITER"
          ? requestedRole
          : "STUDENT";

      const newUser = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name: profile.name || "StepBridge User",
            email: normalizedEmail,
            role: allowedRole,
            status: "ACTIVE",
            image: profile.picture || null,
            emailVerifiedAt: profile.email_verified ? new Date() : null,
          },
        });

        // Create OAuth Account
        await tx.account.create({
          data: {
            userId: createdUser.id,
            type: "oauth",
            provider: "google",
            providerAccountId: profile.sub,
            accessToken: tokens.access_token || null,
            refreshToken: tokens.refresh_token || null,
            expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
            idToken: tokens.id_token || null,
            scope: tokens.scope || "openid email profile",
            tokenType: tokens.token_type || "Bearer",
          },
        });

        // Initialize Student profile by default
        if (allowedRole === "STUDENT") {
          await tx.studentProfile.create({
            data: {
              userId: createdUser.id,
              headline: "StepBridge Student",
              visibility: "INSTITUTION_ONLY",
              completionPercentage: 20,
            },
          });
        }

        // Audit Log
        await tx.auditLog.create({
          data: {
            actorId: createdUser.id,
            action: "OAUTH_REGISTER",
            resource: `User:${createdUser.id}`,
            metadata: JSON.stringify({ provider: "google", role: allowedRole }),
            ipAddress,
          },
        });

        return createdUser;
      });

      user = await prisma.user.findUnique({
        where: { id: newUser.id },
        include: {
          studentProfile: true,
          institutionMemberships: true,
          companyMemberships: true,
        },
      });
    }
  }

  if (!user) {
    throw new Error("Failed to authenticate or initialize user account.");
  }

  // Derive tenant context
  let tenantId: string | undefined = undefined;
  let tenantType: "INSTITUTION" | "COMPANY" | "NONE" = "NONE";

  if (user.institutionMemberships && user.institutionMemberships.length > 0) {
    tenantId = user.institutionMemberships[0].institutionId;
    tenantType = "INSTITUTION";
  } else if (user.companyMemberships && user.companyMemberships.length > 0) {
    tenantId = user.companyMemberships[0].companyId;
    tenantType = "COMPANY";
  } else if (user.studentProfile?.institutionId) {
    tenantId = user.studentProfile.institutionId;
    tenantType = "INSTITUTION";
  }

  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId,
    tenantType,
    status: user.status,
  };

  const sessionToken = await createSessionToken(payload);
  await setSessionCookie(sessionToken);

  // Save session record in database
  const tokenHash = await hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: ipAddress || "127.0.0.1",
      deviceInfo: userAgent || "Google OAuth Web",
    },
  });

  // Record login audit
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "OAUTH_LOGIN",
      resource: `User:${user.id}`,
      ipAddress,
    },
  });

  // Determine post-login redirect path
  let redirectPath = "/student";
  if (user.role === "COLLEGE_ADMIN") redirectPath = "/college";
  else if (user.role === "RECRUITER") redirectPath = "/recruiter";
  else if (user.role === "SUPER_ADMIN") redirectPath = "/admin";

  return { user, sessionToken, redirectPath };
}
