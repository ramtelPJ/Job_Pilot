import { NextRequest, NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { mapJobRow } from "@/lib/jobs";
import { mapRowToProfile, type ProfileRow } from "@/lib/profile";
import { researchCompany } from "@/agent/research";
import { getPostHogClient } from "@/lib/posthog-server";

// Measured real-world latency (Feature 13): 110-120s for a content-rich
// company (Browserbase session + up to 3 sub-page extracts + Claude
// synthesis). Vercel's default function timeout (10-15s) would kill this
// route long before it finishes. This only takes effect on a plan that
// allows it — Hobby hard-caps at 60s regardless of this value, so this
// route needs at least a Pro plan to complete reliably. See deploy guide.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job id is required." },
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

    const { data: jobRow } = await insforge.database
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!jobRow) {
      return NextResponse.json(
        { success: false, error: "Job not found." },
        { status: 404 },
      );
    }

    const { data: profileRow } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profileRow) {
      return NextResponse.json(
        { success: false, error: "Complete your profile before researching a company." },
        { status: 422 },
      );
    }

    const job = mapJobRow(jobRow as Record<string, unknown>);
    const profile = mapRowToProfile(profileRow as ProfileRow, authData.user.email ?? "");

    const result = await researchCompany(job, profile);

    if (!result.success || !result.dossier) {
      return NextResponse.json(
        { success: false, error: "Company research failed. Please try again." },
        { status: 500 },
      );
    }

    const { error: updateError } = await insforge.database
      .from("jobs")
      .update({ company_research: result.dossier, researched_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[agent/research]", updateError);
      return NextResponse.json(
        { success: false, error: "Company research failed. Please try again." },
        { status: 500 },
      );
    }

    const posthog = getPostHogClient();
    if (posthog) {
      posthog.capture({
        distinctId: userId,
        event: "company_researched",
        properties: { userId, jobId, company: job.company },
      });
      await posthog.flush();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[agent/research]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
