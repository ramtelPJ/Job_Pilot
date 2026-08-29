# PostHog Self-driving setup report

## Summary

PostHog Self-driving has been configured for JobPilot. Session Replay, Error Tracking, and Support (Conversations) products are on; six signal sources are wired to the inbox; a selective scout troop of five is running; and two Replay Vision scanners are watching JobPilot's key flows and pushing findings directly to the inbox. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/583489/inbox) within ~30 minutes.

---

## AI data processing

**Approved.** Organization-level AI data processing approval was granted before this run.

---

## GitHub

**Already connected.** The GitHub App integration for account `ramtelPJ` was present before this run (integration id: 258437, connected 2026-08-29). No action needed.

---

## Products enabled

| Product | Result | Notes |
|---|---|---|
| Session Replay | **Already enabled** | No posthog.init override (`disable_session_recording`) found — server flip is in effect. |
| Error Tracking | **Enabled** | Newly turned on this run. No posthog.init override (`capture_exceptions`) found — server flip is in effect. |
| Support (Conversations) | **Enabled** | Newly turned on this run. Tickets only arrive once an inbound channel is connected — see Follow-ups. |

---

## Signal sources

| source_product | source_type | Action |
|---|---|---|
| `signals_scout` | `cross_source_issue` | Skipped — ON by default; no row needed |
| `health_checks` | `health_issue` | **Enabled** |
| `error_tracking` | `issue_created` | **Enabled** |
| `error_tracking` | `issue_reopened` | **Enabled** |
| `error_tracking` | `issue_spiking` | **Enabled** |
| `session_replay` | `session_analysis_cluster` | **Enabled** (default 10% sample rate) |
| `conversations` | `ticket` | **Enabled** |

---

## Connected tools

No connected-tool sources were selected. The question was presented and cancelled by the user.

---

## Scout troop

**Run budget:** 100 runs/day (3 per tick) during early access. 0 runs used today. Banner: *"Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."*

### Enabled (5)

| Scout | Why enabled |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations and uncovered surfaces |
| `signals-scout-product-analytics` | JobPilot tracks core product events (job_search_started, job_found, profile_completed, company_researched) and has dashboard analytics charts |
| `signals-scout-ai-observability` | GPT-4o is central to JobPilot (job matching, resume parsing, company research) — LLM cost/latency/error monitoring is critical |
| `signals-scout-observability-gaps` | Fresh project likely has event coverage gaps; recommends missing insights and alerts |
| `signals-scout-health-checks` | Monitors PostHog instrumentation health on this fresh setup |

### Disabled (22)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by native error_tracking source (intentional — not a re-enable follow-up) |
| `signals-scout-session-replay` | Covered by native session_replay source (intentional — not a re-enable follow-up) |
| `signals-scout-surveys` | No surveys in use |
| `signals-scout-feature-flags` | No feature flags in use — enable in PostHog if you add flags |
| `signals-scout-experiments` | No A/B experiments in use |
| `signals-scout-revenue-analytics` | No payment SDK or revenue data found |
| `signals-scout-web-analytics` | No UTM/referrer tracking detected |
| `signals-scout-logs` | PostHog logs product not in use — enable if you add log capture |
| `signals-scout-csp-violations` | No CSP reporting configured |
| `signals-scout-customer-analytics` | No group/accounts analytics (B2B) in use |
| `signals-scout-data-pipelines` | No CDP destinations or hog flows configured |
| `signals-scout-data-warehouse` | No data warehouse sources connected |
| `signals-scout-anomaly-detection` | No saved dashboards yet to watch |
| `signals-scout-conversations` | Conversations product enabled but no channel connected yet; enable once tickets flow |
| `signals-scout-replay-vision` | No prior scanner observations to trend across |
| `signals-scout-inbox-validation` | Fresh setup — no shipped fixes to validate |
| `signals-scout-apm` | No OpenTelemetry tracing instrumented |
| `signals-scout-mcp-tool-calls` | No MCP tool call telemetry |
| `signals-scout-insight-alerts` | No insight alerts configured |
| `signals-scout-tasks` | No PostHog Tasks in use |
| `signals-scout-skills-store` | No skills-store hygiene issues to watch |
| `signals-scout-web-vitals` | No `$web_vitals` events yet |

