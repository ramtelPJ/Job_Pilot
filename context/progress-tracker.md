# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 1 — Foundation
**Last completed:** 03 PostHog Initialization
**Next:** 04 Database Schema

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [ ] 04 Database Schema

### Phase 2 — Profile Page

- [ ] 05 Profile Page — Full UI
- [ ] 06 Profile Save Logic
- [ ] 07 AI Profile Extraction from Resume
- [ ] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [ ] 09 Find Jobs Page — Full UI
- [ ] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [ ] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- Homepage built pixel-matched against `context/designs/landing-page.png`. All CTAs ("Get Started", "Find Your First Match", "Start for free") link to `/login` — since auth (Feature 02) isn't built yet, the conditional "if authenticated -> /dashboard" redirect from the build plan is deferred. Revisit once auth exists.
- Added `--color-accent-deep: #4a2ec5` token to `@theme` in globals.css — needed for the logo's 45deg gradient endpoint per ui-tokens.md's Logo spec, which isn't covered by an existing token.
- Dark CTA buttons ("Get Started", "Start for free") use `bg-text-slate` (#272835) — sampled directly from the design, closest existing token match, not the purple `--color-accent`.
- Secondary hero/CTA button ("Find Your First Match") in the Hero uses `bg-accent-light`; the same button in the bottom CTA section uses `bg-surface` + `border-border` (standard secondary) — these differ pixel-for-pixel in the source design, not a mistake.
- Jobs-table mock (in "Manage Your Job Search" section) and dashboard preview mock (browser-chrome card in hero) are static illustrative data hand-built with Tailwind, not live components — no image assets existed in `public/`, and the design itself is a coded mockup, not a screenshot.
- Testimonial avatar for "Tom Wilson" uses an initials placeholder (no real photo asset available).
- Second highlighted feature-list item border ("AI-Powered Job Matching") uses `border-success-dark` (#007a55, sampled from design) — not accent, unlike the first feature section's highlighted item which does use `border-accent-dark`.
- **InsForge SDK reality check (Feature 02):** `context/architecture.md` and `context/library-docs.md` originally documented a `@insforge/ssr` package with `createBrowserClient(url, key)` / `createServerClient(url, key, {cookies})` — this doesn't exist. The MCP `fetch-docs`/`fetch-sdk-docs` tools' "auth-sdk" doc is also generic and doesn't mention SSR at all. The real, correct pattern (confirmed by installing `@insforge/sdk` and reading its bundled `SDK-REFERENCE.md` + `.d.ts` files) is: SSR helpers live at the `@insforge/sdk/ssr` and `@insforge/sdk/ssr/middleware` subpaths of the one `@insforge/sdk` package. Both context docs have been rewritten to match. **Lesson: for this SDK, the package's own bundled `SDK-REFERENCE.md` is more authoritative than the MCP `fetch-docs` tool for exact method/import signatures.**
- Auth is entirely server-initiated (no client-side auth SDK calls): `/login` is a Server Component whose OAuth buttons are `<form>`s bound to the `signInWithOAuth` Server Action (`actions/auth.ts`), which uses `createAuthActions()` to call InsForge and write session cookies in one step — raw tokens never reach client JS or app code. The PKCE `codeVerifier` is bridged across the redirect via a short-lived httpOnly cookie (`insforge_oauth_verifier`), read back by `app/api/auth/callback/route.ts`.
- Dropped the `(auth)/callback/page.tsx` from architecture.md's original folder plan — the callback is a **Route Handler** (`app/api/auth/callback/route.ts`), not a page, since it must write cookies and issue a redirect before any React render happens.
- Next.js 16 renamed `middleware.ts` → `proxy.ts` (function `middleware` → `proxy`) — confirmed against `node_modules/next/dist/docs/.../file-conventions/proxy.md` per AGENTS.md's "read the docs before writing code" instruction. Route protection lives in `proxy.ts` at the project root, using `updateSession()` from `@insforge/sdk/ssr/middleware`.
- Added `NEXT_PUBLIC_APP_URL` env var (not in the original code-standards.md table) — needed to build an absolute OAuth `redirectTo` URL from a Server Action, which has no `request` object to read the origin from.
- Homepage's "redirect to /dashboard if already authenticated" (from build-plan.md's Homepage Logic) is still deferred — `/dashboard` doesn't exist as a page yet (Feature 14, Phase 5). Revisit once it's built; redirecting there now would 404.
- Verified end-to-end with Playwright against the real InsForge backend: clicking "Continue with Google" on `/login` navigates all the way to a real `accounts.google.com` sign-in screen (proves env vars, the Server Action, and `createAuthActions` are all wired correctly). Also verified `proxy.ts` redirects unauthenticated `curl` requests to `/dashboard`, `/profile`, and `/find-jobs` back to `/login` (307).

---

- **PostHog (Feature 03):** found `lib/posthog-server.ts` and PostHog capture calls already present in `actions/auth.ts`/`app/api/auth/callback/route.ts` on disk before this feature was formally started (event names `sign_in_initiated`, `sign_in_completed`, `sign_in_failed`, `sign_out` — not in code-standards.md's original 4-event allowlist). Rather than rip out already-working code, formally added these to the approved events table (code-standards.md now lists 9), since the rule's own remedy is "update this list first," not "never add events."
- Invoked the installed `integration-nextjs-app-router` PostHog skill before writing any PostHog code (per AGENTS.md's "load the installed skill first" rule). It corrected assumptions baked into `architecture.md`/`library-docs.md`/`build-plan.md`: no `lib/posthog-client.ts` file, no React provider — current convention is `instrumentation-client.ts` at the project root (Next.js 15.3+ file convention, confirmed against `node_modules/next/dist/docs/`). Env var is `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, not the `NEXT_PUBLIC_POSTHOG_KEY` the docs originally had.
- Added `components/analytics/IdentifyUser.tsx` (root layout, server-fed) and `components/analytics/ResetAnalytics.tsx` (`/login?loggedOut=1`) to properly wire `identify()`/`reset()` given our OAuth flow is entirely server-initiated (no client-side sign-in/out code to hook into directly, unlike the typical client-side-form example in PostHog's own docs).
- Added `cta_clicked` (properties: `cta`, `location`) as the one new client-side event, via a shared `components/analytics/TrackedLink.tsx` — instrumented on the 5 marketing CTA buttons (Navbar, Hero ×2, CTASection ×2). Did not touch the original 4 approved events (job_search_started, job_found, profile_completed, company_researched) — none of their features exist yet.
- `getPostHogClient()` is a module-level singleton (not per-request) — every call site uses `await posthog.flush()`, never `shutdown()`, per the PostHog skill's explicit singleton-vs-per-request rule.
- `app/layout.tsx` is now `async` and calls `createInsforgeServer().auth.getCurrentUser()` on every request (needed so `IdentifyUser` can identify an already-logged-in user on page refresh) — this makes every page dynamic, consistent with code-standards.md's "uncached by default" rule, not a new pattern.

## Notes

- No shadcn/ui components installed yet — homepage uses plain Tailwind markup only. `lucide-react` was installed (already an approved dependency) for icons. lucide-react ships no brand icons (Google/GitHub) — the login page uses inline SVGs for those.
- Verified visually via Playwright screenshot against `context/designs/landing-page.png` — no console errors on load.
- `@insforge/sdk` installed (replaces the incorrectly-assumed `@insforge/ssr`). Real anon key + backend URL are in `.env.local` (gitignored). Google and GitHub OAuth are confirmed enabled on the backend via `get-backend-metadata`.
