"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

const MATCH_FILTER_OPTIONS = [
  { value: "all", label: "All Matches" },
  { value: "high", label: "High Match" },
  { value: "low", label: "Low Match" },
];

const SORT_OPTIONS = [
  { value: "match_score", label: "Match Score" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

type Props = {
  defaultSearch: string;
  defaultMatch: string;
  defaultSort: string;
};

export function JobFilters({ defaultSearch, defaultMatch, defaultSort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(defaultSearch);
  const isFirstRender = useRef(true);

  function navigate(overrides: { q?: string; match?: string; sort?: string }) {
    const q = overrides.q ?? search;
    const match = overrides.match ?? defaultMatch;
    const sort = overrides.sort ?? defaultSort;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (match !== "all") params.set("match", match);
    if (sort !== "match_score") params.set("sort", sort);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => {
    // Skip on mount, and skip when `search` was just synced from the URL
    // (see the effect below) rather than typed by the user.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (search === defaultSearch) {
      return;
    }
    const timeout = setTimeout(() => navigate({ q: search }), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    // Keeps the input in sync with the URL on back/forward navigation.
    setSearch(defaultSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSearch]);

  return (
    <div className="flex flex-col gap-3 border-b border-border-light p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by company or role..."
          className="w-full rounded-md py-2 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={defaultMatch}
          onChange={(e) => navigate({ match: e.target.value })}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {MATCH_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={defaultSort}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
