# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to JobPilot.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## InsForge

**Check first:** Check AGENTS.md for an installed InsForge skill. If an InsForge MCP server is configured — use it. The skill/MCP will have the latest API patterns.

**Package note:** the real package is `@insforge/sdk` — there is no separate `@insforge/ssr` package. The SSR helpers (`createBrowserClient`, `createServerClient`, `updateSession`, `createAuthActions`, `createRefreshAuthRouter`) live at the `@insforge/sdk/ssr` and `@insforge/sdk/ssr/middleware` subpaths. This was confirmed by installing the package and reading its bundled `SDK-REFERENCE.md` and `.d.ts` files directly — the generic `fetch-docs`/`fetch-sdk-docs` MCP prose doesn't mention the SSR subpaths at all, so when in doubt about exact method signatures, prefer `node_modules/@insforge/sdk/SDK-REFERENCE.md` over the MCP tool's auth-sdk doc.

### Client vs Server vs Actions

Three separate surfaces — never mix them:

```typescript
// lib/insforge-client.ts — browser context only
// Read-only auth surface (getCurrentUser, getProfile) — cannot sign in/out.
import { createBrowserClient } from "@insforge/sdk/ssr";

export const insforge = createBrowserClient();
```

```typescript
// lib/insforge-server.ts — server context only (Server Components, API routes, agent functions)
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

export async function createInsforgeServer() {
  return createServerClient({ cookies: await cookies() });
}
```

```typescript
// actions/auth.ts — the only place sign-in/sign-out/session-mutating calls happen.
// createAuthActions writes session cookies itself; raw tokens never reach app code.
("use server");
import { cookies } from "next/headers";
import { createAuthActions } from "@insforge/sdk/ssr";

const auth = createAuthActions({ cookies: await cookies() });
```

**Rules:**

- Browser client (`lib/insforge-client.ts`) — Client Components, Database/Storage/Realtime reads, browser-side session reads
- Server client (`lib/insforge-server.ts`) — Server Components, API routes, Server Actions, agent functions
- Auth actions (`createAuthActions`, only inside `actions/auth.ts` and `app/api/auth/callback/route.ts`) — the only code that calls `signInWithOAuth` / `exchangeOAuthCode` / `signOut`, because only these contexts can write cookies
- Never use browser client in server context
- Never use server client in browser context
- Never call auth mutation methods (`signInWithOAuth`, `signUp`, `signOut`, etc.) from a Client Component — sign-in is always server-initiated so the refresh token stays httpOnly and server-owned

---

### Auth

```typescript
// Get current user in server context
const insforge = await createInsforgeServer();
const { data, error } = await insforge.auth.getCurrentUser();
if (!data.user) redirect("/login");
```

OAuth (Google/GitHub) is PKCE-based and always server-initiated — see `actions/auth.ts` and `app/api/auth/callback/route.ts` in architecture.md's "InsForge Client Pattern" section for the full sign-in → callback → cookie flow. Route protection lives in `proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts` — see AGENTS.md's warning about breaking changes) via `updateSession()` from `@insforge/sdk/ssr/middleware`.

---

### DB Queries

Table queries are namespaced under `.database`, not directly on the client:

```typescript
// Read
const { data, error } = await insforge.database
  .from("jobs")
  .select("*")
  .eq("user_id", user.id)
  .order("found_at", { ascending: false });

// Insert
const { data, error } = await insforge.database
  .from("jobs")
  .insert({ user_id: user.id, title, company, match_score })
  .select()
  .single();

// Update
const { error } = await insforge.database
  .from("jobs")
  .update({ company_research: dossier })
  .eq("id", jobId)
  .eq("user_id", user.id); // always scope to user
```

**Rules:**

- Always scope queries to `user_id` — never query without user filter
- Always handle the `error` return — never assume success
- Use `.single()` when expecting exactly one row
- Mutations (`insert`/`update`/`delete`) return `{ data: null, error }` unless `.select()` is chained

---

### Storage

```typescript
// Upload file — path only, no options object. Uploading to an existing
// path REPLACES the object in place (standard PUT semantics) — there is no
// separate `upsert` flag or `contentType` option.
const { data, error } = await insforge.storage
  .from("resumes")
  .upload(`${userId}/resume.pdf`, fileBlob); // File | Blob, not a raw Buffer

// data on success: { bucket, key, size, mimeType, uploadedAt, url } — the
// public URL is already included, no separate getPublicUrl() call needed
// unless constructing the URL without an upload response in hand.
```

