import { searchJobs, detectCountry } from "@/lib/adzuna";
import { scoreJob } from "@/agent/matcher";
import { logAgentError } from "@/agent/log";
import { createInsforgeServer } from "@/lib/insforge-server";
import { mapJobRow } from "@/lib/jobs";
import type { Job, Profile } from "@/types";

function formatSalary(min?: number, max?: number): string | null {
  if (min == null) return null;
  if (max == null) return `$${Math.round(min / 1000)}k+`;
  return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
}

export async function discoverJobs(
  jobTitle: string,
  location: string,
  profile: Profile,
  runId: string,
): Promise<{ success: boolean; jobs?: Job[]; error?: string }> {
  try {
    const country = detectCountry(location);
    const results = await searchJobs(jobTitle, location, country);

    const insforge = await createInsforgeServer();

    // Score every job concurrently — sequential per-job Claude calls were the
    // slow part (up to 10 round trips back to back). Insert order no longer
    // matches search-result order, but `found_at`/matchScore sort in the UI
    // doesn't depend on insert order anyway.
    const scored = await Promise.all(
      results.map((adzunaJob) => scoreJob(adzunaJob, profile, runId)),
    );

    const inserts = await Promise.all(
      results.map(async (adzunaJob, i) => {
        const result = scored[i];
        if (!result.success || !result.score) {
          return null;
        }

        const { data, error } = await insforge.database
          .from("jobs")
          .insert({
            user_id: profile.id,
            run_id: runId,
            source: "search",
            source_url: adzunaJob.redirect_url,
            external_apply_url: adzunaJob.redirect_url,
            title: adzunaJob.title,
            company: adzunaJob.company.display_name,
            location: adzunaJob.location.display_name,
            salary: formatSalary(adzunaJob.salary_min, adzunaJob.salary_max),
            job_type: adzunaJob.contract_type || "fulltime",
            about_role: adzunaJob.description,
            match_score: result.score.matchScore,
            match_reason: result.score.matchReason,
            matched_skills: result.score.matchedSkills,
            missing_skills: result.score.missingSkills,
            found_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error || !data) {
          await logAgentError(runId, null, error);
          return null;
        }

        return mapJobRow(data);
      }),
    );

    const savedJobs = inserts.filter((job): job is Job => job !== null);

    return { success: true, jobs: savedJobs };
  } catch (error) {
    await logAgentError(runId, null, error);
    return { success: false, error: String(error) };
  }
}
