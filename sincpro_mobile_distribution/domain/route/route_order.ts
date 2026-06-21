import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";

import { EDistributionDomainRepository } from "../repository";

export enum ERoutePlanLineState {
  UNASSIGNED = "unassigned",
  ASSIGNED = "assigned",
  IN_REVIEW = "in_review",
  READY_TO_DELIVER = "ready_to_deliver",
  IN_PROGRESS = "in_progress",
  DONE = "done",
  PARTIAL = "partial",
  CANCELLED = "cancelled",
}

export interface IRemoteRouteLineDetailDTO {
  id: number;
  product_id: {
    id: number;
    name: string;
    description_sale: string;
    barcode: string;
    default_code: string;
  };
  product_uom_id: {
    id: number;
    name: string;
  };
  price_unit: number;
  discount: number;
  quantity: number;
  delivered_quantity: number;
  currency_id: {
    id: number;
    name: string;
    symbol: string;
  };
}

export interface IRemoteRouteLineDTO {
  id: number;
  route_plan_id: number;
  name: string;
  state: ERoutePlanLineState;
  source_ref: string;
  source_ref_name: string;
  latitude: number;
  longitude: number;
  planned_date: string;
  done_date: string;
  partner_id: {
    id: number;
    name: string;
    email: string;
    mobile: string;
    phone: string;
    vat: string;
    street: string;
  };
  notes: string;
  total_weight: number;
  weight_uom_id: {
    id: number;
    name: string;
  };
  total_volume: number;
  volume_uom_id: {
    id: number;
    name: string;
  };
  detail_ids: IRemoteRouteLineDetailDTO[];
}

export class RouteOrder extends RemoteEntity {
  protected readonly REPOSITORY = EDistributionDomainRepository.ROUTE_ORDER;

  public name: string = "";
  public state: ERoutePlanLineState = ERoutePlanLineState.UNASSIGNED;
  public sourceRefName: string = "";
  public routePlanId: number = 0;
  public partnerId: number = 0;
  public partnerName: string = "";
  public partnerEmail: string = "";
  public partnerMobile: string = "";
  public partnerPhone: string = "";
  public partnerVat: string = "";
  public partnerStreet: string = "";
  public latitude: number = 0;
  public longitude: number = 0;
  public plannedDate: string = "";
  public doneDate: string = "";
  public notes: string = "";
  public totalWeight: number = 0;
  public weightUomId: number = 0;
  public weightUomName: string = "";
  public totalVolume: number = 0;
  public volumeUomId: number = 0;
  public volumeUomName: string = "";
  public details: IRemoteRouteLineDetailDTO[] = [];

  static override fromRemoteDTO(record: IRemoteRouteLineDTO): RouteOrder {
    const data: Partial<RouteOrder> = {
      remoteId: record.id,
      name: record.name,
      state: record.state,
      remoteRef: record.source_ref,
      sourceRefName: record.source_ref_name,
      routePlanId: record.route_plan_id,
      partnerId: record.partner_id.id,
      partnerName: record.partner_id.name,
      partnerEmail: record.partner_id.email,
      partnerMobile: record.partner_id.mobile,
      partnerPhone: record.partner_id.phone,
      partnerVat: record.partner_id.vat,
      partnerStreet: record.partner_id.street,
      latitude: record.latitude,
      longitude: record.longitude,
      plannedDate: record.planned_date,
      doneDate: record.done_date,
      notes: record.notes,
      totalWeight: record.total_weight,
      weightUomId: record.weight_uom_id.id,
      weightUomName: record.weight_uom_id.name,
      totalVolume: record.total_volume,
      volumeUomId: record.volume_uom_id.id,
      volumeUomName: record.volume_uom_id.name,
      remoteState: ERemoteState.SYNCED,
    };
    return RouteOrder.obj(data);
  }

  extractRemoteId(): number | null {
    if (this.remoteRef) {
      const sourceRefParts = this.remoteRef.split(",");
      return parseInt(sourceRefParts[1], 10);
    }
    return null;
  }

  markAsDelivered(): void {
    this.state = ERoutePlanLineState.DONE;
    this.doneDate = new Date().toISOString();

    for (const detail of this.details) {
      detail.delivered_quantity = detail.quantity;
    }
  }
}
