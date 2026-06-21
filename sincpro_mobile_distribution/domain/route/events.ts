import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";

import type { Route } from "./route";
import type { RouteOrder } from "./route_order";

export class RoutePlanFetchedEvent extends DomainEvent {
  static readonly name = "distribution.route.v2.fetched";
  static readonly label = "Sincronizando rutas";
  static readonly requiresNetwork = true;

  public readonly name = RoutePlanFetchedEvent.name;
  public readonly label = RoutePlanFetchedEvent.label;
  public readonly requiresNetwork = RoutePlanFetchedEvent.requiresNetwork;
  public route!: Route;
}

export class RouteOrderCreatedFromRemoteEvent extends DomainEvent {
  static readonly name = "distribution.route_order.v2.created_from_remote";
  static readonly label = "Sincronizando órdenes de ruta";
  static readonly requiresNetwork = false;

  public readonly name = RouteOrderCreatedFromRemoteEvent.name;
  public readonly label = RouteOrderCreatedFromRemoteEvent.label;
  public readonly requiresNetwork = RouteOrderCreatedFromRemoteEvent.requiresNetwork;
  public routeOrders: RouteOrder[] = [];
}

export class RemoteRouteChangedEvent extends DomainEvent {
  static readonly name = "distribution.route.v2.remote_changed";
  static readonly label = "Actualizando ruta";
  static readonly requiresNetwork = true;

  public readonly name = RemoteRouteChangedEvent.name;
  public readonly label = RemoteRouteChangedEvent.label;
  public readonly requiresNetwork = RemoteRouteChangedEvent.requiresNetwork;
  public route!: Route;
}
