import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";

import type { Payment } from "./payment";

export class PaymentConfirmedForInvoiceEvent extends DomainEvent {
  static readonly name = "distribution.payment.v2.confirmed_for_invoice";
  static readonly label = "Confirmando pago de factura";
  static readonly requiresNetwork = true;

  public readonly name = PaymentConfirmedForInvoiceEvent.name;
  public readonly label = PaymentConfirmedForInvoiceEvent.label;
  public readonly requiresNetwork = PaymentConfirmedForInvoiceEvent.requiresNetwork;
  public record!: Payment;
}

export class PaymentCreditConfirmedForInvoiceEvent extends DomainEvent {
  static readonly name = "distribution.payment.v2.credit_confirmed_for_invoice";
  static readonly label = "Confirmando pago a crédito de factura";
  static readonly requiresNetwork = true;

  public readonly name = PaymentCreditConfirmedForInvoiceEvent.name;
  public readonly label = PaymentCreditConfirmedForInvoiceEvent.label;
  public readonly requiresNetwork = PaymentCreditConfirmedForInvoiceEvent.requiresNetwork;
  public record!: Payment;
}

export class PaymentConfirmedForCreditNoteEvent extends DomainEvent {
  static readonly name = "distribution.payment.v2.confirmed_for_credit_note";
  static readonly label = "Confirmando pago de nota de crédito";
  static readonly requiresNetwork = true;

  public readonly name = PaymentConfirmedForCreditNoteEvent.name;
  public readonly label = PaymentConfirmedForCreditNoteEvent.label;
  public readonly requiresNetwork = PaymentConfirmedForCreditNoteEvent.requiresNetwork;
  public record!: Payment;
}

export class PaymentReconciledEvent extends DomainEvent {
  static readonly name = "distribution.payment.v2.reconciled";
  static readonly label = "Reconciliando pagos";
  static readonly requiresNetwork = false;

  public readonly name = PaymentReconciledEvent.name;
  public readonly label = PaymentReconciledEvent.label;
  public readonly requiresNetwork = PaymentReconciledEvent.requiresNetwork;
  public paymentUUIDs: string[] = [];
}

export class PaymentLinkToInvoiceEvent extends DomainEvent {
  static readonly name = "distribution.payment.v2.link_to_invoice_requested";
  static readonly label = "Vinculando pago a factura";
  static readonly requiresNetwork = true;

  public readonly name = PaymentLinkToInvoiceEvent.name;
  public readonly label = PaymentLinkToInvoiceEvent.label;
  public readonly requiresNetwork = PaymentLinkToInvoiceEvent.requiresNetwork;
  public record!: Payment;
}

export class PaymentLinkToCreditNoteEvent extends DomainEvent {
  static readonly name = "distribution.payment.v2.link_to_credit_note_requested";
  static readonly label = "Vinculando pago a nota de crédito";
  static readonly requiresNetwork = true;

  public readonly name = PaymentLinkToCreditNoteEvent.name;
  public readonly label = PaymentLinkToCreditNoteEvent.label;
  public readonly requiresNetwork = PaymentLinkToCreditNoteEvent.requiresNetwork;
  public record!: Payment;
}
