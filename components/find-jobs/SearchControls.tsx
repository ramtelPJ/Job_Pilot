"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Info } from "lucide-react";

type SearchResult = { jobsFound: number; strongMatches: number };

export function SearchControls() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFindJobs = async () => {
    if (!jobTitle.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, location }),
      });
      const data: { success: boolean; data?: SearchResult; error?: string } =
        await response.json();

      if (!data.success || !data.data) {
        setError(data.error ?? "Could not search for jobs.");
        return;
      }

      setResult(data.data);
      router.refresh();
    } catch {
      setError("Could not search for jobs. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
            Job Title
          </label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Frontend Engineer"
              className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote, New York..."
            className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <button
          type="button"
          onClick={handleFindJobs}
          disabled={isSearching}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {isSearching ? "Searching..." : "Find Jobs"}
        </button>
      </div>

      {result && result.jobsFound > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-success-lightest px-4 py-3">
          <Sparkles className="h-4 w-4 text-success-foreground" />
          <p className="text-sm font-medium text-success-foreground">
            Found {result.jobsFound} jobs and saved {result.strongMatches} strong matches.
          </p>
        </div>
      )}

      {result && result.jobsFound === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-surface-secondary px-4 py-3">
          <Info className="h-4 w-4 text-text-secondary" />
          <p className="text-sm font-medium text-text-secondary">
            No jobs found for this search. Try a different title or location.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-error/10 px-4 py-3">
          <p className="text-sm font-medium text-error">{error}</p>
        </div>
      )}
    </div>
  );
}
