import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { InvoiceReadyToReconcileEvent } from "@sincpro/mobile-distribution/domain/invoice";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";

export class InvoiceReadyToReconcileSubscriber extends Subscriber {
  readonly listen = [InvoiceReadyToReconcileEvent];

  getEvent(event: DomainEvent): InvoiceReadyToReconcileEvent {
    return InvoiceReadyToReconcileEvent.from(event);
  }

  async process(event: InvoiceReadyToReconcileEvent): Promise<void> {
    const serializedInvoice = event.invoice;
    const serializedPayments = event.payments;

    const invoice = await invoiceService.getInvoiceByUUID(serializedInvoice.uuid);

    const payments = await paymentService.getPaymentByIds(
      serializedPayments.map((p) => p.uuid),
    );

    if (!invoice) {
      throw new Error(`Invoice ${serializedInvoice.uuid} not found.`);
    }

    if (payments.isEmpty) {
      throw new Error(`Some payments for Invoice ${serializedInvoice.uuid} not found.`);
    }

    await invoiceService.reconcileInvoiceWithPayments(invoice, payments.toArray());
  }
}