Server-side (e.g. resume generation from `@react-pdf/renderer`'s `renderToBuffer`), wrap the `Buffer` in a `Blob` before uploading: `new Blob([buffer], { type: "application/pdf" })`.

**Storage paths:**

- Base resume: `resumes/{user_id}/resume.pdf`

**Rules:**

- Uploading to the same path always replaces the existing file — no `upsert` flag needed
- Always save the returned `url` back to the DB after upload
- Never write files to disk — always upload a `Blob`/`File` directly to storage

---

## Adzuna API

**Check first:** Check AGENTS.md for an installed Adzuna skill. If none exists — use this file and the official Adzuna API docs.

### Job Search

```typescript
// lib/adzuna.ts
export async function searchJobs(
  jobTitle: string,
  location: string,
  country: string = "us",
): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    what: jobTitle,
    category: "it-jobs", // always filter to IT jobs
    results_per_page: "10",
    "content-type": "application/json",
  });

  // Only add where if location is provided
  if (location) {
    params.set("where", location);
  }

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
```

### Response Shape

Each Adzuna job result contains:

```typescript
type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string; // snippet only — not full description
  redirect_url: string; // Adzuna tracking URL → redirects to actual job
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted: "0" | "1"; // "1" means salary is estimated
  contract_type?: string;
  created: string; // ISO date string
  category: { tag: string; label: string };
};
```

### Saving Jobs to DB

```typescript
// Map Adzuna result to jobs table
const jobRecord = {
  user_id: userId,
  run_id: runId,
  source: "search", // always 'search' for Adzuna jobs
  source_url: job.redirect_url,
  external_apply_url: job.redirect_url,
  title: job.title,
  company: job.company.display_name,
  location: job.location.display_name,
  salary: job.salary_min
    ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max! / 1000)}k`
    : null,
  job_type: job.contract_type || "fulltime",
  about_role: job.description, // Adzuna returns snippet — used as description
  match_score: scoredJob.matchScore,
  match_reason: scoredJob.matchReason,
  matched_skills: scoredJob.matchedSkills,
  missing_skills: scoredJob.missingSkills,
  found_at: new Date().toISOString(),
};
```

**Rules:**

- Always include `category=it-jobs` — never search Adzuna without this filter
- Never pass `where` if location is empty — omit the parameter entirely
- `source` is always `'search'` for Adzuna jobs — never any other value
- `salary_is_predicted: "1"` means Adzuna estimated the salary — this is normal
- Adzuna description is a snippet — Claude scores from it, not a full description
- Default country to `'us'` — support `gb`, `au`, `ca` as alternatives

---

## Browserbase + Stagehand

**Verified end-to-end (Feature 13 — real Browserbase session, real company site, real Claude synthesis).** The pattern below replaces an earlier draft that assumed a completely different, older API (`new Stagehand({ env, browserbaseSessionID, ... })`, `stagehand.context.activePage()`, `extract({ instruction, schema })` as one object argument). The installed version (`@browserbasehq/stagehand` v4) works differently — confirmed by reading its real `.d.mts` type definitions and running the actual pipeline, not from training data.

### Two critical gotchas before writing any code here

1. **Zod version must match exactly, or `extract()`'s schema overload silently fails to type-check.** Stagehand v4 bundles its own `zod` (pinned to an exact patch version, e.g. `4.4.3`) as a dependency. If the project's own top-level `zod` is a different version, TypeScript treats the two `ZodType`s as structurally incompatible ("`_zod.version.minor` types are incompatible") and `stagehand.extract(instruction, schema)` silently falls back to its untyped single-argument overload, returning `{ extraction: string }` instead of your schema's shape. **Fix: pin the project's own `zod` dependency in `package.json` to the exact version Stagehand's own `package.json` declares** (check `node_modules/@browserbasehq/stagehand/package.json`'s `dependencies.zod`), not a caret range. This dedupes to one shared copy across the whole `node_modules` tree.
2. **Bundling breaks Stagehand's own asset resolution under Turbopack.** Stagehand resolves its bundled browser-extension assets relative to its own module location at runtime (`new URL("../", import.meta.url)`). If Next.js bundles it into a route's own Turbopack chunk, that relative path breaks with `Module not found: Can't resolve '../'`. **Fix: add `"@browserbasehq/stagehand"` to `serverExternalPackages` in `next.config.ts`** — same class of fix as `pdf-parse` above.

