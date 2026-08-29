"use client";

import Link from "next/link";
import posthog from "posthog-js";

type Props = {
  href: string;
  cta: string;
  location: string;
  className?: string;
  children: React.ReactNode;
};

export function TrackedLink({ href, cta, location, className, children }: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => posthog.capture("cta_clicked", { cta, location })}
    >
      {children}
    </Link>
  );
}
