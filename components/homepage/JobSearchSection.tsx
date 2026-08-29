import { Building2 } from "lucide-react";

type ScoreColor = "success" | "info" | "warning";

type JobRow = {
  company: string;
  score: number;
  color: ScoreColor;
  salary: string;
  source: "LinkedIn" | "URL";
};

const JOBS: JobRow[] = [
  { company: "Vercel", score: 94, color: "success", salary: "$160k - $200k", source: "LinkedIn" },
  { company: "Stripe", score: 88, color: "info", salary: "$180k - $240k", source: "URL" },
  { company: "Linear", score: 96, color: "success", salary: "$150k - $190k", source: "LinkedIn" },
  { company: "Notion", score: 72, color: "warning", salary: "$130k - $170k", source: "LinkedIn" },
  { company: "OpenAI", score: 91, color: "success", salary: "$200k - $280k", source: "LinkedIn" },
  { company: "Figma", score: 85, color: "info", salary: "$170k - $220k", source: "URL" },
];

const SCORE_FILL: Record<ScoreColor, string> = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
};

const FEATURES = [
  {
    title: "Find jobs that actually fit",
    description:
      "Search by title and location or paste a job link. Get matched roles you can quickly scan.",
    highlighted: true,
  },
  {
    title: "Know the Company Before You Apply",
    description:
      "Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence.",
    highlighted: false,
  },
  {
    title: "Keep track of every application",
    description:
      "Keep a clear view of every job you've found, tailored. Your activity and progress all stay in one simple place.",
    highlighted: false,
  },
];

export function JobSearchSection() {
  return (
    <section className="grid grid-cols-1 border-t border-border-light lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 lg:pl-[max(24px,calc((100vw-1440px)/2+64px))] lg:pr-16">
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Manage Your Job Search With Ease
        </h2>

        <div className="mt-8 flex flex-col">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`border-t border-border-light py-6 pl-5 first:border-t-0 first:pt-0 ${
                feature.highlighted
                  ? "border-l-2 border-l-accent-dark"
                  : "border-l-2 border-l-border-light"
              }`}
            >
              <p className="text-base font-semibold text-text-primary">
                {feature.title}
              </p>
              <p className="mt-1.5 text-sm text-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center bg-background px-6 py-16 lg:pl-16 lg:pr-[max(24px,calc((100vw-1440px)/2+64px))]">
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_50px_-20px_rgba(16,24,40,0.15)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Company
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Match Score
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Salary Est.
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {JOBS.map((job) => (
                <tr
                  key={job.company}
                  className="border-b border-border-light last:border-b-0"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-tertiary">
                        <Building2 className="h-3.5 w-3.5 text-text-secondary" />
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {job.company}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1 w-10 overflow-hidden rounded-full bg-border-light">
                        <span
                          className={`block h-full rounded-full ${SCORE_FILL[job.color]}`}
                          style={{ width: `${job.score}%` }}
                        />
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {job.score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">
                    {job.salary}
                  </td>
                  <td className="px-5 py-3.5">
                    {job.source === "LinkedIn" ? (
                      <span className="rounded-full bg-linkedin-light px-2 py-0.5 text-xs font-medium text-linkedin">
                        LinkedIn
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                        URL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