### Launching a session and creating Stagehand

```typescript
// lib/browserbase.ts
import { browserbase, type StagehandBrowser } from "@browserbasehq/stagehand";

export async function launchBrowserbaseSession(): Promise<StagehandBrowser> {
  return browserbase.launch({
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    api_timeout: 180, // seconds — NOT `timeout`; minimum 60, comfortably covers homepage + 3 sub-pages
  });
}
```

```typescript
// lib/stagehand.ts
import { Stagehand, type StagehandBrowser } from "@browserbasehq/stagehand";

export async function createStagehand(browser: StagehandBrowser): Promise<Stagehand> {
  return Stagehand.create({
    browser,
    model: {
      // Stagehand's own model catalog (its internal act/extract/observe reasoning —
      // separate from this project's own Claude calls via lib/claude.ts) does not
      // yet list "claude-opus-5". "claude-sonnet-5" is the newest Anthropic model
      // it does support — verify Stagehand's ModelNameSchema in its .d.mts if this
      // ever needs revisiting, since its catalog is independent of Anthropic's own.
      modelName: "anthropic/claude-sonnet-5",
      apiKey: process.env.CLAUDE_API_KEY,
    },
  });
}
```

`browserbase.launch()` both creates the Browserbase session AND returns the connected `StagehandBrowser` — there's no separate `@browserbasehq/sdk` session-creation step needed for this flow (that package is still a direct dependency since `browserbase.launch()`'s options type is `Browserbase.SessionCreateParams` under the hood, but you never construct its client directly here).

### Using a page and extract()

```typescript
const [page] = await browser.context.pages();
await page.goto(homepageUrl);

const result = await stagehand.extract(
  "Instruction string as the FIRST argument, not an { instruction, schema } object.",
  z.object({
    oneLiner: z.string(),
    // ...
  }),
);

const data = result.data; // already parsed against your schema — not result itself
```

`extract()` takes the instruction and schema as **two separate positional arguments**, and returns `{ data, ... }` — the parsed object is under `.data`, not the top-level result.

### act() and cleanup

```typescript
try {
  await stagehand.act("Click the About link in the navigation");
} catch (error) {
  await logAgentError(runId, jobId, error);
}

// Cleanup — call both, each independently guarded so a cleanup failure
// never masks the real error or crashes the route:
await stagehand.close().catch(() => {});
await browser.close().catch(() => {});
```

**Rules:**

- Always use `extract()` with a Zod schema — never parse raw HTML or use regex
- Always wrap every `act()` and `extract()` in try/catch
- Always call both `stagehand.close()` and `browser.close()` in a `finally` block — never leave a session open even if research fails
- Single session per research run — never parallel sessions
- Max 3 sub-pages — prefer about/engineering/blog/product over careers
- Project ID always from `process.env.BROWSERBASE_PROJECT_ID` — never hardcode
- **A `pageLinks`-style schema field must explicitly say "the real href/URL attribute, not the visible link text"** — without that, the model returns display labels like `"Careers"` or `"Blog"` instead of navigable URLs, which silently breaks every sub-page visit (confirmed by real testing: the first pass returned link text, not hrefs, and `new URL("Careers", homepage)` resolved to a plausible-looking but wrong guess)
- Browserbase sessions run on Browserbase's own cloud infrastructure, not inside the Next.js process — do not add `maxDuration` or route-level timeout config to accommodate session length
- Real-world latency for a content-rich site (multiple sub-pages actually found and visited) can run close to two minutes, not the 20-60 seconds one might assume from a simple 1-page case — size any client-side timeout or loading-state copy accordingly

### Company Research Pattern (Feature 13)

Three-step process: homepage extraction → sub-page extraction → Claude synthesis. Job description and user profile come from DB — never re-fetch what you already have. Browser's only job is the company website.

