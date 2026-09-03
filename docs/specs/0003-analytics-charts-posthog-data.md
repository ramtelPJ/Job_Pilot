# 0003. Analytics charts from PostHog data

**Date**: 2026-09-01
**Status**: Accepted

## Summary

This decision wires the dashboard's three charts to real usage data instead of made up numbers. The data lives in PostHog (the analytics tool this project already sends events to), not in the project's own database, so this feature reads it back out over PostHog's own web API using a new, read only credential. All three charts move to a real charting library (recharts) instead of hand drawn shapes, since real data has a shape that varies from day to day in a way the old placeholder numbers never did.

## Context

Since Feature 10 (job discovery) and Feature 13 (company research), this project has already been sending two events to PostHog every time they happen: `job_found` (with the match score attached) and `company_researched`. Nothing has ever read them back. The dashboard's three charts (`context/build-plan.md`'s Feature 14) still show fixed placeholder numbers.

Reading events back out of PostHog is a genuinely new kind of work for this project. The already installed `posthog-node` package only sends events, it has no method for reading them back (confirmed by reading its own type definitions). No PostHog MCP server is actually connected in this coding session either, despite one being referenced by the installed PostHog setup skill, and that server is for creating dashboards inside PostHog's own product anyway, not for pulling numbers into this project's own page. That leaves PostHog's own web API as the only real option, and it needs a different kind of credential than the one already configured: a Personal API Key, which grants read access instead of the existing key's write only access.

