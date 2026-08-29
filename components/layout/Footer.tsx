import Link from "next/link";

import { Logo } from "@/components/layout/Logo";

const FOOTER_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Condition", href: "#" },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-border-light bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
        <Logo />

        <nav className="flex items-center gap-6">
          {FOOTER_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