```typescript
const homepage = await stagehand.extract(
  "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer — return each link's real href/URL attribute, not its visible label text.",
  z.object({
    oneLiner: z.string().describe("What the company does in one sentence"),
    productSummary: z.string().describe("What they build/sell and who it's for"),
    signals: z.array(z.string()).describe("Funding, notable customers, scale, mission, recent news"),
    pageLinks: z.array(
      z.object({
        url: z.string().describe("The link's actual href/URL attribute, never the visible text"),
        kind: z.enum(["about", "careers", "blog", "engineering", "product", "team", "other"]),
      }),
    ),
  }),
);

// If oneLiner and productSummary are both empty, OR the extract/navigation call itself
// throws — bail to synthesis with job description and profile only. Same fallback path
// for both cases, not two separate ones.
if (!homepage.data.oneLiner && !homepage.data.productSummary) {
  // proceed to synthesis with companyResearch = null
}

// Sub-page extraction (max 3, prefer about/engineering/blog/product over careers).
// Resolve relative hrefs against the homepage URL before navigating:
const url = new URL(link.url, homepageUrl).toString();
await page.goto(url);
const subPage = await stagehand.extract(
  "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
  z.object({
    keyPoints: z.array(z.string()),
    technologies: z.array(z.string()).describe("Specific languages, frameworks, tools, platforms"),
    valuesOrCulture: z.array(z.string()).describe("Stated values, working style, team norms"),
    notable: z.array(z.string()).describe("Customers, funding, scale, projects, awards"),
  }),
);
```

Claude synthesis runs after the browser session is fully closed, via `client.messages.parse()` (see the Claude section below) — not a hand-rolled `openai.chat.completions.create()` call. `sources` is assembled by code from the URLs actually visited (homepage + each successfully read sub-page), never written by the model itself — this keeps the field honest even if the model would otherwise paraphrase or invent a page reference.

**Dossier fields:**

| Field           | Type     | Purpose                                             |
| --------------- | -------- | ---------------------------------------------------- |
| companyOverview | string   | What the company does                               |
| techStack       | string[] | Technologies they use                               |
| culture         | string[] | Values and working style                            |
| whyThisRole     | string   | Why this role exists                                |
| yourEdge        | string[] | Specific links between THIS candidate and this role |
| gapsToAddress   | string[] | Missing skills reframed as strategy                 |
| smartQuestions  | string[] | Questions that show real research                   |
| interviewPrep   | string[] | Topics to prepare for this role                     |
| sources         | string[] | Real URLs the browser actually visited, assembled by code |

**Rules:**

- Model is always `claude-opus-5` for the synthesis call (via `lib/claude.ts`) — Stagehand's own internal page-reading model (`anthropic/claude-sonnet-5`, set in `lib/stagehand.ts`) is a separate, unrelated choice and does not change this
- No `temperature` — same hard constraint as every other Claude call in this project; grounding comes from the system prompt's explicit rules plus `output_config.effort: "low"`
- **`max_tokens: 4096` for company research synthesis, not 2048** — confirmed by real testing: a content-rich company (multiple sub-pages successfully read) produces enough source material that Claude's own 8-field, several-bullet-list response genuinely needs the extra headroom; 2048 truncated mid-JSON and threw a parse error
- Max 3 sub-pages — never exceed this
- Always close both `stagehand` and `browser` in a `finally` block — never leave sessions open even if research fails
- Job description and profile always come from DB — never re-fetch via browser
- If browser research returns empty (or errors) — still run synthesis with job + profile only
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never skip them

## Claude (Anthropic API)

**Check first:** Check AGENTS.md for an installed `claude-api` skill and load it before touching any Claude code — it corrected the pattern below (structured output via `.parse()` + Zod, not a hand-parsed JSON string; `temperature` is rejected on `claude-opus-5`, not just discouraged).

### Client

```typescript
// lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";

let claudeClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  }
  return claudeClient;
}
```

### Structured Output (`.parse()` + Zod)

Verified end-to-end (Feature 07 — real PDF, real API call): `client.messages.parse()` with `zodOutputFormat()` returns a `parsed_output` that's already validated against the schema — no manual `JSON.parse()`, no hand-written "return only valid JSON" prompting.

```typescript
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClaudeClient } from "@/lib/claude";

const ResultSchema = z.object({
  matchScore: z.number(),
  matchReason: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

const claude = getClaudeClient();
const response = await claude.messages.parse({
  model: "claude-opus-5",
  max_tokens: 1024,
  output_config: {
    format: zodOutputFormat(ResultSchema),
    effort: "low", // deterministic scoring/extraction — not creative writing
  },
  system: "You are a job matching assistant.",
  messages: [{ role: "user", content: "Your prompt here" }],
});

if (!response.parsed_output) {
  // Claude declined to produce a schema-conforming response — handle as a failure, don't assume shape
}
const result = response.parsed_output; // already typed + validated, no JSON.parse
```

