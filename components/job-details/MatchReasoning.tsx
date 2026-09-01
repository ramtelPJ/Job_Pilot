import { Sparkles } from "lucide-react";

type Props = {
  reason: string | null;
};

export function MatchReasoning({ reason }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-lightest">
          <Sparkles className="h-4 w-4 text-success" />
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          AI Match Reasoning
        </h2>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-text-primary">
        {reason ?? "No match reasoning available for this job."}
      </p>
    </div>
  );
}
