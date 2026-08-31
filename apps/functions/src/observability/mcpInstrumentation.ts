import { logger } from "firebase-functions";

// Structured firebase-functions logs are automatically ingested into Cloud
// Logging (and from there, Cloud Monitoring metrics/dashboards) once deployed
// to a real Firebase project — no additional wiring needed on that side. Zero
// new dependency: firebase-functions already bundles this logger.
export async function instrumentMcpCall<T>(toolName: string, fn: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await fn();
    logger.info("mcp_call", { tool: toolName, durationMs: Date.now() - startedAt, outcome: "success" });
    return result;
  } catch (error) {
    logger.error("mcp_call", {
      tool: toolName,
      durationMs: Date.now() - startedAt,
      outcome: "error",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
