import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { getClaudeClient } from "@/lib/claude";
import { logAgentError } from "@/agent/log";
import type { AdzunaJob } from "@/lib/adzuna";
import type { Profile } from "@/types";

const JobScoreSchema = z.object({
  matchScore: z.number(),
  matchReason: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

export type JobScore = z.infer<typeof JobScoreSchema>;

const SYSTEM_PROMPT =
  "You are an expert technical recruiter. Score how well this candidate matches " +
  "this job posting, from 0 to 100. matchedSkills must only include skills " +
  "literally present in the candidate's skill list that this job also requires. " +
  "missingSkills are skills the job requires that are absent from the candidate's " +
  "list. matchReason is one concise paragraph grounded only in the job description " +
  "and profile given - never invent requirements not stated in the posting.";

export async function scoreJob(
  job: AdzunaJob,
  profile: Profile,
  runId: string,
): Promise<{ success: boolean; score?: JobScore; error?: string }> {
  try {
    const claude = getClaudeClient();
    const response = await claude.messages.parse({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: {
        format: zodOutputFormat(JobScoreSchema),
        effort: "low",
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            job: {
              title: job.title,
              company: job.company.display_name,
              description: job.description,
            },
            candidate: {
              currentTitle: profile.currentTitle,
              experienceLevel: profile.experienceLevel,
              yearsExperience: profile.yearsExperience,
              skills: profile.skills,
              workExperience: profile.workExperience,
            },
          }),
        },
      ],
    });

    if (!response.parsed_output) {
      return { success: false, error: "Could not score this job." };
    }

    return { success: true, score: response.parsed_output };
  } catch (error) {
    await logAgentError(runId, null, error);
    return { success: false, error: String(error) };
  }
}