**`output_config.effort` (replaces `temperature` on `claude-opus-5`):**

- `low` — matching, scoring, extraction, research synthesis — deterministic, cheapest
- `medium`/`high` — resume generation — more natural phrasing, still not `xhigh`/`max` (no reasoning-heavy math here)

**Max tokens:**

- Job matching + scoring: `1024`
- Company research synthesis: `4096` — measured, not assumed (Feature 13): `2048` truncated a real dossier mid-JSON on a content-rich company and threw a parse error
- Resume generation: `4096`
- Profile extraction from resume: `4096`

**Rules:**

- Model string is always `claude-opus-5` — this is the project's only model; never substitute Sonnet/Haiku/Fable without being asked
- **Never pass `temperature`, `top_p`, or `top_k` to `claude-opus-5`** — sampling params are rejected (400) while adaptive thinking is on, which is the default on this model. Control determinism via `output_config.effort`, not sampling
- Always use `client.messages.parse()` with a Zod schema for structured data — never `client.messages.create()` + manual `JSON.parse()` for anything that needs a guaranteed shape
- Always check `response.parsed_output` is non-null before using it — a null means Claude didn't produce a schema-conforming response
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70
- Company research synthesis must always return a complete dossier — never return empty even if browser research failed
- `pdf-parse` is v2 — `import { PDFParse } from "pdf-parse"`, not the v1 `import pdf from "pdf-parse"` shape. `new PDFParse({ data: buffer }).getText()` returns `{ text }`; always `await parser.destroy()` in a `finally` block afterward to free memory

---

## PostHog

**Check first:** Check AGENTS.md for an installed PostHog skill. This project has the `integration-nextjs-app-router` PostHog skill installed — load it before touching any PostHog code; it corrected several assumptions below (env var name, no `lib/posthog-client.ts`/provider, no `capture_pageview` option in the current `defaults` API).

**Package note:** `posthog-js` (browser) is never imported server-side, and `posthog-node` (server) is never imported client-side — they are separate packages, not one universal SDK.

### Client Setup (Browser) — `instrumentation-client.ts`

Next.js 15.3+ has a dedicated file convention for client-side init — no `lib/posthog-client.ts`, no React provider, no manual "mounted" check:

```typescript
// instrumentation-client.ts (project root — same level as app/)
import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-05-30",
  });
} else if (process.env.NODE_ENV === "development") {
  console.error("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured");
}
```

```typescript
// Capture event client-side — any Client Component, no import setup needed beyond `posthog-js`
import posthog from "posthog-js";
posthog.capture("cta_clicked", { cta: "get_started", location: "hero" });
```

Autocapture (clicks, form submissions, pageviews) is on by default — don't add manual `$pageview` tracking or a `capture_pageview: false` option; only instrument named business-action events (see `code-standards.md`'s PostHog Events table).

### Server Setup — `lib/posthog-server.ts`

A module-level **singleton**, not a per-request `new PostHog()`:

```typescript
// lib/posthog-server.ts
import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === "development") {
      console.error("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured");
    }
    return null; // production: silent no-op, never throws
  }
  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}
```

```typescript
// Usage in a Route Handler / Server Action
const posthog = getPostHogClient();
if (posthog) {
  posthog.capture({
    distinctId: userId,
    event: "company_researched",
    properties: { userId, jobId, company },
  });
  await posthog.flush(); // NOT shutdown() — this is a shared singleton, shutdown() would tear it down for the whole process
}
```

**Rules:**

