# 0001. Core data schema

**Date**: 2026-08-28
**Status**: Proposed

## Summary

This decision sets up the database tables JobPilot needs to store user profiles, job search runs, discovered jobs, and agent activity logs. It creates four tables in the InsForge backend (profiles, agent_runs, jobs, agent_logs), each locked down so a user can only see their own rows, plus a private file storage area for resumes. Nothing is built yet. This spec is the target the next build step follows.

## Context

JobPilot needs somewhere to store the user's profile, the record of each job search the agent runs, the jobs that search finds, and a log of what the agent did along the way. None of this exists in the live backend yet (confirmed empty). The shape of these tables was drafted earlier in `context/architecture.md` as part of initial project setup, before this decision was formally worked through.

The backend is InsForge, a Postgres database reached through a PostgREST style API (`@insforge/sdk`). All server side code in this project (Server Actions, Route Handlers) already calls InsForge using the signed in user's own access token, never a shared admin key. That one fact shapes the whole security model here: because every request already carries "who is asking," row level security (a database feature that filters rows to only the ones a policy allows) can be the real enforcement layer, not just a nice to have on top of manual checks.

One inconsistency surfaced while reviewing the draft: `jobs.source` was documented as `search` or `url`, with `run_id` nullable for the `url` case. But manual URL import is explicitly out of scope for this project. Carrying a code path for a feature that will never produce data is exactly the kind of thing that causes confusion later, so this spec resolves it.

## Requirements

**User stories**:
- As a signed in user, I want my profile, job search history, found jobs, and agent activity stored so the app can show them back to me across sessions.
- As a signed in user, I want to be certain another user can never see my jobs, my profile, or my resume.

**Acceptance criteria**:
- **AC-1**: The four tables (profiles, agent_runs, jobs, agent_logs) exist in the live InsForge database with the columns, types, and foreign keys described in `## Feature design`.
- **AC-2**: A user reading or writing any row in these tables only ever sees or affects rows where they are the owner; a request authenticated as user A can never read or write user B's row, enforced at the database level (row level security), not only in application code.
- **AC-3**: Deleting a user's account removes their profile, and that removal cascades to their agent_runs, jobs, and agent_logs, leaving no orphaned rows.
- **AC-4**: A job's agent_logs rows survive if that specific job is later deleted; only the pointer to the job is cleared, not the log entry.
- **AC-5**: A private `resumes` storage bucket exists, reachable only by an authenticated request.
- **AC-6**: `jobs.source` only ever takes the value `search`; there is no `url` value and `run_id` is required (not nullable), matching the current project scope.

## Options considered

### Option 1: Normalized relational tables (profiles, agent_runs, jobs, agent_logs)

Four separate tables, each with a clear single purpose, linked by foreign keys. This is what `context/architecture.md` already drafted.

**Pros**:
- Each table maps to one real world thing (a profile, a search run, a job, a log line), so queries stay simple and obvious
- The dashboard's stat cards and charts (jobs this week, avg match rate, company research count) are cheap aggregate queries over these tables
- Postgres foreign keys and row level security both work naturally on this shape

**Cons**:
- Four tables to migrate and index instead of one; slightly more setup work up front

### Option 2: Fold agent_runs into jobs (no separate run table)

Store the search metadata (job title searched, location, status) directly on each job row instead of a separate agent_runs table.

**Pros**:
- One fewer table to create and join

**Cons**:
- A search that finds zero jobs would leave no row anywhere, so "Found 8 jobs and saved 4 strong matches" and the recent activity feed lose their source of truth
- Per run aggregates (jobs_found, status, started_at/completed_at) would need to be recomputed by grouping jobs every time instead of read directly

### Option 3: Single append only event log (event sourced)

One table of raw events ("job found", "search started", "research completed"); current state derived by replaying events.

**Pros**:
- Naturally gives a full history/audit trail for free

**Cons**:
- Every read (the jobs list, the dashboard stats) needs a derived view or a replay step; far more complexity than this project's scale calls for
- Nothing in the product requires reconstructing past states, only current ones

## Decision

