import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import type {
  Invoice,
  IRemoteInvoiceDTO,
} from "@sincpro/mobile-distribution/domain/invoice/invoice";
import { EInvoiceMoveType } from "@sincpro/mobile-distribution/domain/invoice/invoice";

export type IRemoteSaleOrderInvoiceDTO = IRemoteInvoiceDTO;

export class SaleOrderInvoice extends RemoteEntity {
  public name: string = "";
  public state: string = "";
  public paymentState: string = "";
  public amountTotal: number = 0;
  public amountResidual: number = 0;
  public invoiceDate: string = "";
  public consecutiveNumber?: string;
  public numericKey?: string;
  public journalId?: number;
  public creditApplicationId?: number;
  public customerId?: number;
  public moveType: EInvoiceMoveType = EInvoiceMoveType.OUT_INVOICE;

  static override fromRemoteDTO(record: IRemoteSaleOrderInvoiceDTO): SaleOrderInvoice {
    const data: Partial<SaleOrderInvoice> = {
      uuid: record.external_uuid,
      remoteId: record.id,
      name: record.name,
      state: record.state,
      paymentState: record.payment_state,
      amountTotal: record.amount_total,
      amountResidual: record.amount_residual,
      invoiceDate: record.invoice_date,
      consecutiveNumber: record.consecutivo_hacienda,
      numericKey: record.hacienda_clave_numerica,
      creditApplicationId: record.credit_id,
      customerId: record.partner_id?.id,
      moveType: record.move_type,
      remoteRef: `account.move,${record.id}`,
      remoteState: ERemoteState.SYNCED,
      journalId: record.journal_id,
    };

    return SaleOrderInvoice.obj(data);
  }

  static fromInvoice(invoice: Invoice): SaleOrderInvoice {
    const data: Partial<SaleOrderInvoice> = {
      uuid: invoice.uuid,
      remoteId: invoice.remoteId,
      name: invoice.name,
      state: invoice.state,
      paymentState: invoice.paymentState,
      amountTotal: invoice.amountTotal,
      amountResidual: invoice.amountResidual,
      invoiceDate: invoice.invoiceDate,
      consecutiveNumber: invoice.consecutiveNumber,
      numericKey: invoice.numericKey,
      creditApplicationId: invoice.creditApplicationId,
      customerId: invoice.customerId,
      moveType: invoice.moveType,
      remoteState: invoice.remoteState,
      journalId: invoice.journalId,
    };

    return SaleOrderInvoice.obj(data);
  }

  isValidInvoice(): boolean {
    return this.state !== "cancel";
  }

  isPosted(): boolean {
    return this.state === "posted";
  }

  isDraft(): boolean {
    return this.state === "draft";
  }

  isCancelled(): boolean {
    return this.state === "cancel";
  }

  isNotPaid(): boolean {
    return ["not_paid", "partial"].includes(this.paymentState);
  }

  isPaid(): boolean {
    return this.paymentState === "paid" || this.paymentState === "in_payment";
  }

  isCreditSale(): boolean {
    return Boolean(this.creditApplicationId);
  }

  isPartiallyPaid(): boolean {
    return this.paymentState === "partial";
  }

  isInPayment(): boolean {
    return this.paymentState === "in_payment";
  }

  getAmountPaid(): number {
    return this.amountTotal - this.amountResidual;
  }

  get isOutInvoice(): boolean {
    return this.moveType === EInvoiceMoveType.OUT_INVOICE;
  }

  get isOutRefund(): boolean {
    return this.moveType === EInvoiceMoveType.OUT_REFUND;
  }

  get canBePaid(): boolean {
    return (
      this.isOutInvoice &&
      this.isPosted() &&
      !this.isCancelled() &&
      this.isNotPaid() &&
      this.amountResidual > 0
    );
  }

  get hasReceipt(): boolean {
    return this.isOutInvoice && this.isPaid() && Boolean(this.consecutiveNumber);
  }

  get canViewInvoice(): boolean {
    return this.isOutInvoice && this.isPosted() && Boolean(this.consecutiveNumber);
  }

  get stateLabel(): string {
    if (this.isCancelled()) return "Cancelada";
    if (this.isPosted()) return "Publicada";
    if (this.isDraft()) return "Borrador";
    return "Desconocido";
  }

  get stateVariant(): "success" | "warning" | "info" | "error" | "default" {
    if (this.isCancelled()) return "error";
    if (this.isPosted()) return "success";
    if (this.isDraft()) return "warning";
    return "default";
  }

  get paymentStateLabel(): string {
    if (this.isPaid()) return "Pagada";
    if (this.isPartiallyPaid()) return "Parcial";
    if (this.isInPayment()) return "En proceso";
    if (this.isCreditSale()) return "Crédito";
    return "Pendiente";
  }

  get paymentStateVariant(): "success" | "warning" | "info" | "error" | "default" {
    if (this.isPaid()) return "success";
    if (this.isPartiallyPaid()) return "warning";
    if (this.isInPayment()) return "info";
    if (this.isCreditSale()) return "info";
    return "default";
  }
}
