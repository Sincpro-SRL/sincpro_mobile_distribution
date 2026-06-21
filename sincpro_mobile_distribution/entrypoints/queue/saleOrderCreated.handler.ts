import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { SaleOrderCreatedEvent } from "@sincpro/mobile-distribution/domain/sale_order/events";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";

export class SaleOrderCreatedSubscriber extends Subscriber {
  readonly listen = [SaleOrderCreatedEvent];

  getEvent(event: DomainEvent): SaleOrderCreatedEvent {
    return SaleOrderCreatedEvent.from(event);
  }

  async process(event: SaleOrderCreatedEvent): Promise<void> {
    const saleOrder = await saleOrderService.getOrderById(event.saleOrderUUID);
    if (!saleOrder) {
      throw new Error(`Sale order with ID ${event.saleOrderUUID} not found.`);
    }
    await saleOrderService.pushSaleOrderToBackend(saleOrder);
  }
}
