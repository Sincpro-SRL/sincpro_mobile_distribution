import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  Payment,
  PaymentCreditConfirmedForInvoiceEvent,
} from "@sincpro/mobile-distribution/domain/payment";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";

export class PaymentCreditConfirmedForInvoiceSubscriber extends Subscriber {
  readonly listen = [PaymentCreditConfirmedForInvoiceEvent];

  getEvent(event: DomainEvent): PaymentCreditConfirmedForInvoiceEvent {
    return PaymentCreditConfirmedForInvoiceEvent.from(event);
  }

  async process(event: PaymentCreditConfirmedForInvoiceEvent): Promise<void> {
    const serialized = Payment.fromJSON<Payment>(event.record);
    const payment = await paymentService.findOrCreatePayment(serialized);
    await paymentService.pushInvoicePaymentCreditToBackend(payment);
  }
}
