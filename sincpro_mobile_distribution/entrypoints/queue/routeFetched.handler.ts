import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { RoutePlanFetchedEvent } from "@sincpro/mobile-distribution/domain/route/events";
import { distributionWorkflows } from "@sincpro/mobile-distribution/services/workflows";

export class RoutePlanFetchedSubscriber extends Subscriber {
  listen = [RoutePlanFetchedEvent];

  getEvent(event: DomainEvent): RoutePlanFetchedEvent {
    return RoutePlanFetchedEvent.from(event);
  }

  async process(event: RoutePlanFetchedEvent): Promise<void> {
    await distributionWorkflows.pullRouteDataWorkflow(event.route.remoteId!);
  }
}
