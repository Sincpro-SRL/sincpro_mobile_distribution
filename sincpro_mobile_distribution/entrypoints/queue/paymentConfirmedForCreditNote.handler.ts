import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  Payment,
  PaymentConfirmedForCreditNoteEvent,
} from "@sincpro/mobile-distribution/domain/payment";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";

export class PaymentConfirmedForCreditNoteSubscriber extends Subscriber {
  readonly listen = [PaymentConfirmedForCreditNoteEvent];

  getEvent(event: DomainEvent): PaymentConfirmedForCreditNoteEvent {
    return PaymentConfirmedForCreditNoteEvent.from(event);
  }

  async process(event: PaymentConfirmedForCreditNoteEvent): Promise<void> {
    const serialized = Payment.fromJSON<Payment>(event.record);
    const payment = await paymentService.findOrCreatePayment(serialized);
    await paymentService.pushCreditNotePaymentToBackend(payment);
  }
}
