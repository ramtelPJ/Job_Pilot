"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, User } from "lucide-react";

import { Logo } from "@/components/layout/Logo";
import { TrackedLink } from "@/components/analytics/TrackedLink";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Find Jobs", href: "/find-jobs", icon: Search },
  { label: "Profile", href: "/profile", icon: User },
];

type Props = {
  authenticated?: boolean;
};

export function Navbar({ authenticated = false }: Props) {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-border-light bg-surface">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = authenticated && pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-16 items-center gap-1.5 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-text-dark hover:text-accent"
                }`}
              >
                {authenticated && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!authenticated && (
          <TrackedLink
            href="/login"
            cta="start_for_free"
            location="navbar"
            className="rounded-md bg-text-slate px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Start for free
          </TrackedLink>
        )}
      </div>
    </header>
  );
}
