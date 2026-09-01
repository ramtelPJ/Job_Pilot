export type ActivityDot = "info" | "success";

export type ActivityEntry = {
  label: string;
  time: string;
  dot: ActivityDot;
};

type Props = {
  activity: ActivityEntry[];
};

const DOT_OUTER: Record<ActivityDot, string> = {
  info: "bg-info-light",
  success: "bg-success-light",
};

const DOT_INNER: Record<ActivityDot, string> = {
  info: "bg-info",
  success: "bg-success-alt",
};

export function RecentActivity({ activity }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>

      {activity.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          No activity yet — search for jobs or research a company to see it here.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {activity.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-surface ${DOT_OUTER[item.dot]}`}
              >
                <span className={`h-2 w-2 rounded-full ${DOT_INNER[item.dot]}`} />
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-muted">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
