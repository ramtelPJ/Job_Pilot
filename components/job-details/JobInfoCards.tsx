import { DollarSign, MapPin, Briefcase, Calendar, type LucideIcon } from "lucide-react";

import { formatRelativeTime } from "@/lib/utils";
import type { Job } from "@/types";

type InfoCard = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
};

type Props = {
  job: Job;
};

export function JobInfoCards({ job }: Props) {
  const cards: InfoCard[] = [
    {
      icon: DollarSign,
      iconBg: "bg-success-lightest",
      iconColor: "text-success",
      value: job.salary ?? "Not listed",
      label: "Salary Est.",
    },
    {
      icon: MapPin,
      iconBg: "bg-info-lightest",
      iconColor: "text-info",
      value: job.location ?? "Not listed",
      label: "Location",
    },
    {
      icon: Briefcase,
      iconBg: "bg-accent-light",
      iconColor: "text-accent",
      value: job.jobType ?? "—",
      label: "Job Type",
    },
    {
      icon: Calendar,
      iconBg: "bg-surface-tertiary",
      iconColor: "text-text-secondary",
      value: formatRelativeTime(job.foundAt),
      label: "Date Found",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
            >
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary" title={card.value}>
                {card.value}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {card.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
