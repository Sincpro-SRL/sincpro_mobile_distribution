import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { SaleOrderDeliveredEvent } from "@sincpro/mobile-distribution/domain/sale_order/events";
import { routeService } from "@sincpro/mobile-distribution/services/route.service";

export class SaleOrderDeliveredSubscriber extends Subscriber {
  readonly listen = [SaleOrderDeliveredEvent];

  getEvent(event: DomainEvent): SaleOrderDeliveredEvent {
    return SaleOrderDeliveredEvent.from(event);
  }

  async process(event: SaleOrderDeliveredEvent): Promise<void> {
    const { order, routeOrder } = event;

    if (!routeOrder) {
      loggerUseCases.info(
        `Skipping SALE_ORDER_DELIVERED event handling for order [${order.remoteId}] as no route order is associated`,
      );
      return;
    }

    loggerUseCases.info(`Handling SALE_ORDER_DELIVERED event for order [${order.remoteId}]`);
    await routeService.updateRouteOrder(routeOrder);

    if (!order.routeId || !order.remoteId) {
      loggerUseCases.warn(
        `Order [${order.remoteId}] has no routeId or remoteId, skipping route sync`,
      );
      return;
    }

    const route = await routeService.getRouteByRemoteId(order.routeId);
    if (!route) {
      loggerUseCases.warn(`Route [${order.routeId}] not found, skipping sync`);
      return;
    }

    await routeService.updateLocalRoutePlanLines(order.routeId, routeOrder.remoteId!);
    await routeService.pushRouteToBackend(route.remoteId!);
    loggerUseCases.info(`Route [${order.routeId}] synced to backend successfully`);
  }
}
