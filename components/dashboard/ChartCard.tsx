type Props = {
  title: string;
  children: React.ReactNode;
};

export function ChartCard({ title, children }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
