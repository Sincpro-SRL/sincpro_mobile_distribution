import { DomainEvent } from "@sincpro/mobile/domain";
import { Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { authService } from "@sincpro/mobile-distribution/services/auth.service";
import { distributionSettingFeature } from "@sincpro/mobile-distribution/services/settings.feature";
import { OdooLoggedInEvent } from "@sincpro/mobile-odoo/domain/auth/events";

export class LoggedSuccessfullySubscriber extends Subscriber {
  public readonly requiresAuth = false;
  listen = [OdooLoggedInEvent];

  getEvent(event: DomainEvent): OdooLoggedInEvent {
    return OdooLoggedInEvent.from(event);
  }

  async process(event: OdooLoggedInEvent): Promise<void> {
    loggerUseCases.info("Reacting to Odoo login event", { uid: event.uid });

    await authService.loadDistributorData({
      uid: event.uid,
      user: event.user,
      password: event.password,
      db: event.db,
      name: event.userName,
      email: event.email,
      companyId: event.companyId,
      companyIds: event.companyIds,
    });

    await distributionSettingFeature.fetchRemoteSettings();

    loggerUseCases.info("Distribution data loaded successfully");
  }
}
