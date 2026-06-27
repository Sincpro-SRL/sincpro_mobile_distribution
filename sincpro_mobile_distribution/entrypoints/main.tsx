import { createAppShell, createTheme } from "@sincpro/mobile";
import type { IMigration } from "@sincpro/mobile/domain/database";
import type { Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { DomainModule } from "@sincpro/mobile/framework/domain_module";
import type { CronWorker } from "@sincpro/mobile/infrastructure/workers";
import { ProcessToastProvider } from "@sincpro/mobile/ui/components/molecules";
import DistributionCronJobs from "@sincpro/mobile-distribution/entrypoints/cron";
import DistributionMigrations from "@sincpro/mobile-distribution/entrypoints/db/migrations";
import DistributionRepositoryRegistry from "@sincpro/mobile-distribution/entrypoints/db/repositories";
import { DistributionSubscribers } from "@sincpro/mobile-distribution/entrypoints/queue";
import { DistributionApp } from "@sincpro/mobile-distribution/entrypoints/ui/App";
import {
  DISTRIBUTION_DARK_THEME,
  DISTRIBUTION_THEME,
} from "@sincpro/mobile-distribution/entrypoints/ui/theme/tokens";
import { odooModule } from "@sincpro/mobile-odoo";
import { ConfirmationProvider } from "@sincpro/mobile-ui/Dialog";
import type { ComponentType } from "react";

export class DistributionModule extends DomainModule {
  readonly key = "DISTRIBUTION";
  readonly name = "Distribution";

  override repositories(): Record<string, object> {
    return DistributionRepositoryRegistry;
  }

  override migrations(): IMigration[] {
    return DistributionMigrations;
  }

  override subscribers(): Subscriber[] {
    return DistributionSubscribers;
  }

  override crons(): CronWorker[] {
    return DistributionCronJobs;
  }
}

export const distributionModule = new DistributionModule();

export function createDistributionApp(): ComponentType {
  return createAppShell({
    theme: createTheme(DISTRIBUTION_THEME),
    darkTheme: createTheme(DISTRIBUTION_DARK_THEME),
    domains: [odooModule, distributionModule],
    ui: { [distributionModule.key]: DistributionApp },
    activeDomain: distributionModule.key,
    providers: [ConfirmationProvider, ProcessToastProvider],
    branding: { logo: require("../../assets/DISTRIBUTION/logo.png") },
  });
}
