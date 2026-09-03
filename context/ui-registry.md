# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Logo

`components/layout/Logo.tsx`

Gradient square icon (`bg-[linear-gradient(45deg,var(--color-accent)_0%,var(--color-accent-deep)_100%)]`, `h-9 w-9 rounded-[10px]`) with a lucide `LayoutGrid` icon, plus optional "JobPilot" wordmark (`text-[19px] font-bold text-text-darkest`). Takes `showWordmark?: boolean`. Used in Navbar, Footer, and the DashboardPreview mock.

### Navbar

`components/layout/Navbar.tsx`

`"use client"` (needs `usePathname()` for active state). `h-16` full-width `bg-surface` header, `border-b border-border-light`, inner content `max-w-[1440px] mx-auto px-6`. Takes `authenticated?: boolean` (default `false`):
- `authenticated={false}` (marketing/homepage): plain text nav links (`text-sm font-medium text-text-dark hover:text-accent`), right-aligned CTA button (`bg-text-slate text-accent-foreground rounded-md px-4 py-2 text-sm font-medium`).
- `authenticated={true}` (app pages, e.g. `/profile`): nav links get a lucide icon each (`LayoutGrid`/`Search`/`User`, `h-4 w-4`) and a `border-b-2` active-tab treatment (`border-accent text-accent` when `pathname === item.href`, else `border-transparent text-text-dark hover:text-accent`). No CTA button in this mode — discovered from `profile.png`, not present in the original homepage design.

### Footer

`components/layout/Footer.tsx`

`bg-surface border-t border-border-light`, `max-w-[1440px] mx-auto px-6 py-8`, Logo left, links right (`text-sm font-medium text-text-secondary hover:text-text-primary`).

### Hero

`components/homepage/Hero.tsx`

Rounded gradient hero card (`rounded-2xl border border-border`, dual `radial-gradient` mesh using `color-mix()` over `--color-accent-light` / `--color-info-light`). Headline `text-4xl sm:text-5xl font-extrabold text-text-primary`. Primary CTA `bg-text-slate` + lucide `Play` icon; secondary CTA `bg-accent-light text-text-primary`.

### DashboardPreview

`components/homepage/DashboardPreview.tsx`

Static illustrative "browser chrome" mock of the dashboard (no live data) — traffic-light dots, fake URL bar, mini navbar, 4 stat cards (`text-2xl font-semibold`, `bg-success-lightest text-success-darker` trend badge), Recent Activity list (dot colors via `DOT_STYLES`/`DOT_INNER_STYLES` maps — accent/info/success), and a hand-built bar chart (`bg-info` bars, height via inline `%`).

### JobSearchSection

`components/homepage/JobSearchSection.tsx`

Two-column full-bleed section (`grid lg:grid-cols-2`, `border-t border-border-light`). Left: heading + 3-item feature list, first item highlighted (`border-l-2 border-l-accent-dark`), others `border-l-2 border-l-border-light`. Right: `bg-background` column containing a static jobs-table card (`rounded-2xl border border-border bg-surface` with shadow) — match-score mini bar + badge colors are hardcoded per row to match the design mock exactly (not the real score-threshold logic used elsewhere in the app).

### ConfidenceSection

`components/homepage/ConfidenceSection.tsx`

Mirror of JobSearchSection (code block on `bg-background` left column via `order-*` classes, heading + features on `bg-surface` right). Terminal mock: `bg-overlay` header bar with error/warning/success dots, `font-mono text-sm` log lines with per-tag colors (`text-info-medium`, `text-accent`, `text-success`, `text-warning`). Second feature item highlighted with `border-l-2 border-l-success-dark` (not accent — sampled from design).

### Testimonial

`components/homepage/Testimonial.tsx`

Centered quote section, `text-2xl sm:text-3xl font-medium`, "Success Stories" eyebrow (`text-accent uppercase text-xs font-semibold`). Avatar is an initials placeholder (`bg-accent-light text-accent rounded-full`), not a photo — no asset was available.

### CTASection

