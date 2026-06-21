import { EntityCollection, ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import {
  IReceiptExporter,
  type LabelMap,
  ReceiptPrintableResponse,
} from "@sincpro/mobile/domain/receipt";
import { mapped } from "@sincpro/mobile/infrastructure/database";
import { formatDate } from "@sincpro/mobile/tools/utils/date";
import { formatTwoDecimals } from "@sincpro/mobile/tools/utils/monetary";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import {
  DOCUMENT_TYPE_LABEL,
  EDocumentType,
} from "@sincpro/mobile-distribution/domain/electronic_invoice";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import {
  PaymentConfirmedForInvoiceEvent,
  PaymentCreditConfirmedForInvoiceEvent,
} from "@sincpro/mobile-distribution/domain/payment/events";
import { ITaxDetail, TaxCalculator } from "@sincpro/mobile-distribution/domain/product/tax";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { RouteOrder } from "@sincpro/mobile-distribution/domain/route/route_order";
import type {
  ITaxTotals,
  SaleOrder,
} from "@sincpro/mobile-distribution/domain/sale_order/sale_order";

import { InvoiceReadyToReconcileEvent } from "./events";
import { InvoiceLine, type IRemoteInvoiceLineDTO } from "./invoice_line";

export type InvoiceID = number;

export enum EInvoiceState {
  DRAFT = "draft",
  POSTED = "posted",
  CANCELLED = "cancelled",
}

export enum EInvoicePaymentState {
  NOT_PAID = "not_paid",
  IN_PAYMENT = "in_payment",
  PAID = "paid",
  PARTIAL = "partial",
  REVERSED = "reversed",
}

export enum EInvoiceMoveType {
  OUT_INVOICE = "out_invoice",
  IN_INVOICE = "in_invoice",
  OUT_REFUND = "out_refund",
  IN_REFUND = "in_refund",
  ENTRY = "entry",
}

export interface IRemoteInvoiceDTO {
  id: number;
  name: string;
  state: string;
  move_type: EInvoiceMoveType;
  payment_state: string;
  ref?: string;
  credit_id?: number;
  external_uuid?: string;
  invoice_origin?: string;
  invoice_date: string;
  date: string;
  amount_total: number;
  amount_untaxed: number;
  amount_tax: number;
  amount_residual: number;
  amount_residual_signed?: number;
  partner_id: {
    id: number;
    name: string;
    vat?: string;
  };
  invoice_line_ids: IRemoteInvoiceLineDTO[];
  tax_totals?: ITaxTotals;
  consecutivo_hacienda?: string;
  hacienda_clave_numerica?: string;
  currency_id?: {
    id: number;
    name: string;
    symbol: string;
  };
  journal_id?: number;
  distribution_route_plan_id?: number | false;
}

export class Invoice extends RemoteEntity implements IReceiptExporter {
  protected readonly REPOSITORY = EDistributionRepository.INVOICE;

  public name: string = "";
  public state: EInvoiceState = EInvoiceState.DRAFT;
  public moveType: EInvoiceMoveType = EInvoiceMoveType.OUT_INVOICE;
  public paymentState: EInvoicePaymentState = EInvoicePaymentState.NOT_PAID;
  public ref?: string;
  public invoiceOrigin?: string;
  public invoiceDate: string = "";
  public doneDate?: string;
  public amountTotal: number = 0;
  public amountUntaxed: number = 0;
  public amountTax: number = 0;
  public amountResidual: number = 0;
  public discount: number = 0;
  public percentageDiscount: number = 0;
  public customerId: number = 0;
  public customerName: string = "";
  public customerVat: string = "";
  public creditApplicationId?: number;
  public paymentTermDisplay?: string;
  public invoiceLines: InvoiceLine[] = [];
  public paymentIds: string[] = [];
  public currency: string = "CRC";
  public currencySymbol: string = "₡";
  public consecutiveNumber?: string;
  public numericKey?: string;
  public documentType?: EDocumentType;
  public journalId?: number;
  public metaOrderId?: string;
  public saleOrderId?: number;
  public saleOrderUUID?: string;
  public priceListId?: number;
  public routePlanId?: number;
  public externalUuidSynced: boolean = false;
  private originalResidual: number = 0;
  public penalizationAmount?: number;

  static override fromRemoteDTO(record: IRemoteInvoiceDTO): Invoice {
    const routePlanId =
      typeof record.distribution_route_plan_id === "number"
        ? record.distribution_route_plan_id
        : undefined;

    const data: Partial<Invoice> = {
      uuid: record.external_uuid,
      remoteId: record.id,
      routePlanId,
      name: record.name,
      state: record.state as EInvoiceState,
      moveType: record.move_type,
      paymentState: record.payment_state as EInvoicePaymentState,
      ref: record.ref,
      creditApplicationId: record.credit_id,
      invoiceOrigin: record.invoice_origin,
      invoiceDate: record.invoice_date || record.date,
      amountTotal: record.amount_total,
      amountUntaxed: record.amount_untaxed,
      amountTax: record.amount_tax,
      amountResidual: record.amount_residual_signed || record.amount_residual,
      customerId: record.partner_id?.id || 0,
      customerName: record.partner_id?.name || "",
      customerVat: record.partner_id?.vat || "",
      invoiceLines: (record.invoice_line_ids || []).map(InvoiceLine.fromRemoteDTO),
      currency: record.currency_id?.name || "CRC",
      currencySymbol: record.currency_id?.symbol || "₡",
      consecutiveNumber: record.consecutivo_hacienda,
      numericKey:
        record.hacienda_clave_numerica && record.hacienda_clave_numerica !== "false"
          ? record.hacienda_clave_numerica
          : undefined,
      journalId: record.journal_id,
      remoteRef: `account.move,${record.id}`,
      remoteState: ERemoteState.SYNCED,
    };

    const invoice = Invoice.obj<Invoice>(data);
    invoice.originalResidual = invoice.amountResidual;
    return invoice;
  }

  static override fromJSON<T = Invoice>(json: any): T {
    const baseData = super.fromJSON<Invoice>(json);

    if (baseData.invoiceLines && Array.isArray(baseData.invoiceLines)) {
      baseData.invoiceLines = baseData.invoiceLines.map((line: any) => {
        return InvoiceLine.obj(line);
      });
    }

    return baseData as T;
  }

  static fromSaleOrder(saleOrder: SaleOrder, documentType: EDocumentType): Invoice {
    const data: Partial<Invoice> = {
      saleOrderId: saleOrder.remoteId,
      saleOrderUUID: saleOrder.uuid,
      invoiceOrigin: saleOrder.name,
      state: EInvoiceState.DRAFT,
      moveType: EInvoiceMoveType.OUT_INVOICE,
      paymentState: EInvoicePaymentState.NOT_PAID,
      invoiceDate: new Date().toISOString().split("T")[0],
      amountTotal: saleOrder.amountTotal,
      amountUntaxed: saleOrder.amountUntaxed,
      amountTax: saleOrder.amountTax,
      amountResidual: saleOrder.amountTotal,
      discount: saleOrder.discount,
      percentageDiscount: saleOrder.percentageDiscount,
      customerId: saleOrder.customerId,
      customerName: saleOrder.customerName,
      customerVat: saleOrder.customerVat,
      invoiceLines: saleOrder.orderLines.map(InvoiceLine.fromSaleOrderLine),
      priceListId: saleOrder.priceListId,
      routePlanId: saleOrder.routeId,
      currency: saleOrder.currency,
      currencySymbol: saleOrder.currencySymbol,
      consecutiveNumber: saleOrder.consecutiveNumber,
      numericKey: saleOrder.numericKey,
      documentType: documentType,
      remoteState: ERemoteState.PENDING,
    };

    const invoice = Invoice.obj<Invoice>(data);
    invoice.originalResidual = invoice.amountResidual;
    return invoice;
  }

  @mapped(EDistributionRepository.CUSTOMER, "customerId", true)
  get customer(): Customer | null {
    return null;
  }

  @mapped(EDistributionRepository.ROUTE_ORDER, "metaOrderId")
  get metaOrder(): RouteOrder | null {
    return null;
  }

  @mapped(EDistributionRepository.PAYMENT, "paymentIds")
  get payments(): EntityCollection<Payment> {
    return new EntityCollection([]);
  }

  get syncedPayments(): EntityCollection<Payment> {
    return this.payments.filter((p) => Boolean(p.concretePayment?.remoteId));
  }

  get pendingPaymentsToSync(): EntityCollection<Payment> {
    return this.payments.filter((p) => !p.concretePayment?.remoteId);
  }

  get creditPayments(): EntityCollection<Payment> {
    return this.payments.filter((p) => p.isCreditPayment);
  }

  get nonCreditPayments(): Payment[] {
    return this.payments.filter((p) => !p.isCreditPayment).toArray();
  }

  get hasSyncedPayments(): boolean {
    return this.syncedPayments.length > 0;
  }

  get hasPendingPayments(): boolean {
    return this.pendingPaymentsToSync.length > 0;
  }

  get hasPayments(): boolean {
    return this.payments.length > 0;
  }

  isValidInvoice(): boolean {
    return this.state !== EInvoiceState.CANCELLED;
  }

  isPosted(): boolean {
    return this.state === EInvoiceState.POSTED;
  }

  isDraft(): boolean {
    return this.state === EInvoiceState.DRAFT;
  }

  isCancelled(): boolean {
    return this.state === EInvoiceState.CANCELLED;
  }

  isNotPaid(): boolean {
    return (
      this.paymentState === EInvoicePaymentState.NOT_PAID ||
      this.paymentState === EInvoicePaymentState.PARTIAL
    );
  }

  isPaid(): boolean {
    return (
      this.paymentState === EInvoicePaymentState.PAID ||
      this.paymentState === EInvoicePaymentState.IN_PAYMENT ||
      Boolean(this.creditApplicationId)
    );
  }

  get hasCredit(): boolean {
    return Boolean(this.creditApplicationId);
  }

  isPartiallyPaid(): boolean {
    return this.paymentState === EInvoicePaymentState.PARTIAL;
  }

  isInPayment(): boolean {
    return this.paymentState === EInvoicePaymentState.IN_PAYMENT;
  }

  get hasReceipt(): boolean {
    return this.isOutInvoice && this.isPaid() && Boolean(this.consecutiveNumber);
  }

  get isOutInvoice(): boolean {
    return this.moveType === EInvoiceMoveType.OUT_INVOICE;
  }

  getAmountPaid(): number {
    return this.amountTotal - this.amountResidual;
  }

  get routeId(): number | undefined {
    return this.metaOrder?.routePlanId;
  }

  setRoute(routeId: number): void {
    this.routePlanId = routeId;
  }

  addPaymentId(paymentUUID: string): void {
    if (!paymentUUID) return;
    if (!this.paymentIds) {
      this.paymentIds = [];
    }
    const paymentSet = new Set(this.paymentIds);
    if (!paymentSet.has(paymentUUID)) {
      this.paymentIds.push(paymentUUID);
    }
  }

  updatePaymentState(): void {
    const totalPaid = this.payments.reduce((sum, payment) => sum + payment.total, 0);
    this.amountResidual = this.originalResidual - totalPaid;
    this.computePaymentStateFromResidual();
  }

  private computePaymentStateFromResidual(): void {
    if (this.amountTotal <= 0) {
      this.paymentState = EInvoicePaymentState.PAID;
      return;
    }

    if (this.amountResidual <= 0) {
      this.paymentState = EInvoicePaymentState.PAID;
    } else if (this.amountResidual < this.amountTotal) {
      this.paymentState = EInvoicePaymentState.PARTIAL;
    } else {
      this.paymentState = EInvoicePaymentState.NOT_PAID;
    }
  }

  mergeWithRemote(remoteInvoice: Invoice): void {
    const localPaymentIds = this.paymentIds || [];

    if (remoteInvoice.remoteId) {
      this.remoteId = remoteInvoice.remoteId;
      this.remoteRef = `account.move,${remoteInvoice.remoteId}`;
      this.remoteState = ERemoteState.SYNCED;
    }
    if (remoteInvoice.name) {
      this.name = remoteInvoice.name;
    }
    if (remoteInvoice.state) {
      this.state = remoteInvoice.state as EInvoiceState;
    }
    if (remoteInvoice.paymentState) {
      this.paymentState = remoteInvoice.paymentState as EInvoicePaymentState;
    }
    if (remoteInvoice.amountResidual !== undefined) {
      this.amountResidual = remoteInvoice.amountResidual;
    }
    if (remoteInvoice.consecutiveNumber) {
      this.consecutiveNumber = remoteInvoice.consecutiveNumber;
    }
    if (remoteInvoice.numericKey) {
      this.numericKey = remoteInvoice.numericKey;
    }

    this.paymentIds = localPaymentIds;
  }

  payInvoice(payments: Payment[]): Invoice {
    this.doneDate = new Date().toISOString();
    const confirmedPayments: Payment[] = [];

    for (const payment of payments) {
      if (this.amountResidual <= 0) {
        break;
      }

      payment.setCustomer(this.customerId);
      if (this.routePlanId) {
        payment.setRoute(this.routePlanId);
      }

      const [postedPayment, residualPayment] = payment.confirmForInvoice(
        this.amountResidual,
        this.uuid,
        this.remoteId,
      );

      this.paymentIds.push(postedPayment.uuid);
      this.amountResidual -= postedPayment.total;
      confirmedPayments.push(postedPayment);

      this.addDomainEvent<PaymentConfirmedForInvoiceEvent>(PaymentConfirmedForInvoiceEvent, {
        record: postedPayment,
      });

      if (residualPayment) {
        this.paymentIds.push(residualPayment.uuid);
      }
    }

    this.computePaymentStateFromResidual();
    this.addDomainEvent<InvoiceReadyToReconcileEvent>(InvoiceReadyToReconcileEvent, {
      invoice: this,
      payments: confirmedPayments,
    });

    return this;
  }

  payInvoiceWithCredit(
    invoiceUUID: string,
    creditApplicationId: number,
    paymentTermDisplay?: string,
    authorizedPersonName?: string,
    authorizedPersonId?: number,
  ): Invoice {
    const payment = Payment.obj<Payment>({
      uuid: invoiceUUID,
    });

    payment.setCustomer(this.customerId);
    if (this.routePlanId) {
      payment.setRoute(this.routePlanId);
    }

    const creditPayment = payment.confirmCreditPaymentForInvoice(
      this.amountResidual,
      this.uuid,
      this.remoteId!,
      creditApplicationId,
      paymentTermDisplay,
      authorizedPersonName,
      authorizedPersonId,
    );

    this.paymentIds.push(creditPayment.uuid);
    this.amountResidual = 0;
    this.paymentTermDisplay = paymentTermDisplay;
    this.creditApplicationId = creditApplicationId;

    this.computePaymentStateFromResidual();
    this.doneDate = new Date().toISOString();

    this.addDomainEvent<PaymentCreditConfirmedForInvoiceEvent>(
      PaymentCreditConfirmedForInvoiceEvent,
      { record: creditPayment },
    );

    return this;
  }

  getTotalDiscount(): number {
    const lineDiscounts = this.invoiceLines.reduce(
      (sum, line) => sum + (line.discount || 0) * line.quantity,
      0,
    );
    return lineDiscounts + this.discount;
  }

  getTaxTotals(): ITaxDetail[] {
    const allDetails = this.invoiceLines.flatMap((line) => line.getTaxDetails());
    return TaxCalculator.consolidateTaxDetails(allDetails);
  }

  private generateReceiptData(userName?: string): Record<string, any> {
    const taxTotals = this.getTaxTotals();
    const taxBreakdownTable = taxTotals.map((t) => ({
      Impuesto: t.taxName,
      Monto: this.currencySymbol + formatTwoDecimals(t.taxAmount),
    }));

    const isCreditPayment = this.payments.some((p) => p.isCreditPayment === true);
    const paymentTypeText = isCreditPayment ? "Pago a crédito" : "Pago al contado";

    const totalDiscount = this.getTotalDiscount();

    const receiptData: Record<string, any> = {
      companyName:
        "Cooperativa de Servicios Multiples de Santa Rosa de Zarcero Coopebrisas R.L.",
      companyVat: "Ced. 3-004-051156-17",
      phone: "Tels.: 24633044 | 0",
      separator1: null,
      consecutiveNumber: this.consecutiveNumber,
      numericKey: this.numericKey || null,
      date: formatDate(
        this.doneDate || this.invoiceDate || new Date().toISOString(),
        "America/Costa_Rica",
        {
          locale: "es-CR",
          showTime: true,
        },
      ),
      customerName: this.customerVat + "-" + this.customerName || "Cliente Anónimo",
      customerRef: this.customer?.ref || "",
      separator2: null,
      lines: this.invoiceLines.map((line) => {
        const hasDiscount = line.discount && line.discount > 0;
        const basePrice = line.priceUnit;
        const priceAfterDiscount = basePrice * (1 - (line.discount || 0) / 100);

        const lineData: Record<string, string> = {
          Cantidad: formatTwoDecimals(line.quantity),
          Producto: line.name,
          "Precio Unit.": this.currencySymbol + formatTwoDecimals(basePrice),
          Impuestos: line.getTaxLabels().join(", "),
        };

        if (hasDiscount) {
          lineData["Desc."] = `-${line.discount!.toFixed(1)}%`;
        }

        lineData.Total =
          this.currencySymbol + formatTwoDecimals(priceAfterDiscount * line.quantity);

        return lineData;
      }),
      discount: this.currencySymbol + formatTwoDecimals(totalDiscount) || "0.00",
      amountTaxTotal: this.currencySymbol + formatTwoDecimals(this.amountTax),
      amountTotal: this.currencySymbol + formatTwoDecimals(this.amountTotal),
      separator3: null,
      taxBreakdown: taxBreakdownTable,
      taxBreakdownTotal: this.currencySymbol + formatTwoDecimals(this.amountTax),
      separator4: null,
      paymentType: paymentTypeText,
    };

    if (isCreditPayment && this.paymentTermDisplay) {
      receiptData.paymentTermDisplay = this.paymentTermDisplay;
    }

    const creditPayment = this.payments.find((p) => p.isCreditPayment === true);
    if (isCreditPayment && creditPayment?.authorizedPersonName) {
      receiptData.authorizedPersonName = creditPayment.authorizedPersonName;
      receiptData.signatureSpace1 = " ";
      receiptData.signatureSpace2 = " ";
      receiptData.signatureLine = "________________________________";
      receiptData.signatureLabel = "Firma del autorizado";
    }

    receiptData.beforeLegend = "GRACIAS POR SU PREFERENCIA";
    receiptData.legend =
      "Documento electrónico emitido conforme a la Resolución MH-DGT-RES-0027-2024 y Especificación V4.4. Validez garantizada mediante firma digital y clave numérica";

    if (userName) {
      receiptData.separator5 = null;
      receiptData.userName = `Generado por: ${userName}`;
    }

    return receiptData;
  }

  private getReceiptLabels(userName?: string): LabelMap {
    const resolveDocTypeLabel = (): string => {
      if (!this.consecutiveNumber) return "Factura electrónica";
      const digits = this.consecutiveNumber.replace(/\D/g, "");

      if (digits.length < 12) return "Factura electrónica";
      const docTypeCode = digits.slice(-12, -10) as EDocumentType;
      if (DOCUMENT_TYPE_LABEL[docTypeCode]) return DOCUMENT_TYPE_LABEL[docTypeCode];
      return "Factura electrónica";
    };

    const consecutiveLabel = resolveDocTypeLabel();
    const isCreditPayment = this.payments.some((p) => p.isCreditPayment === true);

    const labels: LabelMap = {
      companyName: false as const,
      companyVat: false as const,
      phone: false as const,
      separator1: "separator" as const,
      consecutiveNumber: consecutiveLabel,
      numericKey: { label: false, align: "right" as const },
      date: "Fecha",
      customerName: "Cliente",
      customerRef: "Codigo Cliente" as const,
      separator2: "separator" as const,
      lines: { label: "Detalle", renderAs: "table" as const },
      discount: "Descuentos",
      amountTaxTotal: "Impuestos",
      amountTotal: "TOTAL",
      separator3: "separator" as const,
      taxBreakdown: { label: "Desglose Impuestos", renderAs: "table" as const },
      taxBreakdownTotal: "Total",
      separator4: "separator" as const,
      paymentType: false as const,
    };

    if (isCreditPayment && this.paymentTermDisplay) {
      labels.paymentTermDisplay = "Plazo de pago";
    }

    const creditPayment = this.payments.find((p) => p.isCreditPayment === true);
    if (isCreditPayment && creditPayment?.authorizedPersonName) {
      labels.authorizedPersonName = "Autorizado por";
      labels.signatureSpace1 = false as const;
      labels.signatureSpace2 = false as const;
      labels.signatureLine = false as const;
      labels.signatureLabel = false as const;
    }

    labels.beforeLegend = false as const;
    labels.legend = false as const;

    if (userName) {
      labels.separator5 = "separator" as const;
      labels.userName = false as const;
    }

    return labels;
  }

  exportReceiptDefinition(userName?: string): ReceiptPrintableResponse {
    return {
      data: this.generateReceiptData(userName),
      labels: this.getReceiptLabels(userName),
    };
  }
}
