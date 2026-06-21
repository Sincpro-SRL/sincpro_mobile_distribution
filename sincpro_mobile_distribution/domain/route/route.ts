import { RemoteEntityCollection } from "@sincpro/mobile/domain";
import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import { NewAppSettingsEvent } from "@sincpro/mobile/domain/events";
import { mapped } from "@sincpro/mobile/infrastructure/database";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { EDistributionSetting } from "@sincpro/mobile-distribution/domain/settings";

import {
  RemoteRouteChangedEvent,
  RouteOrderCreatedFromRemoteEvent,
  RoutePlanFetchedEvent,
} from "./events";
import { type IRemoteRouteLineDTO, RouteOrder } from "./route_order";

export type Hash = string;

export enum ERouteStatusType {
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  DISTRIBUTED = "distributed",
  DONE = "done",
}

export enum ERoutePlanType {
  SALE_ORDER = "sale_order",
  COLLECTION = "collection",
  RETURN = "return",
  MILK_COLLECTION = "milk_collection",
  INSPECTION = "inspection",
}

export const MAP_ROUTE_STATUS: Record<ERouteStatusType, string> = {
  [ERouteStatusType.CONFIRMED]: "Confirmada",
  [ERouteStatusType.IN_PROGRESS]: "En Progreso",
  [ERouteStatusType.DISTRIBUTED]: "Distribuida",
  [ERouteStatusType.DONE]: "Finalizada",
};

export interface IRemoteRouteDTO {
  id: number;
  name: string;
  state: string;
  plan_type: ERoutePlanType;
  date_start_external?: string;
  date_end_external?: string;
  line_ids: IRemoteRouteLineDTO[];
  distributor_id: {
    id: number;
    name: string;
  };
  distribution_center_id: {
    id: number;
    name: string;
  };
  active?: boolean;
}

export interface IRemoteRouteWithHash {
  hash: string;
  route: IRemoteRouteDTO;
}

export class Route extends RemoteEntity {
  protected readonly REPOSITORY = EDistributionRepository.ROUTE;

  public distributionCenter: string = "";
  public distributorName: string = "";
  public status: ERouteStatusType = ERouteStatusType.CONFIRMED;
  public planType: ERoutePlanType = ERoutePlanType.SALE_ORDER;
  public name: string = "";
  public startDate: string | null = null;
  public endDate: string | null = null;
  public hash?: string;
  public orderIds: number[] = [];
  public active?: boolean;
  public rawData?: IRemoteRouteDTO;

  static override fromRemoteDTO(response: IRemoteRouteWithHash): Route {
    const record = response.route;
    const routeData: Partial<Route> = {
      remoteId: record.id,
      name: record.name,
      distributionCenter: record.distribution_center_id.name,
      distributorName: record.distributor_id.name,
      status: record.state as ERouteStatusType,
      planType: record.plan_type,
      startDate: record.date_start_external || null,
      endDate: record.date_end_external || null,
      hash: response.hash,
      orderIds: record.line_ids?.map((line) => line.id) || [],
      active: record.active || false,
      rawData: record,
      remoteState: ERemoteState.SYNCED,
    };

    const route = Route.obj(routeData);

    route.addDomainEvent<RouteOrderCreatedFromRemoteEvent>(RouteOrderCreatedFromRemoteEvent, {
      routeOrders: record.line_ids.map(RouteOrder.fromRemoteDTO),
    });
    route.addDomainEvent<RoutePlanFetchedEvent>(RoutePlanFetchedEvent, { route });
    return route;
  }

  @mapped(EDistributionRepository.ROUTE_ORDER, "orderIds", true)
  get orders(): RemoteEntityCollection<RouteOrder> {
    return new RemoteEntityCollection([]);
  }

  notifyRouteOutdated(): void {
    this.publishDomainEvent<RemoteRouteChangedEvent>(RemoteRouteChangedEvent, {
      route: this,
    });
  }

  start(): void {
    if (this.status !== ERouteStatusType.CONFIRMED) {
      throw new Error(`Cannot start route in status ${this.status}`);
    }
    this.status = ERouteStatusType.IN_PROGRESS;
    this.startDate = new Date().toISOString();

    this.addDomainEvent<NewAppSettingsEvent>(NewAppSettingsEvent, {
      settings: [
        {
          key: EDistributionSetting.START_DATE_ROUTE,
          value: Date.now(),
        },
      ],
    });
  }

  finish(): void {
    if (
      this.status !== ERouteStatusType.IN_PROGRESS &&
      this.status !== ERouteStatusType.DISTRIBUTED
    ) {
      throw new Error(`Cannot finish route in status ${this.status}`);
    }
    this.status = ERouteStatusType.DONE;
    this.active = false;
    this.endDate = new Date().toISOString();

    this.addDomainEvent<NewAppSettingsEvent>(NewAppSettingsEvent, {
      settings: [
        {
          key: EDistributionSetting.END_DATE_ROUTE,
          value: Date.now(),
        },
        {
          key: EDistributionSetting.ACTIVE_ROUTE,
          value: null,
        },
      ],
    });
  }

  setActive(): void {
    this.active = true;

    this.addDomainEvent<NewAppSettingsEvent>(NewAppSettingsEvent, {
      settings: [
        {
          key: EDistributionSetting.ACTIVE_ROUTE,
          value: this.remoteId,
        },
        {
          key: EDistributionSetting.START_DATE_ROUTE,
          value: this.startDate || null,
        },
        {
          key: EDistributionSetting.END_DATE_ROUTE,
          value: this.endDate || null,
        },
        {
          key: EDistributionSetting.ACTIVE_ROUTE_STATE,
          value: this.status,
        },
      ],
    });
  }

  markAsSynced(): void {
    this.remoteState = ERemoteState.SYNCED;
    this.addDomainEvent<RoutePlanFetchedEvent>(RoutePlanFetchedEvent, { route: this });
  }

  checkHashAndNotifyIfChanged(remoteHash: string): boolean {
    if (this.hash !== remoteHash) {
      this.notifyRouteOutdated();
      return true;
    }
    return false;
  }

  get saleOrderIds(): number[] {
    const remoteIds: number[] = [];
    if (this.planType !== ERoutePlanType.SALE_ORDER) {
      return remoteIds;
    }

    for (const order of this.orders) {
      const remoteId = order.extractRemoteId();
      if (!remoteId) {
        continue;
      }

      remoteIds.push(remoteId);
    }
    return remoteIds;
  }

  get isFinished(): boolean {
    return [ERouteStatusType.DISTRIBUTED, ERouteStatusType.DONE].includes(this.status);
  }

  get isActive(): boolean {
    return [ERouteStatusType.CONFIRMED, ERouteStatusType.IN_PROGRESS].includes(this.status);
  }
}
