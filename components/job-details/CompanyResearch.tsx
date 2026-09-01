"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Loader2,
  ExternalLink,
  Code2,
  Users,
  Target,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Link2,
  type LucideIcon,
} from "lucide-react";

import type { CompanyResearch as CompanyResearchDossier } from "@/types";

type Props = {
  jobId: string;
  company: string;
  companyResearch: CompanyResearchDossier | null;
};

function BulletList({ items, dotClassName }: { items: string[]; dotClassName: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

type DossierSectionProps = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  children: React.ReactNode;
};

function DossierSection({ icon: Icon, iconBg, iconColor, label, children }: DossierSectionProps) {
  return (
    <div className="rounded-xl border border-border-light bg-surface-secondary p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </span>
        <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function CompanyResearch({ jobId, company, companyResearch }: Props) {
  const router = useRouter();
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = async () => {
    setIsResearching(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data: { success: boolean; error?: string } = await response.json();

      if (!data.success) {
        setError(data.error ?? "Company research failed. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("Company research failed. Please try again.");
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-light">
            <Building2 className="h-4 w-4 text-accent" />
          </span>
          <h2 className="text-base font-semibold text-text-primary">Company Research</h2>
        </div>

        <button
          type="button"
          onClick={handleResearch}
          disabled={isResearching}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isResearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {isResearching
            ? "Researching..."
            : companyResearch
              ? "Re-research Company"
              : "Research Company"}
        </button>
      </div>

      {isResearching ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border-light bg-surface-secondary px-6 py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-sm font-semibold text-text-primary">Researching {company}...</p>
          <p className="max-w-sm text-sm text-text-muted">
            Visiting their public pages and building a dossier. This can take up to a minute.
          </p>
        </div>
      ) : companyResearch ? (
        <div className="mt-6 flex flex-col gap-4">
          <DossierSection
            icon={Building2}
            iconBg="bg-surface-tertiary"
            iconColor="text-text-secondary"
            label="Company Overview"
          >
            <p className="text-sm leading-relaxed text-text-primary">
              {companyResearch.companyOverview}
            </p>
          </DossierSection>

          <DossierSection icon={Code2} iconBg="bg-info-lightest" iconColor="text-info" label="Tech Stack">
            <TagList items={companyResearch.techStack} />
          </DossierSection>

          <DossierSection icon={Users} iconBg="bg-accent-light" iconColor="text-accent" label="Culture">
            <BulletList items={companyResearch.culture} dotClassName="bg-accent" />
          </DossierSection>

          <DossierSection
            icon={Target}
            iconBg="bg-success-lightest"
            iconColor="text-success"
            label="Why This Role"
          >
            <p className="text-sm leading-relaxed text-text-primary">
              {companyResearch.whyThisRole}
            </p>
          </DossierSection>

          <DossierSection icon={Sparkles} iconBg="bg-accent-light" iconColor="text-accent" label="Your Edge">
            <BulletList items={companyResearch.yourEdge} dotClassName="bg-accent" />
          </DossierSection>

          <DossierSection
            icon={AlertTriangle}
            iconBg="bg-warning/10"
            iconColor="text-warning"
            label="Gaps to Address"
          >
            <BulletList items={companyResearch.gapsToAddress} dotClassName="bg-warning" />
          </DossierSection>

          <DossierSection
            icon={HelpCircle}
            iconBg="bg-info-lightest"
            iconColor="text-info"
            label="Smart Questions"
          >
            <BulletList items={companyResearch.smartQuestions} dotClassName="bg-info" />
          </DossierSection>

          <DossierSection
            icon={BookOpen}
            iconBg="bg-success-lightest"
            iconColor="text-success"
            label="Interview Prep"
          >
            <BulletList items={companyResearch.interviewPrep} dotClassName="bg-success" />
          </DossierSection>

          {companyResearch.sources.length > 0 && (
            <DossierSection
              icon={Link2}
              iconBg="bg-surface-tertiary"
              iconColor="text-text-secondary"
              label="Sources"
            >
              <ul className="flex flex-col gap-1">
                {companyResearch.sources.map((source) => (
                  <li key={source}>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </DossierSection>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border-light bg-surface-secondary px-6 py-12 text-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-tertiary">
            <Building2 className="h-5 w-5 text-text-muted" />
          </span>
          <p className="text-sm font-semibold text-text-primary">No research yet</p>
          <p className="max-w-sm text-sm text-text-muted">
            Click &quot;Research Company&quot; to let the AI browse {company}&apos;s public pages
            and build a dossier.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-error/10 px-4 py-3">
          <p className="text-sm font-medium text-error">{error}</p>
        </div>
      )}
    </div>
  );
}
