import "dotenv/config";
import { processDueJobs } from "../lib/automation";

async function main() {
  console.log("[AUTOMATION_WORKER] Starting due-job check");
  const results = await processDueJobs();
  console.log(
    "[AUTOMATION_WORKER] Finished",
    JSON.stringify(
      {
        processed: results.length,
        results
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[AUTOMATION_WORKER] Error", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