`components/homepage/CTASection.tsx`

Same gradient-card treatment as Hero. Primary CTA identical to Hero's; secondary CTA here is the standard secondary button (`bg-surface border border-border`), which differs from Hero's `bg-accent-light` secondary — confirmed against the source design, not an inconsistency to fix.

### SectionDivider

`components/homepage/SectionDivider.tsx`

Decorative `h-8` diagonal-hash band (`repeating-linear-gradient(-45deg, var(--color-border-light) ...)`) used as a section-break texture at 3 spots on the homepage, matching the design.

### LoginPage

`app/(auth)/login/page.tsx`

Server Component (no `"use client"` — OAuth buttons are `<form>`s bound to the `signInWithOAuth` Server Action). Centered card: `max-w-sm rounded-2xl border border-border bg-surface p-8`, same shadow recipe as ui-tokens.md's Card spec. Logo centered above `text-xl font-semibold` heading + `text-sm text-text-secondary` subtext. Google button: secondary style (`border border-border bg-surface hover:bg-surface-secondary`) with an inline multicolor Google "G" SVG (no lucide equivalent exists for brand marks). GitHub button: `bg-text-slate text-accent-foreground` with an inline monochrome octocat SVG (`currentColor`) — same reasoning, lucide-react ships no brand icons. Error banner (`bg-error/10 text-error`) shown when `?error=oauth_failed|missing_code` is present.

### ProfilePage

`app/profile/page.tsx`

`bg-background` page, `Navbar authenticated`, single narrow column `max-w-3xl mx-auto px-6 py-8`, stacked `gap-6`: `CompletionIndicator` → `ProfileForm` (which itself renders `ResumeUpload` then the Profile Information card inside its `<form>` — see ProfileForm below). Now a Server Component that fetches the real profile row (`createInsforgeServer()`, `.maybeSingle()` — no row yet for a brand new user, falls back to an empty profile pre-filled with just the auth email) and computes completion server-side before render. All card sections share the same shadow/radius recipe as ui-tokens.md's Card spec (`rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]`).

### CompletionIndicator

`components/profile/CompletionIndicator.tsx`

Server Component, takes `percentage` + `missingFields`. SVG ring (`viewBox 0 0 120 120`, `r=54`, `strokeWidth=10`, computed `strokeDasharray`/`strokeDashoffset`, rotated `-rotate-90` so the arc starts at 12 o'clock), track `stroke="var(--color-error-light)"`, progress arc `stroke="var(--color-error)"`. Missing-field tags: `bg-error-light text-error rounded-md px-2 py-1 text-xs font-semibold uppercase`. Added `--color-error-light: #fee2e2` to `@theme` in globals.css — ui-tokens.md only had `--color-error` and `--color-error-foreground`, no light variant existed for this track/tag treatment (unlike success/info which already had one).

### ResumeUpload

`components/profile/ResumeUpload.tsx`

`"use client"` (drag state + hidden file input ref). Dashed dropzone `border-2 border-dashed rounded-xl`, `border-border-muted bg-surface-secondary` at rest → `border-accent bg-accent-muted` while dragging over. Upload icon in a white circle badge (`UploadCloud` lucide icon, `text-accent`). "Generate Resume from Profile" is the primary button (`bg-accent text-accent-foreground` + `FileText` icon); "Select Resume" is a plain bordered pill inside the dropzone, not a real button element (the whole dropzone is the clickable target).

### SkillsInput

`components/profile/SkillsInput.tsx`

`"use client"`, fully controlled (`tags: string[]`, `onChange`) — reusable tag input used for both Skills and Industries in ProfileForm, which owns the actual state so it can serialize both arrays into the save payload. Input + `Add` button (`bg-surface-tertiary text-text-dark`) row, tags below as `bg-background text-text-secondary rounded-md` pills with an `X` remove icon. Enter key or the Add button commits the tag; duplicates are ignored.

### WorkExperienceSection

`components/profile/WorkExperienceSection.tsx`

`"use client"`, fully controlled (`roles: WorkExperienceEntry[]` from `types/index.ts`, `onChange`) — up to 3 role entries, state owned by ProfileForm. Each role is a card: `rounded-xl border border-border bg-background p-4`. Start/End Date use native `<input type="month">` (renders as "January 2022" with a calendar icon, matching the design exactly with zero custom date-picker code). "Currently working here" checkbox uses `accent-[var(--color-accent)]` to force the brand purple instead of the browser's native blue default (the source design's checkbox sampled as a vivid blue, `#0175FF`, that matches no token in this project — judged to be an unstyled-native-checkbox artifact in the mockup rather than an intentional color, so accent purple was used instead for brand consistency). Checking it clears and disables the End Date field. "Add role" (`text-accent`) appends a blank card, hidden once 3 roles exist; a small remove `X` appears on every card after the first.

