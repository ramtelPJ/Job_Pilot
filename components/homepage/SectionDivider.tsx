export function SectionDivider() {
  return (
    <div
      className="h-8 w-full border-y border-border-light bg-surface"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, var(--color-border-light) 0px, var(--color-border-light) 1px, transparent 1px, transparent 10px)",
      }}
    />
  );
}
