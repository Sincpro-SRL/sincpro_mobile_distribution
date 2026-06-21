import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";

import type { Customer, CustomerID } from "./customer";

export class CustomersFetchedEvent extends DomainEvent {
  static readonly name = "distribution.customer.v2.fetched";
  static readonly label = "Sincronizando clientes";
  static readonly requiresNetwork = true;

  public readonly name = CustomersFetchedEvent.name;
  public readonly label = CustomersFetchedEvent.label;
  public readonly requiresNetwork = CustomersFetchedEvent.requiresNetwork;
  public customerIds: CustomerID[] = [];
}

export class CustomerCreatedEvent extends DomainEvent {
  static readonly name = "distribution.customer.v2.created";
  static readonly label = "Creando cliente";
  static readonly requiresNetwork = true;

  public readonly name = CustomerCreatedEvent.name;
  public readonly label = CustomerCreatedEvent.label;
  public readonly requiresNetwork = CustomerCreatedEvent.requiresNetwork;
  public customer!: Customer;
}
