import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import {
  CreditNote,
  CreditNoteStockReturnRequestedEvent,
} from "@sincpro/mobile-distribution/domain/credit_note";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";

export class CreditNoteStockReturnRequestedSubscriber extends Subscriber {
  readonly listen = [CreditNoteStockReturnRequestedEvent];

  getEvent(event: DomainEvent): CreditNoteStockReturnRequestedEvent {
    return CreditNoteStockReturnRequestedEvent.from(event);
  }

  async process(event: CreditNoteStockReturnRequestedEvent): Promise<void> {
    const existingCreditNote = await creditNoteService.getCreditNoteById(
      event.creditNoteUUID,
    );
    if (!existingCreditNote) {
      throw new Error(`Credit note ${event.creditNoteUUID} not found`);
    }

    const creditNote = CreditNote.fromJSON<CreditNote>(existingCreditNote);

    await saleOrderService.returnProducts(creditNote);
  }
}
