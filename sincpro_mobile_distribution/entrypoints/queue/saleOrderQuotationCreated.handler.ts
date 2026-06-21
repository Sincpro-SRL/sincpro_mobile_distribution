import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  SaleOrder,
  SaleOrderQuotationCreatedEvent,
} from "@sincpro/mobile-distribution/domain/sale_order";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";

export class SaleOrderQuotationCreatedSubscriber extends Subscriber {
  readonly listen = [SaleOrderQuotationCreatedEvent];

  getEvent(event: DomainEvent): SaleOrderQuotationCreatedEvent {
    return SaleOrderQuotationCreatedEvent.from(event);
  }

  async process(event: SaleOrderQuotationCreatedEvent): Promise<void> {
    const order = SaleOrder.fromJSON(event.record);
    await saleOrderService.pushQuotationToBackend(order);
  }
}