---

## Custom scouts

**Two proposed, both declined (user cancelled the proposal).**

### Considered and ruled out (built-in coverage)

| Surface | Filter that ruled it out |
|---|---|
| Company research success/failure | Covered by `signals-scout-ai-observability` (GPT-4o LLM traces) |
| Profile completion rate | Will be covered by `signals-scout-product-analytics` once a funnel insight is saved |
| Adzuna API health | Merged into job discovery funnel candidate (same signals) |
| Error/session surfaces | Covered by native sources (error_tracking, session_replay) |

### Proposed, declined

| Scout | What it would have watched |
|---|---|
| Job search funnel watch | `job_search_started` → `job_found` ratio — searches with zero or few returned jobs signalling Adzuna degradation or GPT-4o scoring failure |
| AI match score quality | Average `job_found.matchScore` distribution drift — GPT-4o result quality regression before users lose trust |

**Noise escape hatch:** If any scout turns out noisy, set `emit: false` on its config in PostHog to switch it to dry-run — it keeps running and logging without writing to the inbox.

---

## Replay Vision scanners

Replay Vision scanners are LLMs that watch individual session recordings on a schedule and push what they find directly to the Self-driving inbox. Findings arrive at half weight and need corroboration before being promoted into a full report. These are the only part of this setup that spends Replay Vision quota.

The project had one session recording at setup time (from localhost:3000/login). Both scanners are armed and will start working as more recordings accumulate.

Credit spend was not verified — the `creating-replay-vision-scanners` sizing skill was unavailable on this deploy. Both briefs use bounded queries (URL-scoped or rage-click gated) so projected spend is a small fraction of the default budget.

### Created

| Scanner | Type | What it watches | Query scope | Sampling rate |
|---|---|---|---|---|
| **Job details and apply breakage** | monitor | Visible product breakage: blank job details, Company Research spinner never resolving, Apply Now button failing, match scores missing, search results loading empty | Sessions with `/find-jobs/` in the URL — the job details and application flow | 50% |
| **Job search and research frustration** | monitor | User frustration signals: hammering Find Jobs, repeatedly clicking Research Company, rage-clicking Apply Now, retrying searches, switching repeatedly between list and detail pages | Sessions containing a `$rageclick` event (full sample, rage-click is the gate) | 100% |

**Disjointness:** The breakage scanner owns *where* (URL scope), the frustration scanner owns *what they did* (`$rageclick` gate). Their queries are disjoint by design so a single defect cannot corroborate itself.

---

## Follow-ups

- [ ] **Connect a Support channel**: Conversations is enabled but tickets only arrive once an inbound channel (email, inbox, or Slack) is connected — go to PostHog → Support → Channels to add one.
- [ ] **Set up `$ai_*` event capture**: JobPilot uses GPT-4o for job matching, resume parsing, and company research, but no `$ai_*` events were found. Adding PostHog AI analytics instrumentation will make `signals-scout-ai-observability` much more effective. See: [PostHog LLM analytics docs](https://posthog.com/docs/ai-engineering/llm-analytics).
- [ ] **Save funnel insights in PostHog**: `signals-scout-product-analytics` watches *saved* funnel/retention flows. Create a funnel from `job_search_started` → `job_found` → `company_researched` in PostHog Insights to give the scout something to monitor.
- [ ] **Consider custom scouts later**: Two custom scouts were proposed (job search funnel watch, AI match score quality) but declined. They can be added later from the inbox or by re-running `/self-driving-setup`.
- [ ] **Replay Vision quota**: Credit spend for the two scanners was not verified (sizing skill unavailable). Monitor credits in PostHog → Replay Vision if spend is a concern.

---

## What happens next

The scout coordinator picks up fresh configs within ~30 minutes. Scout runs draw from the project's daily budget (100 runs/day by default during early access). Findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/583489/inbox); immediately-actionable ones can start coding tasks automatically. The two Replay Vision scanners run on a 5-minute sweep cycle and push breakage and frustration findings to the inbox as sessions accumulate.
