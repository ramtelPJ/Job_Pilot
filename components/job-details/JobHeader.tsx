import { Building2, ExternalLink } from "lucide-react";

import { MATCH_THRESHOLD } from "@/lib/utils";
import type { Job } from "@/types";

type Props = {
  job: Job;
  applyUrl: string | null;
};

export function JobHeader({ job, applyUrl }: Props) {
  const score = job.matchScore ?? 0;
  const isHighMatch = score >= MATCH_THRESHOLD;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-tertiary">
          <Building2 className="h-6 w-6 text-text-secondary" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{job.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span>{job.company}</span>
            <span>•</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isHighMatch
                  ? "bg-success-lightest text-success-foreground"
                  : "bg-surface-secondary text-text-secondary"
              }`}
            >
              {score}% Match Score
            </span>
          </div>
        </div>
      </div>

      {applyUrl && (
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
        >
          <ExternalLink className="h-4 w-4" />
          View Job Post
        </a>
      )}
    </div>
  );
}
