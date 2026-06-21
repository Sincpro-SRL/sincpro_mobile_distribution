import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  Invoice,
  InvoiceCreatedFromSaleOrderEvent,
} from "@sincpro/mobile-distribution/domain/invoice";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";

export class InvoiceCreatedFromSaleOrderSubscriber extends Subscriber {
  readonly listen = [InvoiceCreatedFromSaleOrderEvent];

  getEvent(event: DomainEvent): InvoiceCreatedFromSaleOrderEvent {
    return InvoiceCreatedFromSaleOrderEvent.from(event);
  }

  async process(event: InvoiceCreatedFromSaleOrderEvent): Promise<void> {
    const serializedInvoice = Invoice.fromJSON(event.record);
    const invoice = await invoiceService.findOrCreateInvoice(serializedInvoice);
    if (!invoice) {
      throw new Error(`Invoice ${serializedInvoice.uuid} not found.`);
    }
    await saleOrderService.createRemoteInvoice(invoice);
  }
}
