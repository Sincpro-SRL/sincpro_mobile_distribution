import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import { mapped } from "@sincpro/mobile/infrastructure/database";
import { generateUUID } from "@sincpro/mobile/infrastructure/database/utils";
import logger from "@sincpro/mobile/infrastructure/logger";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";

import { ESourceModel } from "./enums";
import { EPaymentAmountType, EPaymentTargetType, type Payment } from "./payment";

export type PaymentOdooID = string;

export enum EPaymentOdooState {
  DRAFT = "draft",
  POSTED = "posted",
  CLOSED = "closed",
}

export enum EPaymentOdooType {
  INBOUND = "inbound",
  OUTBOUND = "outbound",
}

export interface IPaymentOdooMethod {
  id: number;
  name: string;
  code?: string;
  inbound_payment_method_line_ids?: {
    id: number;
    name: string;
    code?: string;
    payment_type?: EPaymentAmountType;
  };
  outbound_payment_method_line_ids?: {
    id: number;
    name: string;
    code?: string;
    payment_type?: EPaymentAmountType;
  }[];
}

export interface IRemotePaymentOdooDTO {
  id: number;
  name: string;
  state: string;
  ref: string;
  date: string;
  invoice_origin: string;
  payment_type: string;
  payment_reference: string;
  external_uuid: string;
  journal_id: {
    id: number;
    name: string;
  };
  partner_id: {
    id: number;
    name: string;
  };
  distribution_route_plan_id?: number;
  amount: number;
  currency_id?: {
    id: number;
    name: string;
    symbol: string;
  };
}

export class PaymentOdoo extends RemoteEntity {
  protected readonly REPOSITORY = EDistributionDomainRepository.PAYMENT_ODOO;

  public routeId?: number;
  public date: string = new Date().toISOString().split("T")[0];
  public total: number = 0;
  public paymentReference?: string;
  public customerId?: number;
  public customerUUID?: string;
  public customerName?: string;
  public targetUUID?: string;
  public targetName?: string;
  public targetRemoteId?: number;
  public targetRemoteModel?: ESourceModel;
  public targetRemoteRef?: string;
  public targetType?: EPaymentTargetType;
  public paymentMethod?: IPaymentOdooMethod;
  public paymentType: EPaymentOdooType = EPaymentOdooType.INBOUND;
  public state: EPaymentOdooState = EPaymentOdooState.DRAFT;
  public remoteModel?: ESourceModel;
  public currency?: string;
  public currencyId?: number;

  static fromPayment(payment: Payment): PaymentOdoo {
    let targetModel;
    switch (payment.targetType) {
      case EPaymentTargetType.SALE_ORDER:
        targetModel = ESourceModel.ORDER;
        break;
      case EPaymentTargetType.INVOICE:
        targetModel = ESourceModel.INVOICE;
        break;
      case EPaymentTargetType.CREDIT_NOTE:
        targetModel = ESourceModel.INVOICE;
        break;
    }

    const data: Partial<PaymentOdoo> = {
      uuid: payment.uuid,
      name: payment.name,
      date: payment.date,
      paymentReference: payment.paymentReference,
      customerId: payment.customerId,
      customerUUID: payment.customerUUID,
      routeId: payment.routeId,
      paymentType:
        payment.paymentAmountType === EPaymentAmountType.OUTBOUND
          ? EPaymentOdooType.OUTBOUND
          : EPaymentOdooType.INBOUND,
      total: payment.total,
      targetUUID: payment.targetUUID,
      targetRemoteId: payment.targetRemoteId,
      targetRemoteModel: targetModel,
      targetType: payment.targetType,
      targetRemoteRef: `${targetModel},${payment.targetRemoteId}`,
      paymentMethod: payment.paymentMethod,
    };

    return PaymentOdoo.obj<PaymentOdoo>(data);
  }

  static override fromRemoteDTO(record: IRemotePaymentOdooDTO): PaymentOdoo {
    const data: Partial<PaymentOdoo> = {
      uuid: record.external_uuid || generateUUID(),
      remoteId: record.id,
      remoteModel: ESourceModel.PAYMENT,
      remoteState: ERemoteState.SYNCED,
      name: record.name,
      date: record.date,
      paymentReference: record.ref,
      customerId: record.partner_id.id,
      customerName: record.partner_id.name,
      routeId: record.distribution_route_plan_id,
      paymentType:
        record.payment_type === "outbound"
          ? EPaymentOdooType.OUTBOUND
          : EPaymentOdooType.INBOUND,
      state: record.state as EPaymentOdooState,
      currency: record.currency_id?.name,
      currencyId: record.currency_id?.id,
      paymentMethod: record.journal_id
        ? { id: record.journal_id.id, name: record.journal_id.name }
        : undefined,
    };
    data.total = Math.abs(record.amount);

    try {
      const serializedSourceMetadata = JSON.parse(record.invoice_origin);
      if (serializedSourceMetadata) {
        data.targetRemoteId =
          serializedSourceMetadata.targetRemoteId || serializedSourceMetadata.sourceId;
        data.targetRemoteModel =
          serializedSourceMetadata.targetRemoteModel || serializedSourceMetadata.sourceModel;
        data.targetRemoteRef =
          serializedSourceMetadata.targetRemoteRef || serializedSourceMetadata.sourceRef;
        data.targetUUID =
          serializedSourceMetadata.targetUUID || serializedSourceMetadata.targetUUID;
        data.targetType = serializedSourceMetadata.targetType;
      }
    } catch (e) {
      logger.warn(
        `Failed to parse invoice_origin for PaymentOdoo with remoteId ${record.id}:\n ${e}`,
      );
      data.name = record.ref || record.name || undefined;
    }

    const payment = PaymentOdoo.obj<PaymentOdoo>(data);
    return payment;
  }

  @mapped(EDistributionDomainRepository.PAYMENT, "uuid")
  get metaPayment(): Payment | null {
    return null;
  }

  get signedAmount(): number {
    return this.paymentType === EPaymentOdooType.OUTBOUND ? -this.total : this.total;
  }

  setCustomer(customerId: number, customerUUID?: string): void {
    this.customerId = customerId;
    this.customerUUID = customerUUID;
  }

  setRoute(routeId: number): void {
    this.routeId = routeId;
  }

  mergeWithRemote(data: this) {
    this.name = data.name;
    this.remoteId = data.remoteId;
    this.remoteState = ERemoteState.SYNCED;
    this.state = data.state;
    this.paymentMethod = data.paymentMethod;
    this.currency = data.currency;
    this.currencyId = data.currencyId;
  }

  override remotePayload(): any {
    return {
      journal_id: this.paymentMethod?.id,
      amount: Math.abs(this.total),
      partner_id: this.customerId,
      payment_type: this.paymentType === EPaymentOdooType.OUTBOUND ? "outbound" : "inbound",
      ref: this.paymentReference,
      external_uuid: this.uuid,
      distribution_route_plan_id: this.routeId,
      invoice_origin: JSON.stringify({
        targetUUID: this.targetUUID,
        targetRemoteId: this.targetRemoteId,
        targetRemoteModel: this.targetRemoteModel,
        targetRemoteRef: this.targetRemoteRef,
        targetType: this.targetType,
      }),
    };
  }
}
