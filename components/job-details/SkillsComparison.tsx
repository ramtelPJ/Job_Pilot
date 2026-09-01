import { Check, X } from "lucide-react";

type Props = {
  matchedSkills: string[];
  missingSkills: string[];
};

export function SkillsComparison({ matchedSkills, missingSkills }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Required Skills vs Your Profile
      </h2>

      <div className="mt-4">
        <p className="text-sm text-text-muted">You have</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {matchedSkills.length > 0 ? (
            matchedSkills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 rounded-full bg-success-lightest px-3 py-1 text-xs font-medium text-success-foreground"
              >
                <Check className="h-3 w-3" />
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-text-muted">No matched skills found.</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-text-muted">Gap skills</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {missingSkills.length > 0 ? (
            missingSkills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent"
              >
                <X className="h-3 w-3" />
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-text-muted">No gap skills — full match.</p>
          )}
        </div>
      </div>
    </div>
  );
}
