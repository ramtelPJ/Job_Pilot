import Link from "next/link";
import { Building2 } from "lucide-react";

export type ScoreColor = "success" | "warning" | "muted";

export type JobRow = {
  id: string;
  company: string;
  role: string;
  score: number;
  salary: string;
  dateFound: string;
};

const SCORE_FILL: Record<ScoreColor, string> = {
  success: "bg-success",
  warning: "bg-warning",
  muted: "bg-text-muted",
};

function scoreColor(score: number): ScoreColor {
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "muted";
}

type Props = {
  jobs: JobRow[];
};

export function JobsTable({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-sm text-text-secondary">
        No jobs yet — search above to get started.
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border-light">
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Company
          </th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Role
          </th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Match Score
          </th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Salary Est.
          </th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Date Found
          </th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id} className="border-b border-border-light last:border-b-0">
            <td className="px-6 py-4">
              <Link
                href={`/find-jobs/${job.id}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-tertiary">
                  <Building2 className="h-4 w-4 text-text-secondary" />
                </span>
                <span className="text-sm font-semibold text-text-primary">{job.company}</span>
              </Link>
            </td>
            <td className="px-6 py-4">
              <Link href={`/find-jobs/${job.id}`} className="block hover:opacity-80">
                <span className="text-sm text-text-primary">{job.role}</span>
              </Link>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="h-1 w-24 overflow-hidden rounded-full bg-border-light">
                  <span
                    className={`block h-full rounded-full ${SCORE_FILL[scoreColor(job.score)]}`}
                    style={{ width: `${job.score}%` }}
                  />
                </span>
                <span className="text-sm font-medium text-text-primary">{job.score}%</span>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-text-secondary">{job.salary}</td>
            <td className="px-6 py-4 text-sm text-text-secondary">{job.dateFound}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
