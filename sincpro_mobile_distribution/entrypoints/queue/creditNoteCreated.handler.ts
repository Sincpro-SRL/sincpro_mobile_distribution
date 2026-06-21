import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  CreditNote,
  CreditNoteCreatedEvent,
} from "@sincpro/mobile-distribution/domain/credit_note";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";

export class CreditNoteCreatedSubscriber extends Subscriber {
  readonly listen = [CreditNoteCreatedEvent];

  getEvent(event: DomainEvent): CreditNoteCreatedEvent {
    return CreditNoteCreatedEvent.from(event);
  }

  async process(event: CreditNoteCreatedEvent): Promise<void> {
    const serializedCreditNote = CreditNote.fromJSON(event.record);
    const creditNote = await creditNoteService.findOrCreateCreditNote(serializedCreditNote);
    if (!creditNote) {
      throw new Error(`Credit note ${serializedCreditNote.uuid} not found.`);
    }
    await creditNoteService.pushCreditNoteToBackend(creditNote);
  }
}
