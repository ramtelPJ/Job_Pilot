import { Stagehand, type StagehandBrowser } from "@browserbasehq/stagehand";

export async function createStagehand(browser: StagehandBrowser): Promise<Stagehand> {
  return Stagehand.create({
    browser,
    // Stagehand's own model catalog (its page act/extract/observe reasoning,
    // separate from this project's own Claude calls in lib/claude.ts) does not
    // yet list "claude-opus-5" as a valid modelName — "claude-sonnet-5" is the
    // newest Anthropic model it does support.
    model: {
      modelName: "anthropic/claude-sonnet-5",
      apiKey: process.env.CLAUDE_API_KEY,
    },
  });
}
