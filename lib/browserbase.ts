import { browserbase, type StagehandBrowser } from "@browserbasehq/stagehand";

export async function launchBrowserbaseSession(): Promise<StagehandBrowser> {
  return browserbase.launch({
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    api_timeout: 180,
  });
}
