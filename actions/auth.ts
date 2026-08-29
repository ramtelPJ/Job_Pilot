"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions, createServerClient } from "@insforge/sdk/ssr";
import { getPostHogClient } from "@/lib/posthog-server";

const OAUTH_VERIFIER_COOKIE = "insforge_oauth_verifier";

export async function signInWithOAuth(provider: "google" | "github") {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });

  const { data, error } = await auth.signInWithOAuth(provider, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    skipBrowserRedirect: true,
  });

  if (error || !data?.url) {
    console.error("[actions/auth]", error);
    redirect("/login?error=oauth_failed");
  }

  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: crypto.randomUUID(),
      event: "sign_in_initiated",
      properties: {
        provider,
      },
    });
    await posthog.flush();
  }

  if (data.codeVerifier) {
    cookieStore.set(OAUTH_VERIFIER_COOKIE, data.codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
  }

  redirect(data.url);
}

export async function signOut() {
  const cookieStore = await cookies();

  // Capture sign_out before the session is cleared
  const insforgeServer = createServerClient({ cookies: cookieStore });
  const { data: userData } = await insforgeServer.auth.getCurrentUser();
  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: userData?.user?.id ?? crypto.randomUUID(),
      event: "sign_out",
    });
    await posthog.flush();
  }

  const auth = createAuthActions({ cookies: cookieStore });
  await auth.signOut();
  redirect("/login?loggedOut=1");
}
