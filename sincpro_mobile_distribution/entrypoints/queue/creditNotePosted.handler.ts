import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  CreditNote,
  CreditNotePostedEvent,
} from "@sincpro/mobile-distribution/domain/credit_note";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";

export class CreditNotePostedSubscriber extends Subscriber {
  readonly listen = [CreditNotePostedEvent];

  getEvent(event: DomainEvent): CreditNotePostedEvent {
    return CreditNotePostedEvent.from(event);
  }

  async process(event: CreditNotePostedEvent): Promise<void> {
    const existingCreditNote = await creditNoteService.getCreditNoteById(
      event.creditNoteUUID,
    );
    if (!existingCreditNote) {
      throw new Error(`Credit note ${event.creditNoteUUID} not found`);
    }

    const creditNote = CreditNote.fromJSON<CreditNote>(existingCreditNote);

    await creditNoteService.postRemoteCreditNote(creditNote);
  }
}
