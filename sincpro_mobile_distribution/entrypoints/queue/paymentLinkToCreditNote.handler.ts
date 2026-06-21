import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  Payment,
  PaymentLinkToCreditNoteEvent,
} from "@sincpro/mobile-distribution/domain/payment";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";

export class PaymentLinkToCreditNoteSubscriber extends Subscriber {
  readonly listen = [PaymentLinkToCreditNoteEvent];

  getEvent(event: DomainEvent): PaymentLinkToCreditNoteEvent {
    return PaymentLinkToCreditNoteEvent.from(event);
  }

  async process(event: PaymentLinkToCreditNoteEvent): Promise<void> {
    const payment = Payment.fromJSON<Payment>(event.record);
    if (!payment.targetRemoteId) return;

    await creditNoteService.fetchAndLinkPayment(payment.uuid, payment.targetRemoteId);
  }
}
