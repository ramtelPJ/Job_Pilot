import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { getClaudeClient } from "@/lib/claude";
import { launchBrowserbaseSession } from "@/lib/browserbase";
import { createStagehand } from "@/lib/stagehand";
import { logAgentError } from "@/agent/log";
import type { CompanyResearch, Job, Profile } from "@/types";

const HomepageSchema = z.object({
  oneLiner: z.string().describe("What the company does in one sentence"),
  productSummary: z.string().describe("What they build/sell and who it's for"),
  signals: z.array(z.string()).describe("Funding, notable customers, scale, mission, recent news"),
  pageLinks: z
    .array(
      z.object({
        url: z
          .string()
          .describe(
            "The link's actual href/URL attribute, e.g. '/about' or 'https://example.com/blog' — never the visible link text like 'About' or 'Blog'",
          ),
        kind: z.enum(["about", "careers", "blog", "engineering", "product", "team", "other"]),
      }),
    )
    .describe("Internal links worth visiting"),
});

const SubPageSchema = z.object({
  keyPoints: z.array(z.string()),
  technologies: z.array(z.string()).describe("Specific languages, frameworks, tools, platforms"),
  valuesOrCulture: z.array(z.string()).describe("Stated values, working style, team norms"),
  notable: z.array(z.string()).describe("Customers, funding, scale, projects, awards"),
});

const DossierSchema = z.object({
  companyOverview: z.string(),
  techStack: z.array(z.string()),
  culture: z.array(z.string()),
  whyThisRole: z.string(),
  yourEdge: z.array(z.string()),
  gapsToAddress: z.array(z.string()),
  smartQuestions: z.array(z.string()),
  interviewPrep: z.array(z.string()),
});

const SUB_PAGE_PRIORITY: Record<string, number> = {
  about: 0,
  engineering: 1,
  blog: 2,
  product: 3,
  team: 4,
  other: 5,
  careers: 6,
};

function deriveHomepageFallback(company: string): string {
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `https://www.${slug}.com`;
}

async function deriveHomepageUrl(job: Job): Promise<string> {
  const listingUrl = job.sourceUrl ?? job.externalApplyUrl;
  if (listingUrl) {
    try {
      const response = await fetch(listingUrl, { redirect: "follow" });
      const hostname = new URL(response.url).hostname;
      if (!hostname.includes("adzuna.com")) {
        const rootDomain = hostname.split(".").slice(-2).join(".");
        return `https://${rootDomain}`;
      }
    } catch {
      // fall through to the guessed domain below
    }
  }
  return deriveHomepageFallback(job.company);
}

type SubPageResearch = {
  url: string;
  keyPoints: string[];
  technologies: string[];
  valuesOrCulture: string[];
  notable: string[];
};

type SiteResearch = {
  oneLiner: string;
  productSummary: string;
  signals: string[];
  subPages: SubPageResearch[];
  sources: string[];
};

async function researchCompanySite(homepageUrl: string): Promise<SiteResearch | null> {
  const browser = await launchBrowserbaseSession();
  const stagehand = await createStagehand(browser);

  try {
    const [page] = await browser.context.pages();
    await page.goto(homepageUrl);

    const homepage = await stagehand.extract(
      "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer — return each link's real href/URL attribute, not its visible label text.",
      HomepageSchema,
    );

    if (!homepage.data.oneLiner && !homepage.data.productSummary) {
      return null;
    }

    const subPageLinks = [...homepage.data.pageLinks]
      .sort((a, b) => (SUB_PAGE_PRIORITY[a.kind] ?? 5) - (SUB_PAGE_PRIORITY[b.kind] ?? 5))
      .slice(0, 3)
      .map((link) => new URL(link.url, homepageUrl).toString());

    const subPages: SubPageResearch[] = [];
    for (const url of subPageLinks) {
      try {
        await page.goto(url);
        const subPage = await stagehand.extract(
          "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
          SubPageSchema,
        );
        subPages.push({ url, ...subPage.data });
      } catch {
        // one bad sub-page never sinks the whole research run — skip and continue
      }
    }

    return {
      oneLiner: homepage.data.oneLiner,
      productSummary: homepage.data.productSummary,
      signals: homepage.data.signals,
      subPages,
      sources: [homepageUrl, ...subPages.map((p) => p.url)],
    };
  } finally {
    await stagehand.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

const SYSTEM_PROMPT =
  "You are a sharp career strategist preparing a candidate to apply for a specific role. " +
  "You are given (a) research collected from the company's own website, (b) the job posting, " +
  "and (c) the candidate's profile. Produce a concise, concrete briefing that gives this " +
  "specific candidate an edge for this specific role.\n\n" +
  "Rules:\n" +
  "- Ground every company claim in the provided research or job posting. Never invent " +
  "funding, customers, headcount, or facts. If research was thin, infer carefully from " +
  "the job posting and say what's inferred.\n" +
  "- Be specific to THIS candidate. Connect their actual skills and past work to this " +
  "company's stack, product, and values. No generic advice that would apply to anyone.\n" +
  "- Turn the candidate's missing skills into a strategy: how to frame the gap honestly " +
  "and what adjacent experience to lean on.\n" +
  "- Talking points and questions must reference real things from the research, the kind " +
  "of detail that signals the candidate did their homework.\n" +
  "- Keep every item tight: one or two sentences. No fluff.";

export async function researchCompany(
  job: Job,
  profile: Profile,
): Promise<{ success: boolean; dossier?: CompanyResearch; error?: string }> {
  try {
    const homepageUrl = await deriveHomepageUrl(job);

    let site: SiteResearch | null = null;
    try {
      site = await researchCompanySite(homepageUrl);
    } catch (error) {
      await logAgentError(job.runId, job.id, error);
      site = null;
    }

    const claude = getClaudeClient();
    const response = await claude.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: {
        format: zodOutputFormat(DossierSchema),
        effort: "low",
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            companyResearch: site
              ? {
                  oneLiner: site.oneLiner,
                  productSummary: site.productSummary,
                  signals: site.signals,
                  subPages: site.subPages,
                }
              : "No usable research could be gathered from the company's website.",
            jobPosting: {
              title: job.title,
              company: job.company,
              description: job.aboutRole,
              matchedSkills: job.matchedSkills,
              missingSkills: job.missingSkills,
            },
            candidateProfile: {
              currentTitle: profile.currentTitle,
              yearsExperience: profile.yearsExperience,
              experienceLevel: profile.experienceLevel,
              skills: profile.skills,
              workExperience: profile.workExperience,
            },
          }),
        },
      ],
    });

    if (!response.parsed_output) {
      return { success: false, error: "Could not write a research briefing for this job." };
    }

    const dossier: CompanyResearch = {
      ...response.parsed_output,
      sources: site?.sources ?? [],
    };

    return { success: true, dossier };
  } catch (error) {
    await logAgentError(job.runId, job.id, error);
    return { success: false, error: String(error) };
  }
}
