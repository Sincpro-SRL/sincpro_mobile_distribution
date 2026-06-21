import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { CreditNoteReadyToReconcileEvent } from "@sincpro/mobile-distribution/domain/credit_note";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";

export class CreditNoteReadyToReconcileSubscriber extends Subscriber {
  readonly listen = [CreditNoteReadyToReconcileEvent];

  getEvent(event: DomainEvent): CreditNoteReadyToReconcileEvent {
    return CreditNoteReadyToReconcileEvent.from(event);
  }

  async process(event: CreditNoteReadyToReconcileEvent): Promise<void> {
    const serializedCreditNote = event.creditNote;
    const serializedPayments = event.payments;

    const creditNote = await creditNoteService.getCreditNoteById(serializedCreditNote.uuid);

    const payments = await paymentService.getPaymentByIds(
      serializedPayments.map((p) => p.uuid),
    );

    if (!creditNote) {
      throw new Error(`Credit note ${serializedCreditNote.uuid} not found.`);
    }

    if (payments.isEmpty) {
      throw new Error(
        `Some payments for Credit note ${serializedCreditNote.uuid} not found.`,
      );
    }

    await creditNoteService.reconcileCreditNoteWithPayments(creditNote, payments.toArray());
  }
}
