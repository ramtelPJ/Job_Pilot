const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MATCH_SCORE_RANGES = [
  { range: "50-60%", min: 50, max: 60 },
  { range: "60-70%", min: 60, max: 70 },
  { range: "70-80%", min: 70, max: 80 },
  { range: "80-90%", min: 80, max: 90 },
  { range: "90-100%", min: 90, max: 100 },
];

export type DaySeriesPoint = { date: string; count: number };
export type MatchScoreBucket = { range: string; count: number };

function warnMissingConfig(): void {
  if (process.env.NODE_ENV === "development") {
    console.error(
      "POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID required to read PostHog analytics " +
        "are missing or un-configured, so dashboard charts render empty. This error stops " +
        "appearing once both are configured.",
    );
  }
}

function isValidUserId(userId: string): boolean {
  return UUID_PATTERN.test(userId);
}

function lastNDays(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function zeroFillSeries(days: string[], rows: unknown[][]): DaySeriesPoint[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const date = String(row[0]).slice(0, 10);
    const count = Number(row[1]) || 0;
    counts.set(date, count);
  }
  return days.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

function emptyMatchScoreBuckets(): MatchScoreBucket[] {
  return MATCH_SCORE_RANGES.map((r) => ({ range: r.range, count: 0 }));
}

// Runs a HogQL query against PostHog's Query API and returns its result rows.
// Never throws — a missing credential, a failed request, or an unexpected
// response shape all fall back to an empty result, since a dashboard chart
// going quietly empty is always the right failure mode here, never a crash.
// The exact shape of `results` (array of row arrays vs. named columns) was
// confirmed from PostHog's docs but not yet exercised against a live key —
// see spec 0003's Follow-up. This only trusts an array-of-row-arrays shape.
async function runHogQLQuery(query: string): Promise<unknown[][]> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !projectId || !host) {
    warnMissingConfig();
    return [];
  }

  try {
    const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    });

    if (!response.ok) {
      console.error("[posthog-query]", response.status, await response.text());
      return [];
    }

    const data = await response.json();
    const results = data?.results;
    if (!Array.isArray(results) || !results.every((row) => Array.isArray(row))) {
      return [];
    }

    return results as unknown[][];
  } catch (error) {
    console.error("[posthog-query]", error);
    return [];
  }
}

export async function getJobsFoundSeries(userId: string): Promise<DaySeriesPoint[]> {
  const days = lastNDays(30);
  if (!isValidUserId(userId)) return zeroFillSeries(days, []);

  const rows = await runHogQLQuery(
    `SELECT toDate(timestamp), count() FROM events ` +
      `WHERE event = 'job_found' AND distinct_id = '${userId}' ` +
      `AND timestamp >= now() - INTERVAL 30 DAY GROUP BY 1 ORDER BY 1`,
  );
  return zeroFillSeries(days, rows);
}

export async function getCompanyResearchSeries(userId: string): Promise<DaySeriesPoint[]> {
  const days = lastNDays(7);
  if (!isValidUserId(userId)) return zeroFillSeries(days, []);

  const rows = await runHogQLQuery(
    `SELECT toDate(timestamp), count() FROM events ` +
      `WHERE event = 'company_researched' AND distinct_id = '${userId}' ` +
      `AND timestamp >= now() - INTERVAL 7 DAY GROUP BY 1 ORDER BY 1`,
  );
  return zeroFillSeries(days, rows);
}

export async function getMatchScoreDistribution(userId: string): Promise<MatchScoreBucket[]> {
  if (!isValidUserId(userId)) return emptyMatchScoreBuckets();

  const rows = await runHogQLQuery(
    `SELECT properties.matchScore FROM events ` +
      `WHERE event = 'job_found' AND distinct_id = '${userId}' ` +
      `AND properties.matchScore IS NOT NULL`,
  );

  const buckets = emptyMatchScoreBuckets();
  for (const row of rows) {
    const score = Number(row[0]);
    if (!Number.isFinite(score)) continue;
    const bucketIndex = MATCH_SCORE_RANGES.findIndex((r) =>
      r.max === 100 ? score >= r.min && score <= r.max : score >= r.min && score < r.max,
    );
    if (bucketIndex !== -1) buckets[bucketIndex].count += 1;
  }
  return buckets;
}
