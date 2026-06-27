import { loggerCronJobs } from "@sincpro/mobile/infrastructure/logger";
import { CronWorker } from "@sincpro/mobile/infrastructure/workers";
import { electronicInvoiceFeature } from "@sincpro/mobile-distribution/services/electronic_invoice.feature";

async function syncConsecutives(): Promise<void> {
  loggerCronJobs.info("Syncing invoice & ticket consecutives with backend");

  try {
    const [invoiceSync, ticketSync] = await Promise.all([
      electronicInvoiceFeature.syncInvoiceConsecutive(),
      electronicInvoiceFeature.syncTicketConsecutive(),
    ]);
    loggerCronJobs.info(`Sync result (invoice: ${invoiceSync}, ticket: ${ticketSync})`);
  } catch (error: any) {
    loggerCronJobs.warn(`Consecutive sync error: ${error?.message || error}`);
  }
  loggerCronJobs.info("Finished syncing invoice & ticket consecutives");
}

const cronSyncConsecutives = new CronWorker("SYNC_CONSECUTIVES", syncConsecutives, 2, {
  requiresAuth: true,
});

export default cronSyncConsecutives;
