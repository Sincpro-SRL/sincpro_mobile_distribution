import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { RemoteRouteChangedEvent } from "@sincpro/mobile-distribution/domain/route/events";
import { routeService } from "@sincpro/mobile-distribution/services/route.service";

export class RemoteRouteChangedSubscriber extends Subscriber {
  listen = [RemoteRouteChangedEvent];

  getEvent(event: DomainEvent): RemoteRouteChangedEvent {
    return RemoteRouteChangedEvent.from(event);
  }

  async process(event: RemoteRouteChangedEvent): Promise<void> {
    const storedRoute = await routeService.getRouteByRemoteId(event.route.remoteId!);
    if (!storedRoute) {
      return;
    }
    await routeService.reconcileRoutePlan(storedRoute.remoteId!);
  }
}
