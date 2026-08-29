import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { getPostHogClient } from "@/lib/posthog-server";

const OAUTH_VERIFIER_COOKIE = "insforge_oauth_verifier";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");

  if (!code) {
    const posthogMissing = getPostHogClient();
    if (posthogMissing) {
      posthogMissing.capture({
        distinctId: crypto.randomUUID(),
        event: "sign_in_failed",
        properties: { reason: "missing_code" },
      });
      await posthogMissing.flush();
    }
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const codeVerifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);

  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier);

  if (error || !data?.user) {
    console.error("[api/auth/callback]", error);
    const posthogFail = getPostHogClient();
    if (posthogFail) {
      posthogFail.capture({
        distinctId: crypto.randomUUID(),
        event: "sign_in_failed",
        properties: { reason: "exchange_error" },
      });
      await posthogFail.flush();
    }
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const posthog = getPostHogClient();
  if (posthog) {
    const userId = data.user.id;
    posthog.identify({
      distinctId: userId,
      properties: {
        email: data.user.email,
      },
    });
    posthog.capture({
      distinctId: userId,
      event: "sign_in_completed",
      properties: {
        provider: "oauth",
      },
    });
    await posthog.flush();
  }

  return response;
}
