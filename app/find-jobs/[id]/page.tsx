import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JobHeader } from "@/components/job-details/JobHeader";
import { JobInfoCards } from "@/components/job-details/JobInfoCards";
import { MatchReasoning } from "@/components/job-details/MatchReasoning";
import { SkillsComparison } from "@/components/job-details/SkillsComparison";
import { JobDescription } from "@/components/job-details/JobDescription";
import { CompanyResearch } from "@/components/job-details/CompanyResearch";
import { createInsforgeServer } from "@/lib/insforge-server";
import { mapJobRow } from "@/lib/jobs";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailsPage({ params }: Props) {
  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  if (!authData.user) {
    redirect("/login");
  }

  const { id } = await params;

  const { data: row } = await insforge.database
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!row) {
    notFound();
  }

  const job = mapJobRow(row as Record<string, unknown>);
  const applyUrl = job.sourceUrl ?? job.externalApplyUrl;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar authenticated />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        <div className="flex flex-col gap-6">
          <Link
            href="/find-jobs"
            className="flex w-fit items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          <JobHeader job={job} applyUrl={applyUrl} />
          <JobInfoCards job={job} />
          <MatchReasoning reason={job.matchReason} />
          <SkillsComparison matchedSkills={job.matchedSkills} missingSkills={job.missingSkills} />
          <JobDescription description={job.aboutRole} />
          <CompanyResearch
            jobId={job.id}
            company={job.company}
            companyResearch={job.companyResearch}
          />

          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-md bg-accent px-6 py-3 text-center text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Apply Now at {job.company}
            </a>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