One more thing surfaced while reading the build plan closely: the mock dashboard (Feature 14) shows a "Resume Tailoring Activity" chart, but Feature 17's own real data instructions never mention it, asking instead for a "Company Research Activity" chart. This project's fixed list of the nine events it is allowed to send (in `code-standards.md`) has never included anything about resume tailoring, so there has never been a way to make that chart real. This is the same kind of mismatch already found and fixed twice in this project (the dashboard's fourth stat card, and one of its five mock activity entries), both times resolved by trusting the real data source over the earlier mock's wording.

## Requirements

**User stories**:
- As a signed in user, I want to see how many jobs have been found for me recently, so I can tell whether the tool is actually working for me.
- As a signed in user, I want to see how my match scores are spread out, so I can judge whether I am searching for the right kind of role.
- As a signed in user, I want to see how often I have researched companies recently, so I can see my own effort reflected back.

**Acceptance criteria**:
- **AC-1**: The Jobs Found Over Time chart shows the signed in user's real `job_found` event counts, one number per day, for the last 30 days, with every day in that range shown even if its count is zero.
- **AC-2**: The Match Score Distribution chart shows the signed in user's real `job_found` events, sorted by their attached match score into five fixed ranges (50 to 60, 60 to 70, 70 to 80, 80 to 90, 90 to 100), counted across all time, not limited to a recent window.
- **AC-3**: The Company Research Activity chart shows the signed in user's real `company_researched` event counts, one number per day, for the last 7 days, with every day shown even if its count is zero. This chart replaces the mock "Resume Tailoring Activity" chart from Feature 14, which had no real event behind it.
- **AC-4**: Each of the three charts shows its own clear empty state, not a blank or broken chart, when it has no matching data yet.
- **AC-5**: All three charts are rendered with recharts.
- **AC-6**: A user only ever sees counts built from their own events. Every query is scoped to their own PostHog distinct id, the same id already used when these events are captured.
- **AC-7**: If PostHog's API cannot be reached, returns an error, or the read credential has not been configured yet, the dashboard page still renders normally. Every affected chart falls back to its empty state; nothing on the page crashes.

## Options considered

### Option 1: PostHog's Events API, aggregated in this project's own code

Fetch the raw matching events (already filtered to the signed in user and, where relevant, a date range) straight from PostHog's events endpoint, then group them into days or score ranges inside this project's own server code, the same way `app/dashboard/page.tsx` already turns raw database rows into the Stats Bar's numbers.

**Pros**:
- The same "fetch rows, add them up in code" shape this dashboard already uses for its real database backed numbers, so there is only one mental model for how this page works
- A plain, simple request shape

**Cons**:
- **Deprecated.** Checked directly against PostHog's own docs (not assumed): the notice reads "The events API is deprecated... due for removal at a future date," and PostHog explicitly points ad hoc reads like this one at the Query API instead. Still functional today, but new work has no business being built on an endpoint already scheduled to go away
- Also pulls raw event rows rather than an already aggregated number, so a high volume account would eventually need real pagination handling

### Option 2: PostHog's Query API (HogQL), letting PostHog aggregate

Send a HogQL query (PostHog's SQL dialect, built on ClickHouse SQL) to `POST /api/projects/:project_id/query/`, asking PostHog's own query engine to filter, group by day, and count, then just read back the finished rows.

**Pros**:
- The endpoint PostHog itself currently recommends for exactly this kind of ad hoc read; not scheduled for removal
- Less data moves over the network, and the aggregation logic lives in one place PostHog already tests and maintains
- Verified directly against PostHog's own docs source before committing to it (not assumed from training knowledge): the request body is `{ "query": { "kind": "HogQLQuery", "query": "<SQL>" } }` with an `Authorization: Bearer <key>` header, and the response carries a top level `results` field

**Cons**:
- The exact shape of `results` for a given query (an array of row arrays vs. named columns) could not be confirmed from the docs alone, since the page's own response example was truncated before showing real row data; this needs a defensive parser and a real check once a live key exists, not a blind assumption
- Writing SQL by hand, even a ClickHouse compatible dialect, is a new pattern for this codebase, which has had no SQL directly in application code until now (only through the InsForge query builder)

### Option 3: Keep hand drawing the charts, no new charting library

Continue what Features 14 through 16 already do: plain Tailwind bars and one hand built SVG line chart, just fed real numbers instead of fixed ones.

**Pros**:
- No new dependency, and the three chart components already exist and are already proven to work

**Cons**:
- Goes directly against `build-plan.md`'s own explicit instruction for this feature ("all three charts rendered with recharts")
- Hand drawn charts get no tooltip, no responsive axis scaling, and no legend for free, and the data behind them is now genuinely variable (a changing number of days, a changing count per day) in a way the old fixed placeholder numbers never were

## Decision

**Chosen option**: Option 2: PostHog's Query API (HogQL)

**Implementation skills**: `integration-nextjs-app-router` (`JavaScript-Mastery-Pro/skills`, `.claude/skills/integration-nextjs-app-router/`)

## Rationale

This decision was corrected once, right after the engineer first confirmed it, before any code existed. Option 1 (the Events API) was the initial pick, on the reasoning that its plain request shape was lower risk than HogQL's. That reasoning held only as long as the Events API's own deprecation stayed unknown. Checking PostHog's actual docs (not assumed knowledge) surfaced that it is deprecated and due for removal, with PostHog's own guidance pointing ad hoc reads like this one at the Query API instead. Building new work on a deprecated endpoint is a worse risk than an unfamiliar but current one, so the decision moved to Option 2 once that was known, and its exact request and response shape were confirmed against PostHog's own documentation source before committing again, closing the original "fussy shape, unverified" objection that ruled it out the first time. Option 3 was never seriously in the running: `build-plan.md` asks for recharts by name for this feature, and the underlying data (a variable number of days, a variable count per day) is exactly the kind a hand rolled chart handles worst.

## Feature design

**Data model sketch**:

No new database table or column. This feature reads from PostHog's own already captured event store, not from InsForge. The two events it reads already carry everything needed: `job_found` (captured in `app/api/agent/find/route.ts`) already includes a `matchScore` property; `company_researched` (captured in `app/api/agent/research/route.ts`) already includes `company`. Both are already captured with `distinctId` set to the signed in user's own id, which is what makes filtering to "this user's events only" possible.

**State transitions**: Not applicable, no state machine.

**API surface**:

This feature adds no new HTTP endpoint. The data is read server side, at page render time, inside the same `app/dashboard/page.tsx` Server Component that already builds the Stats Bar and Recent Activity numbers (Features 15 and 16). The real surface is a new internal module:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `lib/posthog-query.ts`: `getJobsFoundSeries` | function | `userId: string` | `{ date, count }[]`, 30 days, zero filled | server only, `POSTHOG_PERSONAL_API_KEY` | never throws, returns `[]` on any failure |
| `lib/posthog-query.ts`: `getMatchScoreDistribution` | function | `userId: string` | `{ range, count }[]`, 5 fixed ranges | server only | never throws, returns `[]` on any failure |
| `lib/posthog-query.ts`: `getCompanyResearchSeries` | function | `userId: string` | `{ date, count }[]`, 7 days, zero filled | server only | never throws, returns `[]` on any failure |

Each of the three calls `POST {NEXT_PUBLIC_POSTHOG_HOST}/api/projects/{POSTHOG_PROJECT_ID}/query/` with `Authorization: Bearer {POSTHOG_PERSONAL_API_KEY}` and a body of `{ "query": { "kind": "HogQLQuery", "query": "<SQL>" } }`, reading the response's `results` field. `userId` is validated as a well formed UUID before it is interpolated into the SQL string (it always comes from this project's own auth system, never free text, but this keeps the query construction honest without needing to nail down HogQL's own parameter placeholder syntax blind).

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| `getJobsFoundSeries` | per day `job_found` counts | a HogQL query: `SELECT toDate(timestamp), count() FROM events WHERE event = 'job_found' AND distinct_id = {userId} AND timestamp >= now() - INTERVAL 30 DAY GROUP BY 1 ORDER BY 1` |
| `getJobsFoundSeries` | the 30 day range itself, gaps included | computed in code counting back from today, not from PostHog — a day with no events is still shown, at 0 |
| `getMatchScoreDistribution` | per range counts | a HogQL query selecting `properties.matchScore` for the user's `job_found` events (no date filter); each returned score is bucketed into the five fixed ranges in this project's own code, not in SQL — keeps the bucketing logic in one place this codebase already reads easily |
| `getCompanyResearchSeries` | per day `company_researched` counts | a HogQL query: `SELECT toDate(timestamp), count() FROM events WHERE event = 'company_researched' AND distinct_id = {userId} AND timestamp >= now() - INTERVAL 7 DAY GROUP BY 1 ORDER BY 1` |
| all three | `userId`, the distinct id to filter by | the signed in user's id, already resolved in `app/dashboard/page.tsx` via `insforge.auth.getCurrentUser()` |
| all three | the PostHog read credential | `process.env.POSTHOG_PERSONAL_API_KEY`, `process.env.POSTHOG_PROJECT_ID`; the existing `process.env.NEXT_PUBLIC_POSTHOG_HOST` is reused for the request host |

**Key invariants**:
- Every PostHog query is filtered to `distinct_id` equal to the signed in user's own id; there is no unfiltered, project wide query anywhere in this feature
- A missing or invalid `POSTHOG_PERSONAL_API_KEY` never throws and never crashes the dashboard; every function in `lib/posthog-query.ts` returns an empty result in that case instead, the same defensive shape `getPostHogClient()` already uses on the capture side
- Match Score Distribution always shows the same five ranges in the same order, even when a range's count is zero

**Security model**:
`POSTHOG_PERSONAL_API_KEY` is a server side only secret that grants read access to this whole PostHog project's event data. It is read only inside `lib/posthog-query.ts`, never given a `NEXT_PUBLIC_` prefix, and never sent to the browser. `POSTHOG_PROJECT_ID` is not itself sensitive but stays server side too, since it is only ever used alongside the key. This feature adds no new user facing endpoint, so it adds no new authorization surface beyond the dashboard page's existing signed in check (Features 14 to 16).

**Configuration required**:
- `POSTHOG_PERSONAL_API_KEY`: a PostHog Personal API Key scoped to query read access for this project; used server side only
- `POSTHOG_PROJECT_ID`: the numeric PostHog project id these queries run against

**Critical test scenarios**:
- Happy path: a user with real `job_found` and `company_researched` events sees all three charts populated with real counts, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**
- Failure case: `POSTHOG_PERSONAL_API_KEY` is missing, or the PostHog API call fails outright; the dashboard still renders, each affected chart shows its empty state, nothing crashes, verifies **AC-4**, **AC-7**
- Auth/permission: a user with zero events of their own sees only their own (empty) data, never another user's events, verifies **AC-6**

## Build plan

No approach is recorded for this project in `AGENTS.md`, so this defaults to one end to end pass, the same judgment already used for Features 13 and 16: the feature is small enough, and every piece (the query module, the wiring, the chart components) only makes sense once the others exist.

1. Add `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` to `code-standards.md`'s environment variable table, satisfies the configuration this feature depends on
2. Install `recharts`, add it to `code-standards.md`'s approved dependency list, satisfies **AC-5**
3. Build `lib/posthog-query.ts`: `getJobsFoundSeries()`, `getMatchScoreDistribution()`, `getCompanyResearchSeries()` — the HogQL query calls, day bucketing with zero filling, and match score range bucketing, each returning an empty result rather than throwing on any failure or unexpected response shape, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**, **AC-7**
4. Wire `app/dashboard/page.tsx` to call all three alongside its existing Stats Bar / Recent Activity queries, satisfies **AC-1**, **AC-2**, **AC-3**
5. Rebuild `JobsFoundChart` and `MatchScoreChart` with recharts and real data plus real empty states, and build a new `CompanyResearchChart` with recharts; delete `ResumeTailoringChart.tsx` entirely, since Feature 14 already flagged it as having no real event behind it, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**

## Consequences

**Positive**:
- The dashboard finally shows real, trustworthy usage numbers instead of static placeholders
- Recharts gives every future chart in this project real tooltips and responsive scaling for free, not just these three
- Built on the endpoint PostHog itself currently recommends, not one already scheduled for removal
- PostHog does the day bucketing and counting itself for two of the three charts, so this project moves less raw data around than the originally chosen Events API approach would have

**Negative / tradeoffs**:
- A second PostHog credential now needs to stay configured, on top of InsForge, Claude, Adzuna, and Browserbase; if it goes missing, three dashboard sections quietly go empty instead of failing loudly, which is the safer failure mode but also an easy thing to not notice
- This project's first hand written SQL, in a dialect (HogQL) new to this codebase; its exact response shape was confirmed from PostHog's docs but not yet exercised against a live key at spec time, so `lib/posthog-query.ts` is written defensively (never throws, empty result on any unexpected shape) rather than assuming the shape is exactly right on the first real call

**Neutral**:
- `ResumeTailoringChart.tsx` is deleted outright, not kept around unused, since its mock content was already flagged as unwireable back in Feature 14

## Follow-up

- [x] Confirmed once `POSTHOG_PERSONAL_API_KEY` was added: `results` is an array of row arrays, exactly what `lib/posthog-query.ts` assumed (`SELECT count() FROM events` returned `"results": [[1048]]`). Verified against a real user's real `job_found`/`company_researched` events too, both through an isolated script calling the three exported functions directly and through the real bundled dashboard route: correct 30 day zero filled series, correct match score bucketing (a raw `properties.matchScore` of 12 confirmed as a real, plain integer, not a stringified one), correct 7 day zero filled series. No parser change was needed.
- [ ] No caching on these PostHog reads today; every dashboard page load makes three real API calls (one HogQL query per chart, since Match Score Distribution's unwindowed, ungrouped query shape does not combine cleanly with the two day bucketed ones). Fine at this project's current traffic, worth a short lived cache if that ever becomes a real latency or cost concern
