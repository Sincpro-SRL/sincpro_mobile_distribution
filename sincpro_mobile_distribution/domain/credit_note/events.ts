import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";

import type { Payment } from "../payment";
import type { CreditNote } from "./credit_note";

export class CreditNoteCreatedEvent extends DomainEvent {
  static readonly name = "distribution.credit_note.v2.created";
  static readonly label = "Creando nota de crédito";
  static readonly requiresNetwork = true;

  public readonly name = CreditNoteCreatedEvent.name;
  public readonly label = CreditNoteCreatedEvent.label;
  public readonly requiresNetwork = CreditNoteCreatedEvent.requiresNetwork;
  public record!: CreditNote;
}

export class CreditNotePostedEvent extends DomainEvent {
  static readonly name = "distribution.credit_note.v2.posted";
  static readonly label = "Confirmando nota de crédito";
  static readonly requiresNetwork = true;

  public readonly name = CreditNotePostedEvent.name;
  public readonly label = CreditNotePostedEvent.label;
  public readonly requiresNetwork = CreditNotePostedEvent.requiresNetwork;
  public creditNoteUUID: string = "";
}

export class CreditNoteReadyToReconcileEvent extends DomainEvent {
  static readonly name = "distribution.credit_note.v2.ready_to_reconcile";
  static readonly label = "Reconciliando nota de crédito con pagos";
  static readonly requiresNetwork = true;

  public readonly name = CreditNoteReadyToReconcileEvent.name;
  public readonly label = CreditNoteReadyToReconcileEvent.label;
  public readonly requiresNetwork = CreditNoteReadyToReconcileEvent.requiresNetwork;
  public creditNote!: CreditNote;
  public payments: Payment[] = [];
}

export class CreditNoteStockReturnRequestedEvent extends DomainEvent {
  static readonly name = "distribution.credit_note.v2.stock_return_requested";
  static readonly label = "Procesando devolución de stock";
  static readonly requiresNetwork = false;

  public readonly name = CreditNoteStockReturnRequestedEvent.name;
  public readonly label = CreditNoteStockReturnRequestedEvent.label;
  public readonly requiresNetwork = CreditNoteStockReturnRequestedEvent.requiresNetwork;
  public creditNoteUUID: string = "";
}
