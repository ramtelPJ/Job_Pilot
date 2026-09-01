import { createInsforgeServer } from "@/lib/insforge-server";

export async function logAgentError(
  runId: string,
  jobId: string | null,
  error: unknown,
): Promise<void> {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData } = await insforge.auth.getCurrentUser();
    if (!authData.user) return;

    const { error: insertError } = await insforge.database.from("agent_logs").insert({
      run_id: runId,
      user_id: authData.user.id,
      job_id: jobId,
      level: "error",
      message: String(error),
    });

    if (insertError) {
      console.error("[agent/log]", insertError);
    }
  } catch (loggingError) {
    console.error("[agent/log]", loggingError);
  }
}
