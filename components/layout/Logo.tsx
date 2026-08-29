import { LayoutGrid } from "lucide-react";

type Props = {
  showWordmark?: boolean;
};

export function Logo({ showWordmark = true }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[linear-gradient(45deg,var(--color-accent)_0%,var(--color-accent-deep)_100%)]">
        <LayoutGrid className="h-5 w-5 text-accent-foreground" strokeWidth={2.5} />
      </div>
      {showWordmark && (
        <span className="text-[19px] font-bold leading-7 text-text-darkest">
          JobPilot
        </span>
      )}
    </div>
  );
}
