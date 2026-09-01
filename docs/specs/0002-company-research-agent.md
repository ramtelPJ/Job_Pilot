# 0002. Company research agent

**Date**: 2026-09-01
**Status**: Accepted

## Summary

This decision defines how JobPilot researches a company for one job and turns that research into a briefing (a short, structured writeup) the candidate can actually use. A single browser automation session visits the company's own site, an AI model (Claude) fuses that with the job posting and the candidate's profile into a nine part dossier, and the result is saved to the job so it never needs to be regenerated unless the user asks again. It reuses tables and columns that already exist, so no new database migration is needed.

## Context

Feature 12 (Job Details Page) already ships a Company Research card that shows an empty state with a "Research Company" button that does nothing yet. `context/build-plan.md`'s Feature 13 section already specifies the mechanics in unusual depth: how to derive the company's homepage from the job's Adzuna redirect link, the exact fields to pull from the homepage and up to three sub pages, and the exact nine fields the final writeup (dossier) must contain. That level of detail is closer to an approved design than an open question, so this spec treats it as the given mechanics and focuses on the decisions build plan.md leaves open: what happens when research is re run, what the user sees while it runs, what happens if the AI step itself fails (not just thin website content), and what the "sources" field actually holds.

One real conflict surfaced against this project's own rules: build plan.md asks for `temperature: 0.4` on the Claude call, but this project's model (`claude-opus-5`) rejects `temperature`, `top_p`, and `top_p` style parameters outright (a 400 error), confirmed earlier in this project's build history. This is a hard technical constraint, not a preference, so this spec resolves it rather than asking the engineer to choose between "the documented mechanic" and "a call that fails."

The `jobs.company_research` column already exists (see `0001-core-data-schema.md`), created for exactly this purpose, so this feature is pure application logic on top of an already settled schema.

## Requirements

**User stories**:
- As a signed in user viewing a job I found, I want to research the company behind it so I understand what they do and how to stand out before I apply.
- As a signed in user, I want the research to be honest about what it does and does not know, not made up.
- As a signed in user, I want to be able to re run research on a job if I want a fresh look.

**Acceptance criteria**:
- **AC-1**: Clicking "Research Company" on a job the signed in user owns starts a research run; the card shows an inline loading state (not just a disabled button) until it finishes.
- **AC-2**: On success, the full nine field dossier (company overview, tech stack, culture, why this role, your edge, gaps to address, smart questions, interview prep, sources) is saved to `jobs.company_research` and shown on the page right away, replacing the empty state.
- **AC-3**: Every company claim in the dossier is grounded in either the scraped company research or the job posting; the writeup never invents funding, customers, headcount, or any other fact not present in what was actually gathered.
- **AC-4**: If the company site can't be read meaningfully (the homepage extraction comes back empty, or loading the site throws an error of any kind), research still succeeds by writing the dossier from the job posting and candidate profile alone.
- **AC-5**: If the AI writeup step itself fails (not just thin website content, the model call itself erroring), no dossier is saved, the card shows a real error message with a way to try again, and the empty state stays in place.
- **AC-6**: A user can re run research on a job that already has a saved dossier; a successful re run replaces the old dossier with the new one.
- **AC-7**: A user cannot start or view research for a job that belongs to someone else; the same ownership rule the job details page already uses applies here.
- **AC-8**: The dossier's "sources" field lists the real page addresses (URLs) the research actually visited (the homepage plus up to three sub pages), not shortened labels standing in for them.
- **AC-9**: A `company_researched` analytics event fires exactly once per successful research run, carrying the user id, job id, and company name.

## Options considered

### Option 1: One request, one browser session, synchronous (the build plan's own approach)

The click sends one request to a new endpoint. That request opens one browser automation session, reads the homepage and up to three sub pages, closes the session, asks Claude to write the dossier, saves it, and only then answers the request. The page waits the whole time (roughly twenty to sixty seconds) and then shows the result.

