type Props = {
  message: string;
};

export function EmptyChartState({ message }: Props) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border-light bg-surface-secondary px-6 text-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
