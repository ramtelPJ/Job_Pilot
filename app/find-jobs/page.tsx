import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsTable, type JobRow } from "@/components/find-jobs/JobsTable";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { createInsforgeServer } from "@/lib/insforge-server";
import { formatRelativeTime, JOBS_PAGE_SIZE, MATCH_THRESHOLD } from "@/lib/utils";

type MatchFilter = "all" | "high" | "low";
type SortOption = "match_score" | "newest" | "oldest";

function parseMatchFilter(value: string | undefined): MatchFilter {
  return value === "high" || value === "low" ? value : "all";
}

function parseSort(value: string | undefined): SortOption {
  return value === "newest" || value === "oldest" ? value : "match_score";
}

type Props = {
  searchParams: Promise<{ q?: string; match?: string; sort?: string; page?: string }>;
};

export default async function FindJobsPage({ searchParams }: Props) {
  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  if (!authData.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const match = parseMatchFilter(params.match);
  const sort = parseSort(params.sort);
  const page = Math.max(1, Number(params.page) || 1);

  const from = (page - 1) * JOBS_PAGE_SIZE;
  const to = from + JOBS_PAGE_SIZE - 1;

  let query = insforge.database
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("user_id", authData.user.id);

  if (match === "high") {
    query = query.gte("match_score", MATCH_THRESHOLD);
  } else if (match === "low") {
    query = query.lt("match_score", MATCH_THRESHOLD);
  }

  if (search) {
    const pattern = `%${search.replace(/,/g, " ")}%`;
    query = query.or(`company.ilike.${pattern},title.ilike.${pattern}`);
  }

  if (sort === "newest") {
    query = query.order("found_at", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("found_at", { ascending: true });
  } else {
    query = query.order("match_score", { ascending: false });
  }

  const { data: rows, count } = await query.range(from, to);

  const jobs: JobRow[] = (rows ?? []).map((row) => ({
    id: row.id,
    company: row.company,
    role: row.title,
    score: row.match_score ?? 0,
    salary: row.salary ?? "Not listed",
    dateFound: formatRelativeTime(row.found_at),
  }));

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / JOBS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const baseParams = new URLSearchParams();
  if (search) baseParams.set("q", search);
  if (match !== "all") baseParams.set("match", match);
  if (sort !== "match_score") baseParams.set("sort", sort);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar authenticated />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        <div className="flex flex-col gap-6">
          <SearchControls />

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <JobFilters defaultSearch={search} defaultMatch={match} defaultSort={sort} />
            <div className="overflow-x-auto">
              <JobsTable jobs={jobs} />
            </div>
            <JobsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={JOBS_PAGE_SIZE}
              baseParams={baseParams.toString()}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
