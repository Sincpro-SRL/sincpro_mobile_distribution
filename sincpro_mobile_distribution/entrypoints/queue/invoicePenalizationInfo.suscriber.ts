import { Subscriber } from "@sincpro/mobile/domain";
import { DomainValidationError } from "@sincpro/mobile/exceptions";
import { InvoicePenalizationInfoFetchedEvent } from "@sincpro/mobile-distribution/domain/invoice";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";

export class InvoicePenalizationInfoSubscriber extends Subscriber {
  readonly listen = [InvoicePenalizationInfoFetchedEvent];

  async process(event: InvoicePenalizationInfoFetchedEvent): Promise<void> {
    if (!event.remoteInvoiceIds || event.remoteInvoiceIds.length === 0) {
      throw new DomainValidationError("No remote invoice IDs provided in the event.");
    }
    await invoiceService.addPenalizationInfoToInvoice(event.remoteInvoiceIds);
  }
}
