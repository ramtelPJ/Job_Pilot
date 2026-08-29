import { Play } from "lucide-react";

import { TrackedLink } from "@/components/analytics/TrackedLink";

export function Hero() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 pt-8">
      <div
        className="relative overflow-hidden rounded-2xl border border-border px-6 py-24 text-center"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 28% 35%, color-mix(in srgb, var(--color-accent-light) 75%, white) 0%, transparent 60%), " +
            "radial-gradient(ellipse 55% 65% at 78% 65%, color-mix(in srgb, var(--color-info-light) 80%, white) 0%, transparent 60%), " +
            "var(--color-surface)",
        }}
      >
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-5xl">
          Job hunting is hard.
          <br />
          Your tools shouldn&apos;t be.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-text-secondary sm:text-lg">
          Stop applying blind. JobPilot finds the jobs, researches the
          companies, and gives you everything you need to stand out.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <TrackedLink
            href="/login"
            cta="get_started"
            location="hero"
            className="flex items-center gap-2 rounded-md bg-text-slate px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Get Started
            <Play className="h-3.5 w-3.5" fill="currentColor" />
          </TrackedLink>
          <TrackedLink
            href="/login"
            cta="find_first_match"
            location="hero"
            className="rounded-md bg-accent-light px-4 py-2 text-sm font-medium text-text-primary transition-opacity hover:opacity-80"
          >
            Find Your First Match
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
