import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { RouteOrderCreatedFromRemoteEvent } from "@sincpro/mobile-distribution/domain/route/events";
import { routeService } from "@sincpro/mobile-distribution/services/route.service";

export class RouteOrderCreatedFromRemoteSubscriber extends Subscriber {
  listen = [RouteOrderCreatedFromRemoteEvent];

  getEvent(event: DomainEvent): RouteOrderCreatedFromRemoteEvent {
    return RouteOrderCreatedFromRemoteEvent.from(event);
  }

  async process(event: RouteOrderCreatedFromRemoteEvent): Promise<void> {
    await routeService.createMetaRouteOrders(event.routeOrders);
  }
}
