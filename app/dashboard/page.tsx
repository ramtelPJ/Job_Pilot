import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { IncompleteProfileBanner } from "@/components/dashboard/IncompleteProfileBanner";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { RecentActivity, type ActivityEntry } from "@/components/dashboard/RecentActivity";
import { JobsFoundChart } from "@/components/dashboard/JobsFoundChart";
import { MatchScoreChart } from "@/components/dashboard/MatchScoreChart";
import { CompanyResearchChart } from "@/components/dashboard/CompanyResearchChart";
import { createInsforgeServer } from "@/lib/insforge-server";
import { emptyProfile, mapRowToProfile, type ProfileRow } from "@/lib/profile";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { formatRelativeTime } from "@/lib/utils";
import {
  getJobsFoundSeries,
  getMatchScoreDistribution,
  getCompanyResearchSeries,
} from "@/lib/posthog-query";

const RECENT_ACTIVITY_LIMIT = 5;

export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  if (!authData.user) {
    redirect("/login");
  }

  const { data: row } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  const profile = row
    ? mapRowToProfile(row as ProfileRow, authData.user.email ?? "")
    : emptyProfile(authData.user.id, authData.user.email ?? "");

  const { isComplete } = computeProfileCompletion(profile);

  const userId = authData.user.id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalJobsResult,
    matchScoresResult,
    companiesResearchedResult,
    jobsThisWeekResult,
    completedRunsResult,
    researchedJobsResult,
  ] = await Promise.all([
    insforge.database
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    insforge.database.from("jobs").select("match_score").eq("user_id", userId),
    insforge.database
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("company_research", "is", null),
    insforge.database
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("found_at", sevenDaysAgo),
    insforge.database
      .from("agent_runs")
      .select("job_title_searched, jobs_found, started_at, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(RECENT_ACTIVITY_LIMIT),
    insforge.database
      .from("jobs")
      .select("company, researched_at")
      .eq("user_id", userId)
      .not("researched_at", "is", null)
      .order("researched_at", { ascending: false })
      .limit(RECENT_ACTIVITY_LIMIT),
  ]);

  const totalJobs = totalJobsResult.count ?? 0;
  const matchScores = (matchScoresResult.data ?? [])
    .map((row) => row.match_score as number | null)
    .filter((score): score is number => typeof score === "number");
  const avgMatchRate =
    matchScores.length > 0
      ? Math.round(matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length)
      : null;
  const companiesResearched = companiesResearchedResult.count ?? 0;
  const jobsThisWeek = jobsThisWeekResult.count ?? 0;

  const runEntries = (completedRunsResult.data ?? []).map((row) => ({
    label: `Found ${row.jobs_found ?? 0} jobs for ${row.job_title_searched ?? "your search"}`,
    timestamp: (row.completed_at as string) ?? (row.started_at as string),
    dot: "success" as const,
  }));

  const researchEntries = (researchedJobsResult.data ?? []).map((row) => ({
    label: `Researched ${row.company}`,
    timestamp: row.researched_at as string,
    dot: "info" as const,
  }));

  const activity: ActivityEntry[] = [...runEntries, ...researchEntries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((entry) => ({
      label: entry.label,
      dot: entry.dot,
      time: formatRelativeTime(entry.timestamp),
    }));

  const [jobsFoundSeries, matchScoreDistribution, companyResearchSeries] = await Promise.all([
    getJobsFoundSeries(userId),
    getMatchScoreDistribution(userId),
    getCompanyResearchSeries(userId),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar authenticated />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        <div className="flex flex-col gap-6">
          {!isComplete && <IncompleteProfileBanner />}

          <StatsBar
            totalJobs={totalJobs}
            avgMatchRate={avgMatchRate}
            companiesResearched={companiesResearched}
            jobsThisWeek={jobsThisWeek}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RecentActivity activity={activity} />
            <CompanyResearchChart data={companyResearchSeries} />
            <JobsFoundChart data={jobsFoundSeries} />
            <MatchScoreChart data={matchScoreDistribution} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
