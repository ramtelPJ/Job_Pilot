import { Briefcase, Target, Building2, Calendar, type LucideIcon } from "lucide-react";

type Props = {
  totalJobs: number;
  avgMatchRate: number | null;
  companiesResearched: number;
  jobsThisWeek: number;
};

type Stat = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  note: string;
};

export function StatsBar({ totalJobs, avgMatchRate, companiesResearched, jobsThisWeek }: Props) {
  const stats: Stat[] = [
    {
      icon: Briefcase,
      iconBg: "bg-accent-light",
      iconColor: "text-accent",
      label: "Total Jobs Found",
      value: String(totalJobs),
      note: "All time",
    },
    {
      icon: Target,
      iconBg: "bg-success-lightest",
      iconColor: "text-success",
      label: "Avg. Match Rate",
      value: avgMatchRate !== null ? `${avgMatchRate}%` : "—",
      note: "Across all jobs",
    },
    {
      icon: Building2,
      iconBg: "bg-info-lightest",
      iconColor: "text-info",
      label: "Companies Researched",
      value: String(companiesResearched),
      note: "Total researched",
    },
    {
      icon: Calendar,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      label: "Jobs This Week",
      value: String(jobsThisWeek),
      note: "New this week",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-text-primary">{stat.value}</p>
            <p className="mt-2 text-xs text-text-muted">{stat.note}</p>
          </div>
        );
      })}
    </div>
  );
}
