import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { SaleOrderNewInvoicesDetectedEvent } from "@sincpro/mobile-distribution/domain/sale_order/events";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";

export class SaleOrderNewInvoicesDetectedSubscriber extends Subscriber {
  readonly listen = [SaleOrderNewInvoicesDetectedEvent];

  getEvent(event: DomainEvent): SaleOrderNewInvoicesDetectedEvent {
    return SaleOrderNewInvoicesDetectedEvent.from(event);
  }

  async process(event: SaleOrderNewInvoicesDetectedEvent): Promise<void> {
    const { remoteInvoices } = event;

    if (!remoteInvoices || remoteInvoices.length === 0) {
      return;
    }
    await invoiceService.storeMissingInvoiceFromRemote(remoteInvoices);

    const customerIds = remoteInvoices
      .filter((inv) => inv.partner_id.id !== null)
      .map((inv) => inv.partner_id.id!);

    await customerService.fetchAndStoreMissingCustomersByRemoteIds(customerIds);
  }
}
