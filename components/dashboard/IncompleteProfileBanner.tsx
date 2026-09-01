import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function IncompleteProfileBanner() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-warning/30 bg-warning/10 px-6 py-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-semibold text-text-primary">Your profile is incomplete</p>
          <p className="text-sm text-text-secondary">
            Complete your profile to get better job matches and AI-generated resumes.
          </p>
        </div>
      </div>

      <Link
        href="/profile"
        className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Complete Profile
      </Link>
    </div>
  );
}
