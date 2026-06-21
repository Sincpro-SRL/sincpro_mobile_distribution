import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { SettingsFetchedEvent } from "@sincpro/mobile-distribution/domain/settings";
import { distributionWorkflows } from "@sincpro/mobile-distribution/services/workflows";

export class SettingsFetchedSubscriber extends Subscriber {
  listen = [SettingsFetchedEvent];

  getEvent(event: DomainEvent): SettingsFetchedEvent {
    return SettingsFetchedEvent.from(event);
  }

  async process(_event: SettingsFetchedEvent): Promise<void> {
    await distributionWorkflows.configureDistributionSettings();
  }
}
