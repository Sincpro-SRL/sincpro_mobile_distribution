import { EntityCollection, ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import {
  IReceiptExporter,
  type LabelMap,
  ReceiptPrintableResponse,
} from "@sincpro/mobile/domain/receipt";
import { mapped } from "@sincpro/mobile/infrastructure/database";
import { formatDate } from "@sincpro/mobile/tools/utils/date";
import { formatTwoDecimals } from "@sincpro/mobile/tools/utils/monetary";
import { safeJsonParse } from "@sincpro/mobile/tools/utils/serializer";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import {
  DOCUMENT_TYPE_LABEL,
  EDocumentType,
  generateNumericKey,
} from "@sincpro/mobile-distribution/domain/electronic_invoice";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { PaymentConfirmedForCreditNoteEvent } from "@sincpro/mobile-distribution/domain/payment/events";
import { IUpdateProductStockPayload } from "@sincpro/mobile-distribution/domain/product";
import { ProductStockUpdatedEvent } from "@sincpro/mobile-distribution/domain/product/events";
import { ITaxDetail, TaxCalculator } from "@sincpro/mobile-distribution/domain/product/tax";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { RouteOrder } from "@sincpro/mobile-distribution/domain/route/route_order";
import { SaleOrder, SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";

import { CreditNoteLine, type IRemoteCreditNoteLineDTO } from "./credit_note_line";
import {
  CreditNoteCreatedEvent,
  CreditNotePostedEvent,
  CreditNoteReadyToReconcileEvent,
  CreditNoteStockReturnRequestedEvent,
} from "./events";

export type CreditNoteID = number;

export enum ECreditNotePaymentState {
  NOT_PAID = "not_paid",
  PARTIAL = "partial",
  PAID = "paid",
  IN_PAYMENT = "in_payment",
}

export enum ECreditNoteStatus {
  DRAFT = "draft",
  READY = "ready",
  DONE = "done",
  CANCEL = "cancel",
}

export interface IRemoteCreditNoteDTO {
  id: number;
  name: string;
  state: string;
  move_type: string;
  payment_state: string;
  invoice_date: string;
  invoice_origin?: string;
  external_uuid?: string;
  distribution_route_plan_id?: number | false;
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
  invoice_line_ids: IRemoteCreditNoteLineDTO[];
  reversed_entry_id?: {
    id: number;
    name: string;
  };
  consecutivo_hacienda?: string;
  hacienda_clave_numerica?: string;
  currency_id?: {
    id: number;
    name: string;
    symbol: string;
  };
}

export class CreditNote extends RemoteEntity implements IReceiptExporter {
  protected readonly REPOSITORY = EDistributionRepository.CREDIT_NOTE;

  public name: string = "";
  public state: string = "";
  public status: ECreditNoteStatus = ECreditNoteStatus.DRAFT;
  public moveType: string = "out_refund";
  public paymentState: ECreditNotePaymentState = ECreditNotePaymentState.NOT_PAID;
  public invoiceDate: string = "";
  public doneDate?: string;
  public scheduledDate: string = new Date().toISOString().split("T")[0];
  public amountTotal: number = 0;
  public amountUntaxed: number = 0;
  public amountTax: number = 0;
  public amountResidual: number = 0;
  public discount: number = 0;
  public customerId: number = 0;
  public customerName: string = "";
  public customerVat: string = "";
  public customerUUID?: string;
  public creditNoteLines: CreditNoteLine[] = [];
  public paymentIds: string[] = [];
  public reversedEntryId?: number;
  public reversedEntryName?: string;
  public originalOrderId?: number;
  public originalOrderUUID?: string;
  public routeId?: number;
  public metaOrderId?: string;
  public currency: string = "CRC";
  public currencySymbol: string = "₡";
  public consecutiveNumber?: string;
  public numericKey?: string;
  public returnPickingId?: number;
  public returnPickingName?: string;
  public hasPhysicalReturn: boolean = false;
  public externalUuidSynced: boolean = false;

  static override fromRemoteDTO(record: IRemoteCreditNoteDTO): CreditNote {
    interface IEmbeddedMetadata {
      originalOrderUUID?: string;
      originalOrderId?: number;
      customerUUID?: string;
      metaOrderId?: string;
    }

    let embeddedMetadata: IEmbeddedMetadata = {};
    if (record.invoice_origin) {
      try {
        embeddedMetadata = safeJsonParse(record.invoice_origin) as IEmbeddedMetadata;
      } catch {
        embeddedMetadata = {};
      }
    }

    const routeId =
      typeof record.distribution_route_plan_id === "number"
        ? record.distribution_route_plan_id
        : undefined;

    const data: Partial<CreditNote> = {
      remoteId: record.id,
      uuid: record.external_uuid || undefined,
      name: record.name,
      state: record.state,
      moveType: record.move_type,
      paymentState: record.payment_state as ECreditNotePaymentState,
      invoiceDate: record.invoice_date,
      amountTotal: Math.abs(record.amount_total),
      amountUntaxed: Math.abs(record.amount_untaxed),
      amountTax: Math.abs(record.amount_tax),
      amountResidual: Math.abs(record.amount_residual_signed || record.amount_residual),
      customerId: record.partner_id?.id || 0,
      customerName: record.partner_id?.name || "",
      customerVat: record.partner_id?.vat || "",
      customerUUID: embeddedMetadata.customerUUID,
      creditNoteLines: (record.invoice_line_ids || []).map(CreditNoteLine.fromRemoteDTO),
      reversedEntryId: record.reversed_entry_id?.id,
      reversedEntryName: record.reversed_entry_id?.name,
      originalOrderId: embeddedMetadata.originalOrderId,
      originalOrderUUID: embeddedMetadata.originalOrderUUID,
      metaOrderId: embeddedMetadata.metaOrderId,
      routeId,
      consecutiveNumber: record.consecutivo_hacienda,
      numericKey:
        record.hacienda_clave_numerica && record.hacienda_clave_numerica !== "false"
          ? record.hacienda_clave_numerica
          : undefined,
      currency: record.currency_id?.name || "CRC",
      currencySymbol: record.currency_id?.symbol || "₡",
      remoteRef: `account.move,${record.id}`,
      remoteState: ERemoteState.SYNCED,
    };

    const creditNote = CreditNote.obj<CreditNote>(data);
    creditNote.generateNumericKeyIfNeeded();
    return creditNote;
  }

  static override fromJSON<T = CreditNote>(json: any): T {
    const baseData = super.fromJSON<CreditNote>(json);

    if (baseData.creditNoteLines && Array.isArray(baseData.creditNoteLines)) {
      baseData.creditNoteLines = baseData.creditNoteLines.map((line: any) => {
        return CreditNoteLine.obj(line);
      });
    }

    return baseData as T;
  }

  static createFromOriginalOrder(
    originalOrder: SaleOrder,
    selectedLines: SaleOrderLine[],
  ): CreditNote {
    const creditNoteLines = selectedLines.map((line) => {
      const creditLine = CreditNoteLine.obj<CreditNoteLine>({
        productId: line.productId,
        name: line.name,
        quantity: line.quantity,
        priceUnit: line.priceUnit,
        discount: line.discount,
        taxSegments: line.taxSegments ? [...line.taxSegments] : undefined,
      });
      creditLine.calculateSubtotal();
      return creditLine;
    });

    const creditNote = CreditNote.obj<CreditNote>({
      customerId: originalOrder.customerId,
      customerName: originalOrder.customerName,
      customerVat: originalOrder.customerVat,
      customerUUID: originalOrder.customerUUID,
      routeId: originalOrder.routeId,
      currency: originalOrder.currency,
      currencySymbol: originalOrder.currencySymbol,
      originalOrderId: originalOrder.remoteId,
      originalOrderUUID: originalOrder.uuid,
      reversedEntryName: originalOrder.name,
      creditNoteLines,
    });

    creditNote.computeName();
    creditNote.computeAmounts();
    return creditNote;
  }

  private generateReceiptData(userName?: string): Record<string, any> {
    const taxTotals = this.getTaxTotals();
    const taxBreakdownTable = taxTotals.map((t) => ({
      Impuesto: t.taxName,
      Monto: this.currencySymbol + formatTwoDecimals(t.taxAmount),
    }));

    const totalDiscount = this.getTotalDiscount();

    const receiptData: Record<string, any> = {
      companyName:
        "Cooperativa de Servicios Multiples de Santa Rosa de Zarcero Coopebrisas R.L.",
      companyVat: "Ced. 3-004-051156-17",
      phone: "Tels.: 24633044 | 0",
      separator1: null,
      consecutiveNumber: this.consecutiveNumber,
      numericKey: this.numericKey || null,
      date: formatDate(this.doneDate || new Date().toISOString(), "America/Costa_Rica", {
        locale: "es-CR",
        showTime: true,
      }),
      customerName: this.customerVat + "-" + this.customerName || "Cliente Anónimo",
      separator2: null,
      lines: this.creditNoteLines.map((line) => {
        const hasDiscount = line.discount && line.discount > 0;
        const lineData: Record<string, string> = {
          Cantidad: formatTwoDecimals(line.quantity),
          Producto: line.name,
        };

        if (hasDiscount) {
          lineData["Desc."] = `-${line.discount!.toFixed(1)}%`;
        }

        lineData.Total =
          this.currencySymbol +
          formatTwoDecimals(
            line.priceUnit * (1 - (line.discount || 0) / 100) * line.quantity,
          );

        return lineData;
      }),
      discount: this.currencySymbol + formatTwoDecimals(totalDiscount) || "0.00",
      amountTaxTotal: this.currencySymbol + formatTwoDecimals(this.amountTax),
      amountTotal: this.currencySymbol + formatTwoDecimals(this.amountTotal),
      separator3: null,
      taxBreakdown: taxBreakdownTable,
      taxBreakdownTotal: this.currencySymbol + formatTwoDecimals(this.amountTax),
      separator4: null,
    };

    if (this.hasPayments) {
      const isCreditPayment = this.payments.some((p) => p.isCreditPayment === true);
      const paymentTypeText = isCreditPayment ? "Pago a crédito" : "Pago al contado";
      receiptData.paymentType = paymentTypeText;
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
      if (!this.consecutiveNumber) return "Nota de crédito electrónica";
      const digits = this.consecutiveNumber.replace(/\D/g, "");

      if (digits.length < 12) return "Nota de crédito electrónica";
      const docTypeCode = digits.slice(-12, -10) as EDocumentType;
      if (DOCUMENT_TYPE_LABEL[docTypeCode]) return DOCUMENT_TYPE_LABEL[docTypeCode];
      return "Nota de crédito electrónica";
    };

    const consecutiveLabel = resolveDocTypeLabel();
    const labels: LabelMap = {
      companyName: false as const,
      companyVat: false as const,
      phone: false as const,
      separator1: "separator" as const,
      consecutiveNumber: consecutiveLabel,
      numericKey: { label: false, align: "right" as const },
      date: "Fecha",
      customerName: "Cliente",
      separator2: "separator" as const,
      lines: { label: "Detalle", renderAs: "table" as const },
      discount: "Descuentos",
      amountTaxTotal: "Impuestos",
      amountTotal: "TOTAL",
      separator3: "separator" as const,
      taxBreakdown: { label: "Desglose Impuestos", renderAs: "table" as const },
      taxBreakdownTotal: "Total",
      separator4: "separator" as const,
    };

    if (this.hasPayments) {
      labels.paymentType = false as const;
    }

    labels.beforeLegend = false as const;
    labels.legend = false as const;

    if (userName) {
      labels.separator5 = "separator" as const;
      labels.userName = false as const;
    }

    return labels;
  }

  setCustomer(customer: Customer): void {
    this.customerId = customer.remoteId || 0;
    this.customerName = customer.name || "";
    this.customerVat = customer.vat || "";
    this.customerUUID = customer.uuid;
  }

  setRoute(routeId: number): void {
    this.routeId = routeId;
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

  computeName(): CreditNote {
    if (!this.remoteId || this.remoteId <= 0) {
      this.name = `CN-${this.originalOrderId || this.uuid?.slice(-6) || "BORRADOR"}`;
    }
    return this;
  }

  generateNumericKeyIfNeeded(): CreditNote {
    if (
      this.numericKey &&
      typeof this.numericKey === "string" &&
      this.numericKey.length > 0
    ) {
      return this;
    }

    if (!this.consecutiveNumber) {
      return this;
    }

    if (!this.remoteId || this.remoteId <= 0) {
      return this;
    }

    try {
      this.numericKey = generateNumericKey(
        this.doneDate || new Date(),
        this.consecutiveNumber,
      );
    } catch {
      // Silently fail if numeric key generation fails
    }

    return this;
  }

  computeAmounts(): void {
    this.amountUntaxed = this.creditNoteLines.reduce(
      (sum, line) => sum + line.getSubtotalWithDiscount(),
      0,
    );

    this.amountTax = this.creditNoteLines.reduce((sum, line) => sum + line.getTaxAmount(), 0);

    this.amountTotal = this.amountUntaxed + this.amountTax;
    const totalPaid = this.payments.reduce((sum, p) => sum + p.total, 0);
    this.amountResidual = this.amountTotal - totalPaid;

    this.updatePaymentState();
  }

  getTaxTotals(): ITaxDetail[] {
    const allDetails = this.creditNoteLines.flatMap((line) => line.getTaxDetails());
    return TaxCalculator.consolidateTaxDetails(allDetails);
  }

  payOrder(payments: Payment[], discount: number = 0): CreditNote {
    this.discount = discount;
    this.doneDate = new Date().toISOString();

    const confirmedPayments: Payment[] = [];

    for (const payment of payments) {
      const creditNoteAmount = Math.abs(this.amountResidual);

      payment.setCustomer(this.customerId, this.customerUUID);
      if (this.routeId) {
        payment.setRoute(this.routeId);
      }

      const [postedPayment, residualPayment] = payment.confirmForCreditNote(
        creditNoteAmount,
        this.uuid,
        this.remoteId,
      );

      this.paymentIds.push(postedPayment.uuid);
      this.amountResidual -= postedPayment.total;
      confirmedPayments.push(postedPayment);

      this.addDomainEvent<PaymentConfirmedForCreditNoteEvent>(
        PaymentConfirmedForCreditNoteEvent,
        { record: postedPayment },
      );

      if (residualPayment) {
        this.paymentIds.push(residualPayment.uuid);
      }
    }

    this.updatePaymentState();
    this.generateNumericKeyIfNeeded();

    this.addDomainEvent<CreditNoteReadyToReconcileEvent>(CreditNoteReadyToReconcileEvent, {
      creditNote: this,
      payments: confirmedPayments,
    });

    return this;
  }

  updatePaymentState(): void {
    if (this.amountResidual <= 0) {
      this.paymentState = ECreditNotePaymentState.PAID;
      this.status = ECreditNoteStatus.DONE;
    } else if (this.amountResidual > 0 && this.paymentIds.length > 0) {
      this.paymentState = ECreditNotePaymentState.PARTIAL;
    } else {
      this.paymentState = ECreditNotePaymentState.NOT_PAID;
      this.status = ECreditNoteStatus.READY;
    }
  }

  markAsDone(): void {
    this.status = ECreditNoteStatus.DONE;
    this.state = "posted";
    this.doneDate = new Date().toISOString();
  }

  markAsPosted(): void {
    this.status = ECreditNoteStatus.DONE;
    this.state = "posted";
    this.doneDate = new Date().toISOString();
    this.addDomainEvent<CreditNotePostedEvent>(CreditNotePostedEvent, {
      creditNoteUUID: this.uuid,
    });
    this.addDomainEvent<CreditNoteStockReturnRequestedEvent>(
      CreditNoteStockReturnRequestedEvent,
      { creditNoteUUID: this.uuid },
    );
    this.addDomainEvent<ProductStockUpdatedEvent>(
      ProductStockUpdatedEvent,
      this.productStockUpdateEventPayload,
    );
  }

  markAsCreated(): void {
    this.computeName();
    if (this.remoteId) {
      this.remoteRef = `account.move,${this.remoteId}`;
    }

    this.scheduledDate = new Date().toISOString().split("T")[0];
    this.addDomainEventWithEntity(CreditNoteCreatedEvent);
  }

  setPhysicalReturn(pickingId: number, pickingName: string): void {
    this.returnPickingId = pickingId;
    this.returnPickingName = pickingName;
    this.hasPhysicalReturn = true;
  }

  mergeWithRemote(remoteData: CreditNote): CreditNote {
    const localPaymentIds = this.paymentIds || [];

    if (remoteData.remoteId && remoteData.remoteId > 0) {
      this.remoteId = remoteData.remoteId;
      this.remoteRef = `account.move,${remoteData.remoteId}`;
    }
    if (remoteData.name) {
      this.name = remoteData.name;
    }
    if (remoteData.state) {
      this.state = remoteData.state;
    }
    if (remoteData.paymentState) {
      this.paymentState = remoteData.paymentState;
    }
    if (remoteData.consecutiveNumber) {
      this.consecutiveNumber = remoteData.consecutiveNumber;
    }
    if (remoteData.numericKey && remoteData.numericKey !== "false") {
      this.numericKey = remoteData.numericKey;
    }
    if (remoteData.reversedEntryId) {
      this.reversedEntryId = remoteData.reversedEntryId;
    }
    if (remoteData.reversedEntryName) {
      this.reversedEntryName = remoteData.reversedEntryName;
    }

    this.amountTotal = Math.abs(remoteData.amountTotal);
    this.amountTax = Math.abs(remoteData.amountTax);
    this.amountUntaxed = Math.abs(remoteData.amountUntaxed);
    if (remoteData.amountResidual !== undefined) {
      this.amountResidual = Math.abs(remoteData.amountResidual);
    }
    this.remoteState = ERemoteState.SYNCED;

    this.paymentIds = localPaymentIds;
    this.generateNumericKeyIfNeeded();
    return this;
  }

  getTotalDiscount(): number {
    const lineDiscount = this.creditNoteLines.reduce((sum, line) => {
      if (!line.discount || line.discount <= 0) return sum;
      const discountAmount = line.priceUnit * line.quantity * (line.discount / 100);
      return sum + discountAmount;
    }, 0);

    return Math.max(lineDiscount, this.discount || 0);
  }

  exportReceiptDefinition(userName?: string): ReceiptPrintableResponse {
    return {
      data: this.generateReceiptData(userName),
      labels: this.getReceiptLabels(userName),
    };
  }

  get embeddedMetadata() {
    return {
      originalOrderUUID: this.originalOrderUUID,
      originalOrderId: this.originalOrderId,
      customerUUID: this.customerUUID,
      metaOrderId: this.metaOrderId,
      returnPickingId: this.returnPickingId,
      returnPickingName: this.returnPickingName,
    };
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

  @mapped(EDistributionRepository.INVOICE, "reversedEntryId", true)
  get originalInvoice(): Invoice | null {
    return null;
  }

  get syncedPayments(): EntityCollection<Payment> {
    return this.payments.filter((p) => Boolean(p.concretePayment?.remoteId));
  }

  get pendingPaymentsToSync(): EntityCollection<Payment> {
    return this.payments.filter((p) => !p.concretePayment?.remoteId);
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

  get productStockUpdateEventPayload(): IUpdateProductStockPayload {
    return {
      type: "INCREASE",
      lines: this.creditNoteLines.map((line) => {
        return {
          productId: line.productId,
          quantity: line.quantity,
        };
      }),
    };
  }
}
