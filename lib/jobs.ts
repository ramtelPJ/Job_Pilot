import type { CompanyResearch, Job } from "@/types";

export function mapJobRow(row: Record<string, unknown>): Job {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    userId: row.user_id as string,
    source: "search",
    sourceUrl: (row.source_url as string) ?? null,
    externalApplyUrl: (row.external_apply_url as string) ?? null,
    title: row.title as string,
    company: row.company as string,
    location: (row.location as string) ?? null,
    salary: (row.salary as string) ?? null,
    jobType: (row.job_type as string) ?? null,
    aboutRole: (row.about_role as string) ?? null,
    responsibilities: (row.responsibilities as string[]) ?? [],
    requirements: (row.requirements as string[]) ?? [],
    niceToHave: (row.nice_to_have as string[]) ?? [],
    benefits: (row.benefits as string[]) ?? [],
    aboutCompany: (row.about_company as string) ?? null,
    matchScore: (row.match_score as number) ?? null,
    matchReason: (row.match_reason as string) ?? null,
    matchedSkills: (row.matched_skills as string[]) ?? [],
    missingSkills: (row.missing_skills as string[]) ?? [],
    companyResearch: (row.company_research as CompanyResearch) ?? null,
    foundAt: row.found_at as string,
    researchedAt: (row.researched_at as string) ?? null,
  };
}
