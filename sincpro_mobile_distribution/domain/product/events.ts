import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";

import type { IUpdateProductStockPayload } from "./product";

export class ProductFetchedEvent extends DomainEvent {
  static readonly name = "distribution.product.v2.fetched";
  static readonly label = "Sincronizando productos";
  static readonly requiresNetwork = false;

  public readonly name = ProductFetchedEvent.name;
  public readonly label = ProductFetchedEvent.label;
  public readonly requiresNetwork = ProductFetchedEvent.requiresNetwork;
  public productRemoteIds: number[] = [];
}

export class ProductStockUpdatedEvent extends DomainEvent {
  static readonly name = "distribution.product.v2.stock_updated";
  static readonly label = "Actualizando stock";
  static readonly requiresNetwork = false;

  public readonly name = ProductStockUpdatedEvent.name;
  public readonly label = ProductStockUpdatedEvent.label;
  public readonly requiresNetwork = ProductStockUpdatedEvent.requiresNetwork;
  public type: "INCREASE" | "DECREASE" = "DECREASE";
  public lines: IUpdateProductStockPayload["lines"] = [];
}
