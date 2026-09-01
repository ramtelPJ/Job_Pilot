import Anthropic from "@anthropic-ai/sdk";

let claudeClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  }
  return claudeClient;
}
