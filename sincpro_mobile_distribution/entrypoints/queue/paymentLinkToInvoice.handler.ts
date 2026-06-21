import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  Payment,
  PaymentLinkToInvoiceEvent,
} from "@sincpro/mobile-distribution/domain/payment";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";

export class PaymentLinkToInvoiceSubscriber extends Subscriber {
  readonly listen = [PaymentLinkToInvoiceEvent];

  getEvent(event: DomainEvent): PaymentLinkToInvoiceEvent {
    return PaymentLinkToInvoiceEvent.from(event);
  }

  async process(event: PaymentLinkToInvoiceEvent): Promise<void> {
    const payment = Payment.fromJSON<Payment>(event.record);
    if (!payment.targetRemoteId) return;

    await invoiceService.fetchAndLinkPayment(payment.uuid, payment.targetRemoteId);
  }
}
