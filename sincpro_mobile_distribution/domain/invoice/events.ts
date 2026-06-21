import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";

import type { Payment } from "../payment";
import type { Invoice } from "./invoice";

export class InvoiceCreatedFromSaleOrderEvent extends DomainEvent {
  static readonly name = "distribution.invoice.v2.created_from_sale_order";
  static readonly label = "Creando factura desde orden de venta";
  static readonly requiresNetwork = true;

  public readonly name = InvoiceCreatedFromSaleOrderEvent.name;
  public readonly label = InvoiceCreatedFromSaleOrderEvent.label;
  public readonly requiresNetwork = InvoiceCreatedFromSaleOrderEvent.requiresNetwork;
  public record!: Invoice;
}

export class InvoiceReadyToReconcileEvent extends DomainEvent {
  static readonly name = "distribution.invoice.v2.ready_to_reconcile";
  static readonly label = "Reconciliando factura con pagos";
  static readonly requiresNetwork = true;

  public readonly name = InvoiceReadyToReconcileEvent.name;
  public readonly label = InvoiceReadyToReconcileEvent.label;
  public readonly requiresNetwork = InvoiceReadyToReconcileEvent.requiresNetwork;
  public invoice!: Invoice;
  public payments: Payment[] = [];
}

export class InvoicePenalizationInfoFetchedEvent extends DomainEvent {
  static readonly name = "distribution.invoice.v2.penalization_info_fetched";
  static readonly label = "Información de penalización de factura obtenida";
  static readonly requiresNetwork = true;

  public readonly name = InvoicePenalizationInfoFetchedEvent.name;
  public readonly label = InvoicePenalizationInfoFetchedEvent.label;
  public readonly requiresNetwork = InvoicePenalizationInfoFetchedEvent.requiresNetwork;

  public remoteInvoiceIds!: number[];
}
