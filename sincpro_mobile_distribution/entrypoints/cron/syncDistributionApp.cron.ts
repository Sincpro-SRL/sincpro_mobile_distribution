import { loggerCronJobs } from "@sincpro/mobile/infrastructure/logger";
import { CronWorker } from "@sincpro/mobile/infrastructure/workers";
import { distributionWorkflows } from "@sincpro/mobile-distribution/services/workflows";

async function syncDistributionApp(): Promise<void> {
  loggerCronJobs.info("Starting distribution app synchronization cron");

  try {
    await distributionWorkflows.syncDistributionApp();
  } catch (error: any) {
    loggerCronJobs.error(`Distribution app sync failed: ${error?.message || error}`);
  }
  loggerCronJobs.info("Finished distribution app synchronization cron");
}

const cronSyncDistributionApp = new CronWorker(
  "SYNC_DISTRIBUTION_APP",
  syncDistributionApp,
  15,
  {
    requiresAuth: true,
  },
);

export default cronSyncDistributionApp;
