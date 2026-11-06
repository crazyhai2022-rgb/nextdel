// Runs once when the Next.js server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { runStartupChecks } = await import("./instrumentation-node");
    await runStartupChecks();
  }
}