**Chosen option**: Option 1: Normalized relational tables (profiles, agent_runs, jobs, agent_logs)

Four tables as already sketched in `context/architecture.md`, each protected by a row level security policy tied to the requesting user, with the `jobs.source`/`run_id` inconsistency resolved by dropping the unused `url` path.

## Rationale

The project's own dashboard requirements (stat cards, recent activity, three PostHog backed charts) all read naturally off separate `agent_runs` and `jobs` tables; folding them together (Option 2) would trade a small setup saving now for harder queries on every future feature that reads this data. Event sourcing (Option 3) solves a problem this project does not have: nothing in `project-overview.md` asks for historical replay, only current state.

Row level security is the right enforcement layer specifically because of how this project already calls InsForge: `lib/insforge-server.ts`'s `createInsforgeServer()` always forwards the signed in user's own access token, never an admin key, so `auth.uid()` in a policy always reflects who is really asking. Relying on application code alone ("always filter by user_id," as the original draft put it) is one missed `.eq('user_id', ...)` away from a data leak; a database policy fails closed instead.

## Feature design

**Data model sketch**:

| Table | Key fields | Relationships |
|---|---|---|
| `auth.users` | InsForge managed; `id` is `uuid` | 1 to 1 with `profiles` |
| `profiles` | `id` uuid, primary key, foreign key to `auth.users.id`, **on delete cascade**; plus all fields already listed in `architecture.md` (full_name, email, phone, location, current_title, experience_level, years_experience, skills text array, industries text array, work_experience jsonb, education jsonb, job_titles_seeking text array, remote_preference, preferred_locations text array, salary_expectation, cover_letter_tone, linkedin_url, portfolio_url, work_authorization, resume_pdf_url, is_complete boolean not null default false, created_at, updated_at) | 1 to many with `agent_runs`, `jobs`, `agent_logs` |
| `agent_runs` | `id` uuid primary key default `gen_random_uuid()`; `user_id` uuid, foreign key to `profiles.id`, **on delete cascade**, not null; `status` text not null; `job_title_searched`, `location_searched` text; `jobs_found` integer default 0; `started_at` timestamptz not null default `now()`; `completed_at` timestamptz | 1 to many with `jobs`, `agent_logs` |
| `jobs` | `id` uuid primary key default `gen_random_uuid()`; `run_id` uuid, foreign key to `agent_runs.id`, **on delete cascade, not null** (changed from nullable); `user_id` uuid, foreign key to `profiles.id`, **on delete cascade**, not null; `source` text not null default `'search'` (the only value now, `url` removed); plus all other columns already listed in `architecture.md` (source_url, external_apply_url, title, company, location, salary, job_type, about_role, responsibilities text array, requirements text array, nice_to_have text array, benefits text array, about_company, match_score integer, match_reason, matched_skills text array, missing_skills text array, company_research jsonb, found_at timestamptz not null default `now()`) | many to 1 with `agent_runs`, `profiles`; 1 to many with `agent_logs.job_id` (optional) |
| `agent_logs` | `id` uuid primary key default `gen_random_uuid()`; `run_id` uuid, foreign key to `agent_runs.id`, **on delete cascade**, not null; `user_id` uuid, foreign key to `profiles.id`, **on delete cascade**, not null; `message` text not null; `level` text not null; `job_id` uuid, foreign key to `jobs.id`, **on delete set null**, nullable; `created_at` timestamptz not null default `now()` | many to 1 with `agent_runs`, `profiles`, `jobs` |

Indexes: one on every foreign key column above (`agent_runs.user_id`; `jobs.run_id`, `jobs.user_id`; `agent_logs.run_id`, `agent_logs.user_id`, `agent_logs.job_id`), plus `jobs(found_at desc)` and `jobs(match_score)` since `library-docs.md` already documents both as real sort orders the Find Jobs page uses.

**State transitions**:
`agent_runs.status`: `running` → `completed`, or `running` → `failed`. Set to `running` when the row is created, `completed` when the search finishes and results are saved, `failed` if the Adzuna call or scoring throws. No transition out of `completed` or `failed`.

**API surface**:

