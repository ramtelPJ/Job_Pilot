type LogLine = {
  tag?: string;
  tagColor?: string;
  text: string;
  prefix?: string;
  prefixColor?: string;
};

const LOG_LINES: LogLine[] = [
  { tag: "[SYSTEM]", tagColor: "text-info-medium", text: "Initializing JobPilot Agent..." },
  { tag: "[SCAN]", tagColor: "text-accent", text: "Found 14 matching roles" },
  { prefix: "↳", text: "Filtered out 3 roles (below salary cap)" },
  { tag: "[ACTION]", tagColor: "text-success", text: "Tailoring resume for Stripe (Frontend)" },
  { prefix: "...", prefixColor: "text-warning", text: "Generating cover letter" },
];

const FEATURES = [
  {
    title: "Understand your match score",
    description:
      "See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what's missing.",
    highlighted: false,
  },
  {
    title: "AI-Powered Job Matching",
    description:
      "Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter.",
    highlighted: true,
  },
  {
    title: "Focus on the right roles",
    description:
      "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying.",
    highlighted: false,
  },
];

export function ConfidenceSection() {
  return (
    <section className="grid grid-cols-1 border-t border-border-light lg:grid-cols-2">
      <div className="order-2 flex items-center bg-background px-6 py-16 lg:order-1 lg:pl-[max(24px,calc((100vw-1440px)/2+64px))] lg:pr-16">
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_50px_-20px_rgba(16,24,40,0.15)]">
          <div className="flex items-center gap-2 bg-overlay px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="ml-2 text-xs text-text-muted">agent_log.ts</span>
          </div>
          <div className="flex flex-col gap-4 px-5 py-5 font-mono text-sm">
            {LOG_LINES.map((line, index) => (
              <div key={index} className="flex gap-4">
                <span className="text-text-muted">{index + 1}</span>
                <p className="text-text-primary">
                  {line.prefix && (
                    <span className={`mr-2 ${line.prefixColor ?? "text-text-muted"}`}>
                      {line.prefix}
                    </span>
                  )}
                  {line.tag && (
                    <span className={`mr-2 font-semibold ${line.tagColor}`}>
                      {line.tag}
                    </span>
                  )}
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="order-1 flex flex-col justify-center px-6 py-16 lg:order-2 lg:pl-16 lg:pr-[max(24px,calc((100vw-1440px)/2+64px))]">
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Apply With More Confidence, Every Time
        </h2>

        <div className="mt-8 flex flex-col">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`border-t border-border-light py-6 pl-5 first:border-t-0 first:pt-0 ${
                feature.highlighted
                  ? "border-l-2 border-l-success-dark"
                  : "border-l-2 border-l-border-light"
              }`}
            >
              <p className="text-base font-semibold text-text-primary">
                {feature.title}
              </p>
              <p className="mt-1.5 text-sm text-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
