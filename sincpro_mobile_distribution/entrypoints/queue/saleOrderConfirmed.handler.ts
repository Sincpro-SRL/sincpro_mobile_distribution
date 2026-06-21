import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { SaleOrderConfirmedEvent } from "@sincpro/mobile-distribution/domain/sale_order/events";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";

export class SaleOrderConfirmedSubscriber extends Subscriber {
  readonly listen = [SaleOrderConfirmedEvent];

  getEvent(event: DomainEvent): SaleOrderConfirmedEvent {
    return SaleOrderConfirmedEvent.from(event);
  }

  async process(event: SaleOrderConfirmedEvent): Promise<void> {
    const saleOrder = await saleOrderService.getOrderById(event.saleOrderUUID);
    if (!saleOrder) {
      throw new Error(`Sale order with remote ID ${event.saleOrderUUID} not found.`);
    }
    await saleOrderService.confirmQuotationInBackend(saleOrder);
  }
}
