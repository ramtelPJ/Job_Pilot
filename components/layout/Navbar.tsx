import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { TrackedLink } from "@/components/analytics/TrackedLink";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Find Jobs", href: "/find-jobs" },
  { label: "Profile", href: "/profile" },
];

export function Navbar() {
  return (
    <header className="w-full border-b border-border-light bg-surface">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-text-dark transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <TrackedLink
          href="/login"
          cta="start_for_free"
          location="navbar"
          className="rounded-md bg-text-slate px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Start for free
        </TrackedLink>
      </div>
    </header>
  );
}
