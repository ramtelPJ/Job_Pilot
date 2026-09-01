import { NextRequest, NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { discoverJobs } from "@/agent/adzuna";
import { mapRowToProfile, type ProfileRow } from "@/lib/profile";
import { getPostHogClient } from "@/lib/posthog-server";
import { MATCH_THRESHOLD } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";

    if (!jobTitle) {
      return NextResponse.json(
        { success: false, error: "Job title is required." },
        { status: 400 },
      );
    }

    const insforge = await createInsforgeServer();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in." },
        { status: 401 },
      );
    }

    const userId = authData.user.id;

    const { data: row } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!row || !row.skills || row.skills.length === 0) {
      return NextResponse.json(
        { success: false, error: "Add skills to your profile before searching for jobs." },
        { status: 422 },
      );
    }

    const profile = mapRowToProfile(row as ProfileRow, authData.user.email ?? "");

    const { data: run, error: runError } = await insforge.database
      .from("agent_runs")
      .insert({
        user_id: userId,
        status: "running",
        job_title_searched: jobTitle,
        location_searched: location || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !run) {
      console.error("[agent/find]", runError);
      return NextResponse.json(
        { success: false, error: "Could not start search." },
        { status: 500 },
      );
    }

    const posthog = getPostHogClient();
    if (posthog) {
      posthog.capture({
        distinctId: userId,
        event: "job_search_started",
        properties: { userId, jobTitle, location },
      });
      await posthog.flush();
    }

    const result = await discoverJobs(jobTitle, location, profile, run.id);

    if (!result.success) {
      await insforge.database
        .from("agent_runs")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", run.id);

      return NextResponse.json(
        { success: false, error: "Job search failed. Please try again." },
        { status: 500 },
      );
    }

    const jobs = result.jobs ?? [];

    if (posthog) {
      for (const job of jobs) {
        posthog.capture({
          distinctId: userId,
          event: "job_found",
          properties: { userId, source: job.source, matchScore: job.matchScore },
        });
        await posthog.flush();
      }
    }

    const strongMatches = jobs.filter((job) => (job.matchScore ?? 0) >= MATCH_THRESHOLD).length;

    await insforge.database
      .from("agent_runs")
      .update({
        status: "completed",
        jobs_found: jobs.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json({
      success: true,
      data: { jobsFound: jobs.length, strongMatches },
    });
  } catch (error) {
    console.error("[agent/find]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
