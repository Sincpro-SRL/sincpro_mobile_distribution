import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";

import type { IRemoteInvoiceDTO } from "../invoice";
import type { RouteOrder } from "../route";
import type { SaleOrder } from "./sale_order";

export class SaleOrderQuotationCreatedEvent extends DomainEvent {
  static readonly name = "distribution.sale_order.v2.quotation_created";
  static readonly label = "Creando cotización";
  static readonly requiresNetwork = true;

  public readonly name = SaleOrderQuotationCreatedEvent.name;
  public readonly label = SaleOrderQuotationCreatedEvent.label;
  public readonly requiresNetwork = SaleOrderQuotationCreatedEvent.requiresNetwork;
  public record!: SaleOrder;
}

export class SaleOrderCreatedEvent extends DomainEvent {
  static readonly name = "distribution.sale_order.v2.created";
  static readonly label = "Creando orden de venta";
  static readonly requiresNetwork = true;

  public readonly name = SaleOrderCreatedEvent.name;
  public readonly label = SaleOrderCreatedEvent.label;
  public readonly requiresNetwork = SaleOrderCreatedEvent.requiresNetwork;
  public saleOrderUUID: string = "";
}

export class SaleOrderConfirmedEvent extends DomainEvent {
  static readonly name = "distribution.sale_order.v2.confirmed";
  static readonly label = "Confirmando orden de venta";
  static readonly requiresNetwork = true;

  public readonly name = SaleOrderConfirmedEvent.name;
  public readonly label = SaleOrderConfirmedEvent.label;
  public readonly requiresNetwork = SaleOrderConfirmedEvent.requiresNetwork;
  public saleOrderUUID: string = "";
}

export class SaleOrderDeliveredEvent extends DomainEvent {
  static readonly name = "distribution.sale_order.v2.delivered";
  static readonly label = "Marcando orden como entregada";
  static readonly requiresNetwork = false;

  public readonly name = SaleOrderDeliveredEvent.name;
  public readonly label = SaleOrderDeliveredEvent.label;
  public readonly requiresNetwork = SaleOrderDeliveredEvent.requiresNetwork;
  public order!: SaleOrder;
  public routeOrder!: RouteOrder;
}

export class SaleOrderUpdatedEvent extends DomainEvent {
  static readonly name = "distribution.sale_order.v2.updated";
  static readonly label = "Actualizando orden de venta";
  static readonly requiresNetwork = true;

  public readonly name = SaleOrderUpdatedEvent.name;
  public readonly label = SaleOrderUpdatedEvent.label;
  public readonly requiresNetwork = SaleOrderUpdatedEvent.requiresNetwork;
  public saleOrderUUID: string = "";
}

export class SaleOrderNewInvoicesDetectedEvent extends DomainEvent {
  static readonly name = "distribution.sale_order.v2.new_invoices_detected";
  static readonly label = "Detectando nuevas facturas";
  static readonly requiresNetwork = true;

  public readonly name = SaleOrderNewInvoicesDetectedEvent.name;
  public readonly label = SaleOrderNewInvoicesDetectedEvent.label;
  public readonly requiresNetwork = SaleOrderNewInvoicesDetectedEvent.requiresNetwork;
  public remoteInvoices: IRemoteInvoiceDTO[] = [];
}
