import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const isDevelopment = process.env.NODE_ENV === "development";

// Skip init in local development so dev-only exceptions never reach error tracking.
if (token && !isDevelopment) {
  posthog.init(token, {
    api_host: "/ingest", // proxied via next.config.ts rewrites to avoid ad blockers
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-05-30",
  });
} else if (!token && isDevelopment) {
  console.error(
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
      "this causes events to be silently missed. This error stops appearing once " +
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}
