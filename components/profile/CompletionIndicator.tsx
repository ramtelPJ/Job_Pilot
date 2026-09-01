import { AlertCircle } from "lucide-react";

type Props = {
  percentage: number;
  missingFields: string[];
};

export function CompletionIndicator({ percentage, missingFields }: Props) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage / 100);

  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-error" />
          <h2 className="text-base font-semibold text-text-primary">
            Profile needs attention
          </h2>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Complete the missing fields to improve your chance of getting
          tailored matches and generating quality resumes.
        </p>

        {missingFields.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <span
                key={field}
                className="rounded-md bg-error-light px-2 py-1 text-xs font-semibold uppercase tracking-wide text-error"
              >
                {field}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative h-[120px] w-[120px] shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-error-light)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-error)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-text-primary">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