This spec creates tables and storage only; no application endpoints. The Server Actions and Route Handlers that read and write these tables (profile save, Adzuna discovery, company research) are separate features (Phase 2 and Phase 3 in `build-plan.md`) and get their own spec when built.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Create a profile row | `id` | `auth.uid()` from the requester's own access token, never a client supplied value |
| Create a profile row | `email` | The authenticated user's email from `auth.users`, read once at profile creation, not re-entered |
| Create an agent_runs row | `user_id` | `auth.uid()`, same as above |
| Insert a jobs row | `run_id` | The `agent_runs.id` just created earlier in the same request, not a separate lookup |
| Insert an agent_logs row | `user_id`, `run_id` | Carried forward from the run already in progress when the log line is written |

**Key invariants**:
- `jobs.source` is always `'search'`; the database default enforces this until a future feature needs another value
- Every `jobs` and `agent_logs` row belongs to exactly one `agent_runs` row; there is no "orphan" job or log with no run
- A row's `user_id` always equals the id of the `profiles` row that owns it; row level security enforces this is also true for every read and write, not only inserts

**Security model**:
Row level security enabled on all four tables. One policy per table, `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)` (using `auth.uid() = id` on `profiles`, since that table's primary key is the user id). No public or anonymous access to any of the four tables. The `resumes` storage bucket is created private (`isPublic: false`); per user path scoping (whether InsForge additionally stops user A guessing user B's file path within a private bucket) could not be confirmed from the SDK docs and is called out in Follow-up rather than assumed.

**Configuration required**:
None. This uses the InsForge project already configured (`NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`), no new environment variables or credentials.

**Critical test scenarios**:
- Happy path: create a profile, an agent_run under it, a job under that run, and a log line referencing the job; all four rows are readable back by that same user, verifies **AC-1**
- Cross user isolation: authenticate as user B and attempt to read or update a row owned by user A; the request returns zero rows / is rejected, not an error leaking that the row exists, verifies **AC-2**
- Cascading delete: delete a profile row; its agent_runs, jobs, and agent_logs rows are gone afterward, verifies **AC-3**
- Job deletion: delete a job that has an agent_logs row pointing at it; the log row still exists afterward with `job_id` now null, verifies **AC-4**

## Build plan

No UI is involved in this feature, so the project's usual UI first build approach does not apply here; this is a single backend setup step, done in one pass rather than sliced.

1. Create the `profiles`, `agent_runs`, `jobs`, `agent_logs` tables with the columns, types, foreign keys, and cascade behavior in `## Feature design`, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-6**
2. Add the indexes listed in `## Feature design`, satisfies **AC-1**
3. Enable row level security and add the one policy per table described in `## Feature design`'s Security model, satisfies **AC-2**
4. Create the private `resumes` storage bucket, satisfies **AC-5**
5. Update `context/architecture.md`'s schema section and `context/progress-tracker.md` to reflect the resolved `source`/`run_id` change and mark this feature built, satisfies **AC-6**

## Consequences

**Positive**:
- Every later feature (profile save, job discovery, company research, dashboard stats) has a settled table shape to build against instead of guessing
- Cross user data leaks are prevented at the database layer, not only by remembering to filter every query

**Negative / tradeoffs**:
- `jobs.source` being fixed to `'search'` means adding URL import later requires a follow up migration (relaxing the default and allowing `'url'` again), not just a code change
- Four tables with cascading foreign keys means a mistaken delete on `profiles` is unrecoverable without a backup; there is no soft delete here by design (an explicit choice, not an oversight, since a stale "deleted" flag would leak into every future query on these tables)

**Neutral**:
- This is a one time schema creation; there is no existing data to migrate

## Follow-up

- [ ] Confirm whether InsForge's private storage buckets scope access by object path (so user A cannot guess user B's resume URL) or only require "authenticated at all." Verify this when resume upload is actually built (`build-plan.md` Feature 08), and if it does not scope by path, add an application layer check before serving a download.
- [ ] If URL based job import is ever brought back into scope, this spec's `jobs.source`/`run_id` decision (AC-6) needs to be revisited with a follow up migration.