**Pros**:
- Matches the mechanics build plan.md already worked out in detail; nothing new to invent
- No new moving parts (no job queue, no "in progress" status to track, no polling)
- The result is fully ready the moment the request finishes, so the UI logic stays simple: wait, then show

**Cons**:
- The request stays open for the whole twenty to sixty seconds; on a hosting platform with a short time limit for a single request, a slow run could get cut off before finishing (this project has not chosen where it will run in production yet, so this is a real but not yet urgent risk)

### Option 2: Background run with a status the page polls

The click starts the research as a background task and answers right away with "started." The page then checks back every few seconds until the dossier shows up.

**Pros**:
- Removes the request time limit risk entirely; the user could even navigate away and the run keeps going
- Would also let the UI show real progress ("visiting engineering blog now") instead of one long spinner

**Cons**:
- Needs machinery this project does not have yet: a way to run work in the background outside a single request, and a stored "researching" status to poll against, which is itself a new piece of the data model
- The engineer's own answer to how this should look (an inline spinner is enough) does not call for this; building it now solves a problem the project does not have yet

### Option 3: Stream progress back over one open connection

Keep it to one request like Option 1, but stream partial updates back as research proceeds ("found the homepage", "reading the engineering blog", "writing your summary") instead of a single silent wait.

**Pros**:
- Better feel during a twenty to sixty second wait than a plain spinner, without needing a background job system

**Cons**:
- Meaningfully more code (a streaming response on the server, a stream reader on the client) for a UX the engineer already said a simple inline spinner satisfies; this is solving for a preference nobody asked for

## Decision

**Chosen option**: Option 1: One request, one browser session, synchronous

