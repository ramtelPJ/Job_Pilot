import { Lock, LayoutGrid, Search, User } from "lucide-react";

import { Logo } from "@/components/layout/Logo";

const STATS = [
  { label: "Total Jobs Found", value: "284", trend: "+12%", note: "vs last week" },
  { label: "Avg. Match Rate", value: "82%", trend: "+3%", note: "vs last week" },
  { label: "Companies Researched", value: "35", note: "Total researched" },
  { label: "Jobs This Week", value: "28", note: "New this week" },
];

const ACTIVITY = [
  { label: "Found 8 jobs for Frontend Engineer", time: "10 mins ago", dot: "accent" },
  { label: "Researched Stripe", time: "1 hour ago", dot: "info" },
  { label: "Found 6 jobs for React Developer", time: "2 hours ago", dot: "success" },
  { label: "Researched Vercel", time: "Yesterday", dot: "accent" },
];

const DOT_STYLES: Record<string, string> = {
  accent: "bg-accent-light",
  info: "bg-info-light",
  success: "bg-success-light",
};

const DOT_INNER_STYLES: Record<string, string> = {
  accent: "bg-accent",
  info: "bg-info",
  success: "bg-success-alt",
};

const CHART_BARS = [3, 5, 2, 7, 12, 3, 1];

export function DashboardPreview() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-8 pt-10">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-secondary shadow-[0_20px_50px_-20px_rgba(16,24,40,0.25)]">
        <div className="flex items-center gap-4 border-b border-border px-6 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border-muted" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-muted" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-muted" />
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 rounded-md bg-surface-tertiary px-4 py-1.5 text-xs text-text-muted">
            <Lock className="h-3 w-3" />
            jobpilot.ai/dashboard
          </div>
        </div>

        <div className="bg-surface px-6 py-4">
          <div className="flex items-center justify-between border-b border-border-light pb-4">
            <Logo />
            <nav className="flex items-center gap-6 text-sm font-medium">
              <span className="flex items-center gap-1.5 border-b-2 border-accent pb-4 -mb-4 text-accent">
                <LayoutGrid className="h-3.5 w-3.5" />
                Dashboard
              </span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <Search className="h-3.5 w-3.5" />
                Find Jobs
              </span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <User className="h-3.5 w-3.5" />
                Profile
              </span>
            </nav>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <p className="text-xs text-text-secondary">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {stat.value}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  {stat.trend && (
                    <span className="rounded-sm bg-success-lightest px-1.5 py-0.5 text-xs font-medium text-success-darker">
                      {stat.trend}
                    </span>
                  )}
                  <span className="text-xs text-text-muted">{stat.note}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="border-b border-border-light pb-3 text-sm font-semibold text-text-primary">
                Recent Activity
              </p>
              <ul className="mt-3 flex flex-col gap-3">
                {ACTIVITY.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${DOT_STYLES[item.dot]}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${DOT_INNER_STYLES[item.dot]}`}
                      />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {item.label}
                      </p>
                      <p className="text-xs text-text-muted">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold text-text-primary">
                Company Research Activity
              </p>
              <div className="mt-4 flex h-32 items-end gap-3 border-t border-dashed border-border pt-3">
                {CHART_BARS.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-info"
                    style={{ height: `${(value / 12) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
