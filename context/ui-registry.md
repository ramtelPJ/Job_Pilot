# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Logo

`components/layout/Logo.tsx`

Gradient square icon (`bg-[linear-gradient(45deg,var(--color-accent)_0%,var(--color-accent-deep)_100%)]`, `h-9 w-9 rounded-[10px]`) with a lucide `LayoutGrid` icon, plus optional "JobPilot" wordmark (`text-[19px] font-bold text-text-darkest`). Takes `showWordmark?: boolean`. Used in Navbar, Footer, and the DashboardPreview mock.

### Navbar

`components/layout/Navbar.tsx`

`h-16` full-width `bg-surface` header, `border-b border-border-light`, inner content `max-w-[1440px] mx-auto px-6`. Nav links `text-sm font-medium text-text-dark hover:text-accent`. Right-aligned CTA button `bg-text-slate text-accent-foreground rounded-md px-4 py-2 text-sm font-medium`.

### Footer

`components/layout/Footer.tsx`

`bg-surface border-t border-border-light`, `max-w-[1440px] mx-auto px-6 py-8`, Logo left, links right (`text-sm font-medium text-text-secondary hover:text-text-primary`).

### Hero

`components/homepage/Hero.tsx`

Rounded gradient hero card (`rounded-2xl border border-border`, dual `radial-gradient` mesh using `color-mix()` over `--color-accent-light` / `--color-info-light`). Headline `text-4xl sm:text-5xl font-extrabold text-text-primary`. Primary CTA `bg-text-slate` + lucide `Play` icon; secondary CTA `bg-accent-light text-text-primary`.

### DashboardPreview

`components/homepage/DashboardPreview.tsx`

Static illustrative "browser chrome" mock of the dashboard (no live data) — traffic-light dots, fake URL bar, mini navbar, 4 stat cards (`text-2xl font-semibold`, `bg-success-lightest text-success-darker` trend badge), Recent Activity list (dot colors via `DOT_STYLES`/`DOT_INNER_STYLES` maps — accent/info/success), and a hand-built bar chart (`bg-info` bars, height via inline `%`).

### JobSearchSection

`components/homepage/JobSearchSection.tsx`

Two-column full-bleed section (`grid lg:grid-cols-2`, `border-t border-border-light`). Left: heading + 3-item feature list, first item highlighted (`border-l-2 border-l-accent-dark`), others `border-l-2 border-l-border-light`. Right: `bg-background` column containing a static jobs-table card (`rounded-2xl border border-border bg-surface` with shadow) — match-score mini bar + badge colors are hardcoded per row to match the design mock exactly (not the real score-threshold logic used elsewhere in the app).

### ConfidenceSection

`components/homepage/ConfidenceSection.tsx`

Mirror of JobSearchSection (code block on `bg-background` left column via `order-*` classes, heading + features on `bg-surface` right). Terminal mock: `bg-overlay` header bar with error/warning/success dots, `font-mono text-sm` log lines with per-tag colors (`text-info-medium`, `text-accent`, `text-success`, `text-warning`). Second feature item highlighted with `border-l-2 border-l-success-dark` (not accent — sampled from design).

### Testimonial

`components/homepage/Testimonial.tsx`

Centered quote section, `text-2xl sm:text-3xl font-medium`, "Success Stories" eyebrow (`text-accent uppercase text-xs font-semibold`). Avatar is an initials placeholder (`bg-accent-light text-accent rounded-full`), not a photo — no asset was available.

### CTASection

`components/homepage/CTASection.tsx`

Same gradient-card treatment as Hero. Primary CTA identical to Hero's; secondary CTA here is the standard secondary button (`bg-surface border border-border`), which differs from Hero's `bg-accent-light` secondary — confirmed against the source design, not an inconsistency to fix.

### SectionDivider

`components/homepage/SectionDivider.tsx`

Decorative `h-8` diagonal-hash band (`repeating-linear-gradient(-45deg, var(--color-border-light) ...)`) used as a section-break texture at 3 spots on the homepage, matching the design.

### LoginPage

`app/(auth)/login/page.tsx`

Server Component (no `"use client"` — OAuth buttons are `<form>`s bound to the `signInWithOAuth` Server Action). Centered card: `max-w-sm rounded-2xl border border-border bg-surface p-8`, same shadow recipe as ui-tokens.md's Card spec. Logo centered above `text-xl font-semibold` heading + `text-sm text-text-secondary` subtext. Google button: secondary style (`border border-border bg-surface hover:bg-surface-secondary`) with an inline multicolor Google "G" SVG (no lucide equivalent exists for brand marks). GitHub button: `bg-text-slate text-accent-foreground` with an inline monochrome octocat SVG (`currentColor`) — same reasoning, lucide-react ships no brand icons. Error banner (`bg-error/10 text-error`) shown when `?error=oauth_failed|missing_code` is present.
