import { Entity } from "@sincpro/mobile/domain/entity";
import { mapped } from "@sincpro/mobile/infrastructure/database";
import { generateUUID } from "@sincpro/mobile/infrastructure/database/utils";
import { type CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import { type Customer } from "@sincpro/mobile-distribution/domain/customer";
import { type Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { type PaymentCredit } from "@sincpro/mobile-distribution/domain/payment/payment_credit";
import { type PaymentOdoo } from "@sincpro/mobile-distribution/domain/payment/payment_odoo";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";
import { type SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";

export type PaymentID = string;

export enum EPaymentState {
  DRAFT = "draft",
  POSTED = "posted",
}

export enum EPaymentAmountType {
  INBOUND = "inbound",
  OUTBOUND = "outbound",
}

export enum EPaymentType {
  REGULAR_PAYMENT = "regular_payment",
  CREDIT_PAYMENT = "credit_payment",
}

export enum EPaymentTargetType {
  SALE_ORDER = "sale_order",
  INVOICE = "invoice",
  CREDIT_NOTE = "credit_note",
}

export interface IPaymentMethod {
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

export class Payment extends Entity {
  protected readonly REPOSITORY = EDistributionDomainRepository.PAYMENT;

  public routeId?: number;
  public date: string = new Date().toISOString().split("T")[0];
  public paymentMethod?: IPaymentMethod;
  public total: number = 0;
  public customerId?: number;
  public customerUUID?: string;
  public customerName?: string;
  public targetUUID?: string;
  public targetName?: string;
  public targetRemoteId?: number;
  public targetType?: EPaymentTargetType;
  public paymentType: EPaymentType = EPaymentType.REGULAR_PAYMENT;
  public paymentAmountType: EPaymentAmountType = EPaymentAmountType.INBOUND;
  public paymentReference?: string;
  public state: EPaymentState = EPaymentState.DRAFT;
  public currency?: string;
  public currencyId?: number;
  public creditApplicationId?: number;
  public paymentTermDisplay?: string;
  public authorizedPersonName?: string;
  public authorizedPersonId?: number;

  private splitPayment(targetAmount: number): [Payment, Payment?] {
    if (this.total > targetAmount) {
      const residual = Payment.fromJSON<Payment>(this);
      residual.uuid = generateUUID();
      residual.total = this.total - targetAmount;
      residual.state = EPaymentState.DRAFT;
      residual.paymentAmountType = this.paymentAmountType;
      residual.paymentType = this.paymentType;
      this.total = targetAmount;
      return [this, residual];
    }

    return [this, undefined];
  }

  static fromOdooPayment(paymentOdoo: PaymentOdoo): Payment {
    const constructorData: Partial<Payment> = {
      uuid: paymentOdoo.uuid,
      name: paymentOdoo.name,
      date: paymentOdoo.date,
      customerId: paymentOdoo.customerId,
      customerUUID: paymentOdoo.customerUUID,
      customerName: paymentOdoo.customerName,
      routeId: paymentOdoo.routeId,
      paymentAmountType:
        paymentOdoo.paymentType === "outbound"
          ? EPaymentAmountType.OUTBOUND
          : EPaymentAmountType.INBOUND,
      total: paymentOdoo.total,
      targetUUID: paymentOdoo.targetUUID,
      targetRemoteId: paymentOdoo.targetRemoteId,
      targetType: paymentOdoo.targetType,
      state: EPaymentState.POSTED,
      paymentMethod: paymentOdoo.paymentMethod,
      paymentType: EPaymentType.REGULAR_PAYMENT,
    };
    return Payment.obj<Payment>(constructorData);
  }

  static fromPaymentCredit(paymentCredit: PaymentCredit): Payment {
    const constructorData: Partial<Payment> = {
      uuid: paymentCredit.uuid,
      routeId: paymentCredit.routeId,
      name: paymentCredit.name,
      date: paymentCredit.date,
      customerId: paymentCredit.customerId,
      customerName: paymentCredit.customerName,
      total: paymentCredit.amountTotal,
      targetUUID: paymentCredit.targetUUID,
      targetRemoteId: paymentCredit.targetRemoteId,
      state: EPaymentState.POSTED,
      paymentType: EPaymentType.CREDIT_PAYMENT,
      paymentAmountType: EPaymentAmountType.INBOUND,
    };
    return Payment.obj<Payment>(constructorData);
  }

  @mapped(EDistributionDomainRepository.CUSTOMER, "customerId", true)
  get customer(): Customer | null {
    return null;
  }

  @mapped(EDistributionDomainRepository.PAYMENT_ODOO, "uuid")
  get paymentOdoo(): PaymentOdoo | null {
    return null;
  }

  @mapped(EDistributionDomainRepository.PAYMENT_CREDIT, "uuid")
  get paymentCredit(): PaymentCredit | null {
    return null;
  }

  get concretePayment(): PaymentOdoo | PaymentCredit | null {
    return this.paymentOdoo || this.paymentCredit;
  }

  @mapped(EDistributionDomainRepository.SALE_ORDER, "targetUUID")
  get saleOrderPaid(): SaleOrder | null {
    return null;
  }

  @mapped(EDistributionDomainRepository.INVOICE, "targetUUID")
  get invoicePaid(): Invoice | null {
    return null;
  }

  @mapped(EDistributionDomainRepository.CREDIT_NOTE, "targetUUID")
  get creditNotePaid(): CreditNote | null {
    return null;
  }

  get paidEntity(): Invoice | CreditNote | SaleOrder | null {
    return this.invoicePaid || this.creditNotePaid || this.saleOrderPaid;
  }

  get value(): number {
    return this.paymentAmountType === EPaymentAmountType.INBOUND ? this.total : -this.total;
  }

  get signedAmount(): number {
    return this.paymentAmountType === EPaymentAmountType.OUTBOUND ? -this.total : this.total;
  }

  setCustomer(customerId: number, customerUUID?: string): void {
    this.customerId = customerId;
    this.customerUUID = customerUUID;
  }

  setRoute(routeId: number): void {
    this.routeId = routeId;
  }

  get isCreditPayment(): boolean {
    return this.paymentType === EPaymentType.CREDIT_PAYMENT;
  }

  confirmCreditPaymentForInvoice(
    targetAmount: number,
    invoiceUUID: string,
    invoiceRemoteId: number,
    creditApplicationId: number,
    paymentTermDisplay?: string,
    authorizedPersonName?: string,
    authorizedPersonId?: number,
  ): Payment {
    if (targetAmount === 0) {
      throw new Error("Amount to post cannot be zero");
    }
    this.paymentType = EPaymentType.CREDIT_PAYMENT;
    this.date = new Date().toISOString();
    this.total = targetAmount;
    this.state = EPaymentState.POSTED;

    this.targetUUID = invoiceUUID;
    this.targetType = EPaymentTargetType.INVOICE;
    this.targetRemoteId = invoiceRemoteId;

    this.creditApplicationId = creditApplicationId;
    this.paymentTermDisplay = paymentTermDisplay;
    this.authorizedPersonName = authorizedPersonName;
    this.authorizedPersonId = authorizedPersonId;

    return this;
  }

  confirmForInvoice(
    targetAmount: number,
    invoiceUUID: string,
    invoiceRemoteId?: number,
  ): [Payment, Payment?] {
    if (targetAmount === 0) {
      throw new Error("Amount to post cannot be zero");
    }

    this.targetUUID = invoiceUUID;
    this.targetType = EPaymentTargetType.INVOICE;
    this.paymentAmountType = EPaymentAmountType.INBOUND;
    this.targetRemoteId = invoiceRemoteId;
    this.paymentType = EPaymentType.REGULAR_PAYMENT;
    this.state = EPaymentState.POSTED;
    this.date = new Date().toISOString();

    const [posted, residual] = this.splitPayment(targetAmount);
    return [posted, residual];
  }

  confirmForCreditNote(
    targetAmount: number,
    creditNoteUUID: string,
    creditNoteRemoteId?: number,
  ): [Payment, Payment?] {
    this.targetUUID = creditNoteUUID;

    if (targetAmount === 0) {
      throw new Error("Amount to post cannot be zero");
    }

    this.state = EPaymentState.POSTED;
    this.targetType = EPaymentTargetType.CREDIT_NOTE;
    this.paymentAmountType = EPaymentAmountType.OUTBOUND;
    this.paymentType = EPaymentType.REGULAR_PAYMENT;
    this.targetRemoteId = creditNoteRemoteId;
    this.date = new Date().toISOString();

    const [posted, residual] = this.splitPayment(targetAmount);
    return [posted, residual];
  }
}
