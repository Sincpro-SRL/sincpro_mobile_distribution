import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  Payment,
  PaymentConfirmedForInvoiceEvent,
} from "@sincpro/mobile-distribution/domain/payment";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";

export class PaymentConfirmedForInvoiceSubscriber extends Subscriber {
  readonly listen = [PaymentConfirmedForInvoiceEvent];

  getEvent(event: DomainEvent): PaymentConfirmedForInvoiceEvent {
    return PaymentConfirmedForInvoiceEvent.from(event);
  }

  async process(event: PaymentConfirmedForInvoiceEvent): Promise<void> {
    const serialized = Payment.fromJSON<Payment>(event.record);
    const payment = await paymentService.findOrCreatePayment(serialized);
    await paymentService.pushInvoicePaymentToBackend(payment);
  }
}
