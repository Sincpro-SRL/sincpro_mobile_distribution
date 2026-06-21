import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import { mapped } from "@sincpro/mobile/infrastructure/database";
import { generateUUID } from "@sincpro/mobile/infrastructure/database/utils";
import logger from "@sincpro/mobile/infrastructure/logger";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";
import { ITaxTotals } from "@sincpro/mobile-distribution/domain/sale_order";

import { EPaymentTargetType, type Payment } from "./payment";

export type PaymentCreditID = number;

export enum EPaymentCreditState {
  DRAFT = "draft",
  POSTED = "posted",
  CANCELLED = "cancelled",
}

export enum EPaymentCreditPaymentState {
  NOT_PAID = "not_paid",
  IN_PAYMENT = "in_payment",
  PAID = "paid",
  PARTIAL = "partial",
  REVERSED = "reversed",
}

export interface IRemotePaymentCreditDTO {
  id: number;
  external_uuid?: string;
  name: string;
  state: string;
  move_type: string;
  payment_state: string;
  ref?: string;
  payment_reference?: string;
  credit_id?: number;
  invoice_origin?: string;
  invoice_date: string;
  amount_total: number;
  amount_untaxed: number;
  amount_tax: number;
  amount_residual: number;
  amount_residual_signed?: number;
  distribution_route_plan_id?: number | false;
  partner_id: {
    id: number;
    name: string;
    vat?: string;
  };
  tax_totals?: ITaxTotals;
  consecutivo_hacienda?: string;
  hacienda_clave_numerica?: string;
  currency_id?: {
    id: number;
    name: string;
    symbol: string;
  };
  journal_id?: number;
}

export class PaymentCredit extends RemoteEntity {
  protected readonly REPOSITORY = EDistributionDomainRepository.PAYMENT_CREDIT;

  public name: string = "";
  public state: EPaymentCreditState = EPaymentCreditState.DRAFT;
  public paymentReference?: string;
  public date: string = "";
  public amountTotal: number = 0;
  public customerId: number = 0;
  public customerName: string = "";
  public customerVat: string = "";
  public currency: string = "CRC";
  public currencySymbol: string = "₡";
  public journalId?: number;
  public routeId?: number;
  public creditApplicationId?: number;
  public paymentTermDisplay?: string;
  public authorizedPersonName?: string;
  public authorizedPersonId?: number;
  public targetUUID?: string;
  public targetName?: string;
  public targetRemoteId?: number;
  public targetRemoteModel?: EPaymentTargetType;
  public targetRemoteRef?: string;
  public targetType?: EPaymentTargetType;

  static fromPayment(payment: Payment): PaymentCredit {
    const data: Partial<PaymentCredit> = {
      uuid: payment.uuid,
      name: payment.name || "",
      date: payment.date,
      paymentReference: payment.paymentReference || "",
      amountTotal: payment.total,
      customerId: payment.customerId || 0,
      routeId: payment.routeId,
      creditApplicationId: payment.creditApplicationId || 0,
      currency: payment.currency || "CRC",
      targetUUID: payment.targetUUID || "",
      targetName: payment.targetName || "",
      targetRemoteId: payment.targetRemoteId || 0,
      targetRemoteModel: EPaymentTargetType.INVOICE,
      targetRemoteRef: `account.move,${payment.targetRemoteId}`,
      targetType: payment.targetType,
      paymentTermDisplay: payment.paymentTermDisplay || "",
      authorizedPersonName: payment.authorizedPersonName || "",
      authorizedPersonId: payment.authorizedPersonId || 0,
    };

    return PaymentCredit.obj<PaymentCredit>(data);
  }

  static override fromRemoteDTO(record: IRemotePaymentCreditDTO): PaymentCredit {
    const routeId =
      typeof record.distribution_route_plan_id === "number"
        ? record.distribution_route_plan_id
        : undefined;

    const data: Partial<PaymentCredit> = {
      uuid: record.external_uuid || generateUUID(),
      remoteId: record.id,
      name: record.name,
      state: record.state as EPaymentCreditState,
      date: record.invoice_date,
      paymentReference: record.payment_reference || "",
      amountTotal: record.amount_total,
      customerId: record.partner_id?.id || 0,
      customerName: record.partner_id?.name || "",
      customerVat: record.partner_id?.vat || "",
      currency: record.currency_id?.name || "CRC",
      currencySymbol: record.currency_id?.symbol || "₡",
      journalId: record.journal_id,
      routeId,
      remoteRef: `account.move,${record.id}`,
      remoteState: ERemoteState.SYNCED,
      creditApplicationId: record.credit_id,
    };

    try {
      const serializedSourceMetadata =
        record.invoice_origin && JSON.parse(record.invoice_origin);
      if (serializedSourceMetadata) {
        data.targetRemoteId =
          serializedSourceMetadata.targetRemoteId || serializedSourceMetadata.sourceId;
        data.targetRemoteModel =
          serializedSourceMetadata.targetRemoteModel || serializedSourceMetadata.sourceModel;
        data.targetRemoteRef =
          serializedSourceMetadata.targetRemoteRef || serializedSourceMetadata.sourceRef;
        data.targetUUID =
          serializedSourceMetadata.targetUUID || serializedSourceMetadata.targetUUID;
        data.targetName = serializedSourceMetadata.targetName;
        data.paymentTermDisplay = serializedSourceMetadata.paymentTerm;
        data.authorizedPersonName = serializedSourceMetadata.authorizedPersonName;
        data.authorizedPersonId = serializedSourceMetadata.authorizedPersonId;
        data.targetType = serializedSourceMetadata.targetType;
      }
    } catch (e) {
      logger.warn(
        `Failed to parse invoice_origin for PaymentOdoo with remoteId ${record.id}:\n ${e}`,
      );
      data.name = record.ref || record.name || undefined;
    }

    const paymentCredit = PaymentCredit.obj<PaymentCredit>(data);
    return paymentCredit;
  }

  @mapped(EDistributionDomainRepository.PAYMENT, "uuid")
  get metaPayment(): Payment | null {
    return null;
  }

  get embeddedTarget(): any {
    return {
      targetUUID: this.targetUUID,
      targetName: this.targetName,
      targetRemoteId: this.targetRemoteId,
      targetRemoteModel: this.targetRemoteModel,
      targetRemoteRef: this.targetRemoteRef,
      targetType: this.targetType,
      paymentTermDisplay: this.paymentTermDisplay,
      authorizedPersonName: this.authorizedPersonName,
      authorizedPersonId: this.authorizedPersonId,
    };
  }

  setRoute(routeId: number): void {
    this.routeId = routeId;
  }
}