**Implementation skills**: `claude-api` (a built in reference skill for the Claude API, not a project installed one; consulted for the model's parameter rules and structured output pattern)

## Rationale

Option 1 is the simplest option that meets every acceptance criterion, matches what build plan.md already specified in detail, and matches what the engineer actually asked for when asked how the loading state should look (an inline spinner, not incremental progress). Option 2's real benefit, surviving a request time limit, is not a measured problem: this project has not even chosen a production host yet, and every other agent style route in this project (job discovery, resume extraction, resume generation) already uses the same synchronous, one request pattern successfully. Option 3 answers a UX question the engineer already settled the simpler way. The request duration risk Option 1 carries is real but not urgent; it is recorded in Follow-up rather than designed around today, in line with this project's working style of proving something out simply first (Feature 10's job discovery route followed the same synchronous shape at a similar-order latency once several AI calls were run at once).

## Feature design

**Data model sketch**:

No new tables or columns. This feature reuses what Feature 04's schema (`0001-core-data-schema.md`) already created:
- `jobs.company_research` (jsonb, already exists, currently always null): holds the nine field dossier as one JSON object.
- `agent_logs` (already exists): used to log a failure. Critically, `agent_logs.run_id` is a required (not nullable) foreign key to `agent_runs`. Company research does not create a new `agent_runs` row (it is not a search run); instead it reuses the `run_id` already stored on the job itself (`jobs.run_id`, set back when the job was first found by Adzuna discovery in Feature 10). This satisfies the existing foreign key with zero schema change.

**State transitions**:

Not a formal state machine; `jobs.company_research` is simply `null` (never researched) or a filled in JSON object (researched, possibly stale if the user later re runs it, which just overwrites it in place). No new status column is introduced (see Follow-up for the tradeoff this accepts).

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/agent/research | POST | jobId: string (req) | `{ success: true }` on completion; the dossier itself is read back by the page's own refresh, not returned in this response | bearer (signed in session) | 400 missing jobId, 401 not signed in, 404 job not found or not owned, 500 research failed |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| POST /api/agent/research | jobId | request body, sent by the client from the job details page's own URL |
| Load the job | company, title, job description, matched skills, missing skills, the job's own listing link, run_id | the `jobs` row, looked up by id and the signed in user's id together |
| Load the profile | current title, years of experience, experience level, skills, work history | the `profiles` row for the signed in user |
| Derive the company homepage address | the root web address to research | follow the job's own listing link with a plain server side fetch and read where it ends up; strip any subdomain (e.g. `jobs.stripe.com` becomes `stripe.com`); if that still points back at the job board or the fetch fails, fall back to a guessed address built from the company name (lowercase, letters and digits only, e.g. "Insight Global" becomes `insightglobal.com`) |
| Homepage research | one line summary, product summary, notable signals, links worth visiting next | one browser automation read of the derived homepage address |
| Sub page research (up to 3) | key points, technologies used, culture and values, notable facts | one browser automation read per chosen link (about, blog, engineering, and product pages preferred over a careers page) |
| Write the dossier | company overview, tech stack, culture, why this role, your edge, gaps to address, smart questions, interview prep | one AI call fed the homepage research, the sub page research, the job posting, and the candidate profile together |
| Write the dossier | sources | the literal page addresses actually visited (the homepage plus each sub page read), assembled by the code, not written by the AI model |
| Save the dossier | jobs.company_research | update the job row's `company_research` column, scoped to the same id and owning user as the load above |
| Log a failure | agent_logs.run_id, user_id, job_id, message, level | run_id comes from the job's own existing run_id (see Data model sketch); user_id from the signed in session; job_id from the request; level is always `error` |
| Fire the analytics event | userId, jobId, company | the signed in session's user id, the request's jobId, and the company name already loaded from the job row |

**Key invariants**:
- `jobs.company_research` is either null or one complete dossier object with all nine fields; a partially written dossier is never saved (the save happens once, after the AI writeup succeeds, not field by field)
- The `sources` field never contains a page address that was not actually visited by the browser automation step
- A dossier is only ever attached to a job the requesting user owns; the database's existing row level security on `jobs` enforces this even if the application code's own check were ever missed

**Security model**:
Same rule as every other row in this project: the signed in user can only read or write their own `jobs` row, enforced both by the application (an explicit id and user id lookup, matching how the job details page already reads a single job) and by the database's row level security policy on `jobs` (already in force since Feature 04). No new kind of sensitive data is introduced; the dossier is built from public company website content, the job posting, and profile fields the user already stored. No new roles or permission levels.

**Configuration required**:
No new environment variables. This uses credentials already documented in `context/code-standards.md` and already set up by the engineer: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, and the existing `CLAUDE_API_KEY`.

**Critical test scenarios**:
- Happy path: a job at a company with a real, readable website produces a complete, grounded nine field dossier that is saved and shown, verifies **AC-1**, **AC-2**, **AC-3**, **AC-8**, **AC-9**
- Failure case, thin website: a company whose site can't be meaningfully read (parked domain, or the read itself errors) still produces a dossier, written from the job posting and profile alone, verifies **AC-4**
- Failure case, AI step down: the AI writeup call itself fails; no dossier is saved, the card shows a real error the user can retry, verifies **AC-5**
- Re run: researching a job that already has a saved dossier replaces it with a fresh one, verifies **AC-6**
- Auth/permission: a request for a job id owned by a different user, or with no signed in session at all, is rejected before any browser automation session opens, verifies **AC-7**

## Build plan

No new migration (the target data model reuses existing columns entirely), so this feature builds as one end to end pass rather than a schema slice followed by an application slice; that also matches this project's default of building each feature as one working thread since no build approach is recorded in `AGENTS.md`.

1. Build `lib/browserbase.ts` (opens one browser automation session) and `lib/stagehand.ts` (wraps that session for structured page reads), the two library files already sketched but not yet built in `context/architecture.md`, satisfies **AC-1**
2. Build `agent/research.ts`: derive the homepage address, read the homepage, read up to three sub pages, write the dossier with Claude (no `temperature`/`top_p`/`top_k`, per this project's model constraint; grounded system prompt per build plan.md's rules), assemble `sources` from the addresses actually visited, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-8**
3. Wire the "site can't be read" and "browser automation itself errors" cases to the same fallback path (job posting and profile only), and wrap the AI writeup call in its own try/catch that logs to `agent_logs` (using the job's own `run_id`) and returns a clean failure without saving anything, satisfies **AC-4**, **AC-5**
4. Build `POST /api/agent/research`: validate the body, require a signed in session, load and ownership check the job, call `agent/research.ts`, save the result, fire the `company_researched` event, return the response shape in `## Feature design`, satisfies **AC-1**, **AC-2**, **AC-5**, **AC-6**, **AC-7**, **AC-9**
5. Wire `components/job-details/CompanyResearch.tsx`'s existing "Research Company" button to this endpoint (client side fetch plus loading state, refresh the page on success so the server rendered dossier shows), and render all nine dossier fields per `context/build-plan.md`'s "Job Details UI — Company Research Card" list when `jobs.company_research` is present, satisfies **AC-1**, **AC-2**, **AC-6**

## Consequences

**Positive**:
- The dossier is grounded, reusable without re running research every visit, and gives the candidate something concretely useful (talking points, gap framing, interview questions) rather than generic advice
- No new infrastructure; the route follows the same shape as this project's other agent routes (job discovery, resume extraction, resume generation)
- `lib/browserbase.ts` and `lib/stagehand.ts` get their first real implementation, unblocking any future feature that also needs browser automation

**Negative / tradeoffs**:
- The request stays open for roughly twenty to sixty seconds; on a hosting platform with a short per request time limit this could be cut off before finishing (see Follow-up)
- No server side guard against two rapid clicks (or two open tabs) starting research on the same job at once; whichever finishes last simply overwrites the dossier, a low stakes but real race
- Every click costs a real browser automation session and a real AI call, with no limit on how often one user can click it; fine for a single user project today, not fine to ship as is to many users

**Neutral**:
- `jobs.company_research` moves from "written by the schema, unused" to "written and read for real" with no shape change
- The Company Research card gains a second client side, fetch driven interaction, following the same shape `SearchControls.tsx` already established for job discovery

## Follow-up

- [ ] No rate limit on `POST /api/agent/research`; revisit before this project has more than one real user, since each click has a real, unbounded cost
- [ ] No guard against two overlapping research requests for the same job racing each other; low stakes today (last write simply wins), worth a short lived "already researching" guard if it ever causes visible confusion
- [x] Confirmed (built and verified against a real company site): the twenty to sixty second estimate in this spec was optimistic. A content rich company where several sub pages are actually found and read took closer to two minutes end to end. `library-docs.md` and the loading copy on the Company Research card now reflect this. The underlying request duration risk (a short per request time limit on some future host) is still real and still tracked below; it is simply bigger than first estimated.
- [ ] The request duration risk (now closer to two minutes than "twenty to sixty seconds," see above) is a real risk if this project later deploys somewhere with a short per request time limit; if that becomes real, revisit Option 2 (a background run with a status the page polls) from this spec
- [x] Confirmed (built): three implementation gaps surfaced only by testing against a real company site, not visible from the mechanics build plan.md already specified. Each is now documented in `library-docs.md` so a future feature does not repeat them: (1) the homepage extraction schema's `pageLinks[].url` field came back as the link's visible text ("Careers") rather than its real address on the first real test; the schema and instruction now explicitly ask for the real address, not the label. (2) The write up call's `max_tokens` (`2048`, taken from `library-docs.md`'s existing table before this feature was built) was too small for a real, content rich company and cut the response off mid write, breaking the structured output parser; raised to `4096`. (3) The installed browser automation package pins its own exact copy of the schema validation library (`zod`); this project's own copy was a different version, which silently broke the typed extraction calls. Fixed by pinning this project's own copy to the exact same version.