- `getPostHogClient()` returns `null` when the token env var is missing — every call site must guard with `if (posthog)`, never assume it exists. A missing PostHog config must never break the app (dev gets a loud `console.error`; production stays a silent no-op)
- Because it's a **singleton**, always `await posthog.flush()` after capturing — never `await posthog.shutdown()` (that would kill the client for every subsequent request in the same server process)
- `flushAt: 1` and `flushInterval: 0` always set — Next.js route handlers/Server Actions are short-lived, and the batched send happens after `capture()` returns, so without an awaited `flush()` the event can be silently dropped when the function exits
- Event names must match exactly the list in `code-standards.md` — update that list first before adding a new one
- Never put PII (email, name, phone, address) in `capture()` properties — PII belongs in `identify()` person properties only
- `posthog.identify(userId, { email })` is called from `components/analytics/IdentifyUser.tsx` (a Client Component rendered in the root layout, fed by a server-side `getCurrentUser()` call) — covers both "on login" and "on page refresh while already logged in" in one place, since our OAuth flow never runs client-side auth code
- `posthog.reset()` is called from `components/analytics/ResetAnalytics.tsx`, rendered only on `/login?loggedOut=1` (the redirect target `actions/auth.ts`'s `signOut()` uses) — never on a plain anonymous page load, which would incorrectly discard anonymous history
- Auth events (`sign_in_initiated/completed/failed`, `sign_out`) are captured server-side via `getPostHogClient()`, not client-side — the sign-in/out flow is entirely Server Action/Route Handler driven, so there's no client JS moment to hook into

---

## @react-pdf/renderer

**Verified working (Feature 08)** — `renderToBuffer` matches this exact signature (`(document: ReactElement<DocumentProps>) => Promise<Buffer>`), confirmed against the installed package's own `.d.ts` files. Already in Next.js's default `serverExternalPackages` list, so no `next.config.ts` change is needed for it (unlike `pdf-parse` — see below).

### Resume PDF Generation

The Document component lives in its own `.tsx` file and is **called as a plain function, not JSX** — this keeps the API route a `.ts` file per `code-standards.md`'s "route files are always `route.ts`" convention.

```tsx
// components/resume/ResumePDF.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica" },
  name: { fontSize: 22, fontWeight: "bold" },
  section: { marginTop: 16 },
});

export function ResumePDF({ fullName, email }: { fullName: string; email: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{fullName}</Text>
        <View style={styles.section}>
          <Text>{email}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

```typescript
// app/api/resume/generate/route.ts — plain .ts, no JSX
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePDF } from "@/components/resume/ResumePDF";

const buffer = await renderToBuffer(ResumePDF({ fullName, email }));

// Wrap in a Blob before uploading — .upload() takes File | Blob, not a raw Buffer
const blob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
const { data, error } = await insforge.storage.from("resumes").upload(`${userId}/resume.pdf`, blob);
// data.url is the new public URL — save it to profiles.resume_pdf_url
```

**Supported CSS properties:**
Only use these — others are silently ignored:
`padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`

No `gap` and no `border*` properties in this list — use `marginBottom` on children for spacing, and typography/whitespace instead of divider lines.

**Rules:**

- Server-side only — never import in client components
- Always use `renderToBuffer` — not `renderToStream` or `PDFDownloadLink`
- PDF generation only in `app/api/resume/` routes
- Generated buffer uploaded via storage's real signature: `.upload(path, blob)`, no options object — see the InsForge Storage section above (no `contentType`/`upsert` params exist)
- Always save the returned `url` to `profiles.resume_pdf_url` after upload

---

## pdf-parse

**Package note:** the installed version is v2, a full rewrite from the v1 API most training data recalls (`import pdf from 'pdf-parse'; await pdf(buffer)`). v2's real API is class-based. Verified working end-to-end in Feature 07 against a real PDF.

### Extract Text from Uploaded Resume

```typescript
import { PDFParse } from "pdf-parse";

// In an API route handling resume upload
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resumeFile") as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  const parser = new PDFParse({ data: buffer });
  let extractedText: string;
  try {
    const result = await parser.getText();
    extractedText = result.text.trim();
  } finally {
    await parser.destroy(); // always free memory, even on error
  }

  // Send extractedText to Claude for structured extraction
}
```

**Rules:**

- Server-side only — never import in client components
- Construct with `new PDFParse({ data: buffer })` (a Buffer) or `{ url: '...' }` (a remote URL) — not a bare function call
- `.getText()` returns `{ text, ... }` — `text` is raw unformatted content; Claude handles the structure extraction
- **Always `await parser.destroy()` in a `finally` block** — v2 holds resources per-instance; skipping this leaks memory across requests
- **`next.config.ts` must list `pdf-parse` in `serverExternalPackages`.** Without it, Turbopack bundles the route handler and rewrites the path `pdfjs-dist` uses to resolve its worker script at runtime, breaking every call with "Setting up fake worker failed" — a bundling problem, not a code bug, so no amount of try/catch around `getText()` fixes it. Only surfaces when hit through an actual Next.js route; a plain Node script (no bundler) never reproduces it
- Always handle parse errors — some PDFs are image-based and return empty text
- If the extracted text is empty or very short — return error to user: "Could not extract text from this PDF. Please try a different file."