### ProfileForm (updated, Feature 06)

`components/profile/ProfileForm.tsx`

`"use client"`, the single state owner for the whole editable profile (`useState<Profile>`, seeded from the server-fetched `initialProfile` prop) — renders `ResumeUpload` at its top and the "Profile Information" card below it, both inside one `<form onSubmit>` so a newly selected resume file and every field save together in one `saveProfile(formData)` call (via `useTransition`, not a native `<form action>` binding, since several fields are arrays/objects that need `JSON.stringify` into the FormData rather than relying on native field serialization). Shows an inline success (`bg-success-lightest`) or error (`bg-error/10`) banner after submit; the Save button reads "Saving..." and disables while pending.

**Feature 07 addition:** `handleExtract()` — `POST`s the selected resume file to `/api/resume/extract` (plain `fetch`, not a Server Action, since it's a read-only AI call with no DB write of its own) and merges the returned fields into state non-destructively.

**Feature 08 addition:** `handleGenerate()` — `POST`s to `/api/resume/generate` (no body; the route reads the **saved** profile from the DB, not this form's in-progress edits — generate from what you last saved, not unsaved keystrokes). On success, updates `profile.resumePdfUrl` and bumps `resumeKey` to remount `ResumeUpload` so "View current resume" reflects the freshly generated file immediately.

### ResumeUpload (updated, Feature 06)

`components/profile/ResumeUpload.tsx`

Now controlled: takes `userId: string`, `resumePdfUrl: string | null`, `onFileSelected(file)`, `onExtractClick(): void`, `isExtracting: boolean`, and `extractError: string | null`, rendered as a child of `ProfileForm`'s `<form>` rather than an independent sibling (page.tsx now only renders `CompletionIndicator` + `ProfileForm`). Shows the selected filename and an upload-pending hint once a file is chosen; shows a "View current resume" link when `resumePdfUrl` is set and nothing new is selected. Remounted (via a `key` bump in `ProfileForm`) after a successful save to clear its local selection state. "View current resume" is a `<button>`, not an `<a href>` — the `resumes` bucket is private and 401s on a plain unauthenticated navigation, so it fetches via `insforge.storage.from('resumes').download(\`${userId}/resume.pdf\`)` (the browser SDK client, auth-cookie attached automatically) and opens the result as a `URL.createObjectURL()` blob in a new tab.

**Feature 07 addition:** an "Extract from Resume" text button (`text-accent`, `FileText` icon) appears only while a file was just selected in this session (`selectedFileName` truthy) — not for an already-saved resume, since re-extracting from one would need downloading it back first (out of scope). Reads "Reading resume..." and disables while `isExtracting`; shows `extractError` inline below in `text-error` on failure. `ProfileForm` owns the actual `fetch("/api/resume/extract")` call and the non-destructive merge into form state (only overwrites a field when Claude actually returned a value for it).

**Feature 08 addition:** "Generate Resume from Profile" (already present as a static button since Feature 05) is now wired to `onGenerateClick`/`isGenerating`/`generateError` props — reads "Generating..." and disables while pending; `generateError` shows inline in `text-error` below the button row.

### ResumePDF (new, Feature 08)

`components/resume/ResumePDF.tsx`

Not a Tailwind/DOM component — a `@react-pdf/renderer` `Document`, styled via `StyleSheet.create()` with only the library's supported property subset (see library-docs.md). Single A4 page: name/title/contact header, Professional Summary, Work Experience (role + company on one line via `flexDirection: "row", justifyContent: "space-between"` with dates right-aligned, bullets below), Skills (one line, `•`-separated — no wrapping layout needed since it's a single string), Education. Called as a plain function (`ResumePDF({...})`) from `app/api/resume/generate/route.ts`, never as JSX, so that route stays a `.ts` file.

### FindJobsPage

`app/find-jobs/page.tsx`

`Navbar authenticated`, `max-w-[1200px]` container (matches the DashboardPreview mock's width convention from the homepage, for a consistent "app shell" feel across dashboard-style pages — wider than Profile's `max-w-3xl` single-column form). Two stacked pieces: `SearchControls` (its own card), then one shared `rounded-2xl border border-border bg-surface` card containing `JobFilters` → `JobsTable` → `JobsPagination` in sequence (matches the design's single continuous card, not three separate ones). Async Server Component: fetches the signed-in user via `createInsforgeServer()` (redirects to `/login` if absent, matching `app/profile/page.tsx`'s pattern). **As of Feature 11, `searchParams: Promise<{ q?, match?, sort?, page? }>` drives the whole query** — the standard App Router filtering/pagination pattern (`code-standards.md`'s "data fetching happens in Server Components" rule), not client-side fetching: `.eq(user_id)` always, `match=high/low` → `.gte`/`.lt("match_score", MATCH_THRESHOLD)`, `q` → `.or('company.ilike.%q%,title.ilike.%q%')`, sort → `.order("match_score"|"found_at", ...)`, pagination → `.range(from, to)` with `select("*", { count: "exact" })` for the real total (`JOBS_PAGE_SIZE = 20`, `lib/utils.ts`). Builds a `baseParams` querystring (current `q`/`match`/`sort`, `page` omitted) once and passes it to `JobsPagination` so page links preserve active filters.

### SearchControls

`components/find-jobs/SearchControls.tsx`

`"use client"`. Job Title input has a `Search` icon (`absolute left-3`, `pl-10` on the input); Location input has none — matches the design exactly, not an inconsistency. "Find Jobs" button: `bg-accent` + `Search` icon, `disabled` + label toggles to "Searching..." while a request is in flight. **As of Feature 10, wired to real `POST /api/agent/find`**: plain `fetch` + `useState` (`isSearching`/`result`/`error`), same shape as `ProfileForm.tsx`'s `handleExtract`/`handleGenerate` — not a Server Action, since this is an agent operation per `architecture.md`'s Data Flow distinction. On success, calls `router.refresh()` (`useRouter` from `next/navigation`) so the Server Component page re-fetches real jobs. Banner logic is now a real behavior change from Feature 09: **no banner at all until a search has run** (Feature 09's always-visible static banner is gone). After a search: `jobsFound > 0` → `bg-success-lightest` + `Sparkles` icon + `text-success-foreground`, copy `Found ${jobsFound} jobs and saved ${strongMatches} strong matches.`; `jobsFound === 0` → same slot but neutral `bg-surface-secondary` styling (zero results isn't a "success"), copy "No jobs found for this search. Try a different title or location."; request failure → `bg-error/10 text-error`, matching `ProfileForm`'s error-banner style.

### JobFilters

`components/find-jobs/JobFilters.tsx`

`"use client"`. Borderless search input (`Search` icon, no visible border/ring box — flush against the card's white background, matching the design) + two native `<select>` pills (`border border-border rounded-md`) for match-tier filter (All/High/Low Match) and sort (Match Score/Newest/Oldest). **As of Feature 11, real filtering**: dropdowns call `router.push()` (`useRouter`/`usePathname`) immediately on change, updating the page's URL search params (`match=`/`sort=`), which always resets `page` back to 1 by simply omitting it. The text input debounces 400ms after the user stops typing before navigating with `q=`. A sync `useEffect` resets local input state from the `defaultSearch` prop so browser back/forward navigation is reflected correctly, guarded (`search === defaultSearch` skip) so it doesn't re-trigger its own debounce loop. No fetch call here — navigation alone re-runs `FindJobsPage`'s server-side query.

### JobsTable

`components/find-jobs/JobsTable.tsx`

Originally a self-contained Server Component with static mock data — the exact same 6 companies/scores/colors as the homepage's `JobSearchSection` mock table (Vercel 94 success, Stripe 88 info, Linear 96 success, Notion 72 warning, OpenAI 91 success, Figma 85 info), confirmed via pixel sampling to be the identical illustrative dataset reused across both designs, not a real threshold formula. **As of Feature 10, this is now `JobsTable({ jobs }: { jobs: JobRow[] })`** — a prop-driven presentational component, `MOCK_JOBS` removed entirely. Per-row color is now derived from the real score via `scoreColor(score)`: `>=70` → success, `50–69` → warning, `<50` → muted, per `ui-tokens.md`'s documented "Match Score Colors" rule — the mock's decorative "info"/blue tier is dropped entirely for real data (it was never a real formula). Empty state (`jobs.length === 0`): centered message "No jobs yet — search above to get started." Columns: Company (icon + name, links to `/find-jobs/[id]`), Role (also links), Match Score (mini bar + %), Salary Est., Date Found. **No Source column** — `find-jobs.png` doesn't show one, and it would be uninformative anyway now that `jobs.source` is permanently `'search'` (Feature 04's CHECK constraint, since URL import is out of scope) — every row would show the same badge forever.

### JobsPagination

`components/find-jobs/JobsPagination.tsx`

Originally static per the design (`Previous` disabled, page `1` active, pages 2/3/…/8, `Next` enabled) with illustrative numbers that didn't arithmetically reconcile with `code-standards.md`'s 20-per-page rule. **As of Feature 11, this is a real Server Component** (`JobsPagination({ currentPage, totalPages, totalCount, pageSize, baseParams })`) — no `"use client"` needed, since page links are plain `<Link href>` navigation with no event handlers, matching the App Router's URL-search-param filtering pattern used across this page. Active page keeps the same `border-accent bg-accent-muted text-accent` styling. Page numbers are windowed (first two, last two, current ±1, `...` elsewhere) instead of a hardcoded `[1,2,3]` list, computed from the real `totalPages`. Prev/Next render as disabled `<button>`s at the boundary, `<Link>`s otherwise, each built via `hrefForPage(baseParams, page)` so the active `q`/`match`/`sort` filters are preserved across page changes. When `totalPages <= 1` the entire Prev/numbers/Next row is hidden — only the "Showing X to Y of Z results" text remains — rather than rendering disabled controls for nothing to paginate.

### JobDetailsPage

`app/find-jobs/[id]/page.tsx`

Async Server Component, dynamic route (`params: Promise<{ id }>`). `Navbar authenticated`, same `max-w-[1200px]` container as `FindJobsPage`. Fetches the signed-in user (redirect to `/login` if absent), then the one `jobs` row matching `id` AND `user_id` — `notFound()` if absent (covers "doesn't exist" and "belongs to another user" identically). "Back to Jobs" link (`ChevronLeft` + text, links to `/find-jobs`) and the bottom-of-page "Apply Now at {company}" full-width `bg-accent` button are inlined directly in the page — single-element, page-specific pieces, not worth their own component file (matches the design's structure: they're outside every card, not sections in their own right). All six `job-details/` components stack in a `gap-6` column between them.

### JobHeader

`components/job-details/JobHeader.tsx`

Company logo placeholder (`Building2` in a `bg-surface-tertiary` rounded square, same pattern as `JobsTable`'s row icon) + job title (`text-2xl font-bold`) + company name + match-score badge, "View Job Post" button (secondary style, `ExternalLink` icon) top-right, opens `job.sourceUrl` in a new tab. **Match-score badge is a 2-tier system** — `ui-tokens.md`'s "Status Badges" table (High Match: `bg-success-lightest`/`text-success-foreground`; Low Match: `bg-surface-secondary`/`text-secondary`), threshold at `MATCH_THRESHOLD` — deliberately not the 3-tier success/warning/muted split `JobsTable`'s score bar uses, since no light-warning-background badge token exists and this is a different UI element (a status badge, not a progress bar) with its own documented token set.

### JobInfoCards

`components/job-details/JobInfoCards.tsx`

Four-card row (`grid-cols-2 sm:grid-cols-4`): Salary Est. (`DollarSign`, `bg-success-lightest`/`text-success`), Location (`MapPin`, `bg-info-lightest`/`text-info`), Job Type (`Briefcase`, `bg-accent-light`/`text-accent`), Date Found (`Calendar`, `bg-surface-tertiary`/`text-text-secondary`) — colored icon square + bold value + uppercase muted label below, matching the design's four-icon row exactly. Value text truncates with a `title` tooltip for long locations (design shows "Newark, Ess…" truncated). Empty values fall back to "Not listed" (salary/location) or "—" (job type) — the design's own example job has no `job_type`, so this exact fallback is what's shown in the source image, not an invented edge case.

### MatchReasoning

`components/job-details/MatchReasoning.tsx`

"AI MATCH REASONING" uppercase label with a `Sparkles` icon in a `bg-success-lightest` circle, then `job.matchReason` rendered verbatim as a paragraph — no truncation, no markdown parsing (Claude's `matchReason` is already plain prose).

### SkillsComparison

`components/job-details/SkillsComparison.tsx`

"REQUIRED SKILLS VS YOUR PROFILE" uppercase label, two rows: "You have" + `matchedSkills` as green pills (`bg-success-lightest`/`text-success-foreground`, `Check` icon — `ui-tokens.md`'s Matched skill spec) and "Gap skills" + `missingSkills` as light-purple pills (`bg-accent-muted`/`text-accent`, `X` icon — `ui-tokens.md`'s Missing skill spec). **Confirmed against the design image, not `build-plan.md`'s prose** ("missing skills as red/orange badges") — the image shows light purple, matching the token spec exactly; resolved in the image's favor per this session's established practice.

### JobDescription

`components/job-details/JobDescription.tsx`

`FileText` icon + "Job Description" heading, then `job.aboutRole` (the raw Adzuna description text) as a single flowing paragraph (`whitespace-pre-line`). No structured responsibilities/requirements/benefits bullet lists — `agent/extractor.ts` stays unbuilt (no feature has assigned it work), and the design image itself shows one continuous paragraph, not bullets.

### CompanyResearch

`components/job-details/CompanyResearch.tsx`

`"use client"` (Feature 13 — was a Server Component through Feature 12's empty-state-only scope). "Company Research" heading (`Building2` icon in `bg-accent-light`) + "Research Company" button (`bg-accent`, `Search` icon) top-right, real `onClick` posting to `/api/agent/research` with `{ jobId }`, `router.refresh()` on success (same pattern as `SearchControls`). Button label toggles "Researching..." while in flight, "Re-research Company" once a dossier already exists (re-research is allowed and always overwrites, a confirmed design decision — see `docs/specs/0002-company-research-agent.md`). Three body states: **loading** (`isResearching`) — inline spinner + "Researching {company}..." replacing the empty-state block, confirmed answer over a bare disabled-button-only state; **has a dossier** — each of the 9 fields renders as its own nested card (`DossierSection`: `rounded-xl border border-border-light bg-surface-secondary p-4`, one level of nesting inside the outer `rounded-2xl` card — the max `ui-rules.md` allows), with a colored icon square ahead of each label (`Building2`/neutral for Company Overview, `Code2`/info for Tech Stack, `Users`/accent for Culture, `Target`/success for Why This Role, `Sparkles`/accent for Your Edge — echoing `MatchReasoning`'s sparkle, since both are AI-derived insight — `AlertTriangle`/warning for Gaps to Address, `HelpCircle`/info for Smart Questions, `BookOpen`/success for Interview Prep, `Link2`/neutral for Sources); `TagList` pills for Tech Stack, `BulletList` for the six bullet-list fields with a dot color matching its section's icon color, `Sources` as small external links; **empty** — the original Feature 12 empty state, unchanged. A failed request shows a `bg-error/10` error banner (matching `ProfileForm`/`SearchControls`'s established error style) without touching the body state, so a failed re-research never wipes an existing dossier. Improvised on request (no design image for the populated state) — the icon/color assignments reuse existing `ui-tokens.md` tokens only, no new hex values.

### DashboardPage

`app/dashboard/page.tsx`

Async Server Component, `Navbar authenticated`, same `max-w-[1200px]` container as every other authenticated page. No page heading (matches `FindJobsPage`/`ProfilePage`'s established omission — the navbar's active "Dashboard" state already identifies the page). Real auth check (redirect to `/login`), then a real `computeProfileCompletion(profile)` call gates `IncompleteProfileBanner` — this is genuine data, not mock, since `build-plan.md`'s Feature 14 line for it doesn't say "(mock)" the way the stat/activity/chart lines explicitly do, and the check was already built (Feature 05/06). Layout: banner (if shown) → `StatsBar` → a `lg:grid-cols-2` grid of `RecentActivity` / `ResumeTailoringChart` / `JobsFoundChart` / `MatchScoreChart`, in that reading order, matching `build-plan.md`'s own list order. **Built from `build-plan.md`'s written spec, not `context/designs/job_dashboard_ui.webp`** — that image is a mismatched asset for an unrelated product (different branding, blue theme, left sidebar contradicting `ui-rules.md`'s no-sidebar rule); confirmed with you before building.

### IncompleteProfileBanner

`components/dashboard/IncompleteProfileBanner.tsx`

Real data. Slim horizontal alert bar (not `ProfilePage`'s big completion-ring `CompletionIndicator` — a deliberately lighter nudge for a different page), `AlertCircle` icon, `border-warning/30`/`bg-warning/10` (opacity-modifier tokens, same technique as the established `bg-error/10` error-banner pattern — no new hex), "Complete Profile" button linking to `/profile`. Shown only when `computeProfileCompletion(profile).isComplete` is false.

### StatsBar

`components/dashboard/StatsBar.tsx`

**As of Feature 15, real data** — takes `{ totalJobs, avgMatchRate, companiesResearched, jobsThisWeek }` as props, computed by four parallel queries in `app/dashboard/page.tsx` (`Promise.all`, same pattern as Feature 11's find-jobs query: three `count`-only queries plus one `match_score` fetch averaged in application code — there's no `AVG()` aggregate exposed through the query builder). Four cards (`grid-cols-2 lg:grid-cols-4`), each a full `rounded-2xl` card (not `DashboardPreview`'s shrunk `rounded-xl` mock card) with a colored icon square top-right (`Briefcase`/accent for Total Jobs Found, `Target`/success for Avg. Match Rate, `Building2`/info for Companies Researched, `Calendar`/warning for Jobs This Week). **No trend badges** — Feature 15's spec gives a formula for each raw number but never a week-over-week delta, and fabricating one next to real data would be misleading; each card shows a plain descriptive note instead ("All time," "Across all jobs," etc.). Avg. Match Rate shows `—`, never a fabricated `0%`, when there are no jobs to average. **4th stat is "Jobs This Week," not `build-plan.md` Feature 14's "Cover Letters Generated"** — a real inconsistency between Feature 14's mock list and Feature 15's real-data list, resolved in favor of "Jobs This Week" since no feature in this build plan ever generates cover letters (see `progress-tracker.md` for the full reasoning); this also now matches `DashboardPreview`'s original 4th stat, which used "Jobs This Week" all along.

### RecentActivity

`components/dashboard/RecentActivity.tsx`

**As of Feature 16, real data** — takes `{ activity: ActivityEntry[] }` as a prop, built in `app/dashboard/page.tsx` by merging completed `agent_runs` rows ("Found X jobs for {jobTitle}", success/green dot) and researched `jobs` rows ("Researched {company}", info/blue dot), sorted by timestamp and capped at 5. Only two dot colors now — the mock's third "accent" (resume tailored) type is gone entirely, confirmed to have no real agent behind it (flagged back in Feature 14). Each entry: a colored dot (`border-2 border-surface` outer ring, per `ui-tokens.md`'s Activity Dots spec: 16px outer/8px inner) + label + relative time (`formatRelativeTime`). Real empty state ("No activity yet — search for jobs or research a company to see it here.") when the merged list is empty, per `ui-rules.md`'s empty-state rule.

### ChartCard

`components/dashboard/ChartCard.tsx`

Shared title + card shell (`rounded-2xl border border-border bg-surface p-6`) used by all three chart components below — pulled out once three components needed the identical wrapper, not a speculative abstraction.

### EmptyChartState

`components/dashboard/EmptyChartState.tsx`

Shared empty-state block (`h-40`, centered, dashed border, `bg-surface-secondary`) used by all three chart components below when their data has no non-zero points — pulled out once three components needed the identical block, not a speculative abstraction. Per `ui-rules.md`'s "every section that can be empty must have an empty state" rule.

### JobsFoundChart / MatchScoreChart / CompanyResearchChart

`components/dashboard/JobsFoundChart.tsx`, `components/dashboard/MatchScoreChart.tsx`, `components/dashboard/CompanyResearchChart.tsx`

**As of Feature 17, real data, rendered with `recharts`** — replaces both the Feature 14 mock versions and the hand-rolled Tailwind/SVG charts from before this feature. All three take real data as a prop (`DaySeriesPoint[]` or `MatchScoreBucket[]` from `lib/posthog-query.ts`) and pick between the real `recharts` chart and `EmptyChartState` based on whether any point has a non-zero count. `JobsFoundChart` is a `LineChart` (`var(--color-accent)` stroke, 3px, circle point markers with a `var(--color-surface)` fill so they read as "on" the line); `MatchScoreChart` and `CompanyResearchChart` are `BarChart`s (`var(--color-success)` and `var(--color-info)` fills respectively, per `ui-tokens.md`'s Dashboard Chart Colors table). All three share the same axis styling: no axis line, no tick line, `12px`/`text-text-muted` tick labels, a dashed `var(--color-border)` `CartesianGrid` with no vertical lines — matching the original hand-rolled charts' look as closely as `recharts`' own styling props allow. **`ResumeTailoringChart.tsx` is deleted**, not kept unused — no event in `code-standards.md`'s fixed PostHog event list ever backed a "resume tailored" concept, confirmed back in Feature 14 and again here; `CompanyResearchChart.tsx` takes its grid slot, per `build-plan.md`'s Feature 17 chart list. Recharts' `ResponsiveContainer` only measures and draws its inner SVG client side (no `ResizeObserver` during server rendering) — confirmed as expected, standard `recharts` + SSR behavior, not a bug, while verifying this feature.

## Cross-feature notes

- Discrepancies between a design image and `build-plan.md`'s prose spec are resolved in favor of the **image** (the explicit source of truth when both are provided for the same feature) — logged here and in `progress-tracker.md`, not silently reconciled by editing the image's intent away. Feature 05 (`Cover Letter Tone` field), Feature 09 (`Source` column, `Jobs by Adzuna` credit), and Feature 12 (gap-skill badge color: light purple per the image and `ui-tokens.md`, not the prose's "red/orange") are all instances of this.
- **Exception: Feature 14's `job_dashboard_ui.webp` is not this product's design** — a different brand, color scheme, and a sidebar layout that contradicts `ui-rules.md`'s own "no sidebar" invariant. The image-over-prose rule above only applies when the image is actually a JobPilot mockup; here the prose (`build-plan.md`'s Feature 14 UI list) is the real source of truth. Flagged and confirmed with you before building rather than either silently pixel-matching a wrong design or silently discarding it.
