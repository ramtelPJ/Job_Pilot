import { Play } from "lucide-react";

import { TrackedLink } from "@/components/analytics/TrackedLink";

export function CTASection() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 pb-16">
      <div
        className="rounded-2xl border border-border px-6 py-20 text-center"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 28% 35%, color-mix(in srgb, var(--color-accent-light) 75%, white) 0%, transparent 60%), " +
            "radial-gradient(ellipse 55% 65% at 78% 65%, color-mix(in srgb, var(--color-info-light) 80%, white) 0%, transparent 60%), " +
            "var(--color-surface)",
        }}
      >
        <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          Your next job search can feel a lot less overwhelming
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-base text-text-secondary">
          Set up your profile, upload your resume, and start finding matches
          in minutes.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <TrackedLink
            href="/login"
            cta="get_started"
            location="cta_section"
            className="flex items-center gap-2 rounded-md bg-text-slate px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Get Started
            <Play className="h-3.5 w-3.5" fill="currentColor" />
          </TrackedLink>
          <TrackedLink
            href="/login"
            cta="find_first_match"
            location="cta_section"
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
          >
            Find Your First Match
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
