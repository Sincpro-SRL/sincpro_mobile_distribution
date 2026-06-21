import { RemoteEntityCollection } from "@sincpro/mobile/domain";
import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import { mapped } from "@sincpro/mobile/infrastructure/database";
import { DocumentLineCalculator } from "@sincpro/mobile-distribution/domain/common";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { EDocumentType } from "@sincpro/mobile-distribution/domain/electronic_invoice";
import { InvoiceCreatedFromSaleOrderEvent } from "@sincpro/mobile-distribution/domain/invoice/events";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice/invoice";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import {
  IUpdateProductStockPayload,
  Product,
} from "@sincpro/mobile-distribution/domain/product";
import { ProductStockUpdatedEvent } from "@sincpro/mobile-distribution/domain/product/events";
import { PriceList } from "@sincpro/mobile-distribution/domain/product/price_list";
import { ITaxDetail, TaxCalculator } from "@sincpro/mobile-distribution/domain/product/tax";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { RouteOrder } from "@sincpro/mobile-distribution/domain/route/route_order";

import {
  SaleOrderConfirmedEvent,
  SaleOrderCreatedEvent,
  SaleOrderDeliveredEvent,
  SaleOrderNewInvoicesDetectedEvent,
  SaleOrderQuotationCreatedEvent,
  SaleOrderUpdatedEvent,
} from "./events";
import { IRemoteSaleOrderInvoiceDTO, SaleOrderInvoice } from "./sale_order_invoice";
import { IRemoteSaleOrderLineDTO, SaleOrderLine } from "./sale_order_line";

export type SaleOrderID = number;

export enum ESaleOrderType {
  QUOTATION = "quotation",
  SALE_ORDER = "sale",
}

export enum EOrderInvoiceStatus {
  UPSELLING = "upselling",
  INVOICED = "invoiced",
  TO_INVOICE = "to invoice",
  NO = "no",
}

export interface ITaxTotalsGroup {
  group_key: number;
  tax_group_id: number;
  tax_group_name: string;
  tax_group_amount: number;
  tax_group_base_amount: number;
  formatted_tax_group_amount: string;
  formatted_tax_group_base_amount: string;
  hide_base_amount: boolean;
}

export interface ITaxTotalsSubtotal {
  name: string;
  amount: number;
  formatted_amount: string;
}

export interface ITaxTotals {
  amount_untaxed: number;
  amount_total: number;
  formatted_amount_total: string;
  formatted_amount_untaxed: string;
  groups_by_subtotal: {
    [subtotalName: string]: ITaxTotalsGroup[];
  };
  subtotals: ITaxTotalsSubtotal[];
  subtotals_order: string[];
  display_tax_base: boolean;
}

export interface ITimelineStep {
  id: string;
  status: string;
  date: string;
  completed: boolean;
  current?: boolean;
  invoices?: SaleOrderInvoice[];
}

export enum ESaleOrderPaymentState {
  NOT_PAID = "not_paid",
  PARTIAL = "partial",
  PAID = "paid",
  IN_PAYMENT = "in_payment",
}

export enum ESaleOrderStatus {
  DRAFT = "draft",
  READY_TO_DELIVER = "ready_to_deliver",
  PARTIAL = "partial",
  DONE = "done",
  CANCEL = "cancel",
}

export interface IRemoteSaleOrderDTO {
  id: number;
  name: string;
  state: string;
  date_order: string;
  invoice_status: EOrderInvoiceStatus;
  amount_total: number;
  amount_untaxed: number;
  amount_tax: number;
  created_in_route_plan_id?: number;
  external_uuid?: string;
  origin?: string;
  partner_id: {
    id: number;
    name: string;
    vat?: string;
  };
  order_line: IRemoteSaleOrderLineDTO[];
  invoice_ids?: IRemoteSaleOrderInvoiceDTO[];
  tax_totals?: ITaxTotals;
  currency_id?: {
    id: number;
    name: string;
    symbol: string;
  };
}

// @ts-expect-error - Static fromJSON signature differs from base class intentionally for type safety
export class SaleOrder extends RemoteEntity {
  protected readonly REPOSITORY = EDistributionRepository.SALE_ORDER;

  public name: string = "";
  public state: string = "";
  public orderType: ESaleOrderType = ESaleOrderType.QUOTATION;
  public status: ESaleOrderStatus = ESaleOrderStatus.DRAFT;
  public dateOrder: string = "";
  public doneDate?: string;
  public scheduledDate: string = new Date().toISOString().split("T")[0];
  public amountTotal: number = 0;
  public amountUntaxed: number = 0;
  public amountTax: number = 0;
  public amountResidual: number = 0;
  public discount: number = 0;
  public percentageDiscount: number = 0;
  public customerId: number = 0;
  public customerName: string = "";
  public customerVat: string = "";
  public customerUUID?: string;
  public orderLines: SaleOrderLine[] = [];
  public displayInvoices: SaleOrderInvoice[] = [];
  public invoiceIds: number[] = [];
  public invoiceUUIDs: string[] = [];
  public paymentState: ESaleOrderPaymentState = ESaleOrderPaymentState.NOT_PAID;
  public priceListId?: number;
  public routeId?: number;
  public metaOrderId?: number;
  public currency: string = "CRC";
  public currencySymbol: string = "₡";

  private computeName(): SaleOrder {
    if (!this.remoteId || this.remoteId <= 0) {
      switch (this.orderType) {
        case ESaleOrderType.QUOTATION:
          this.name = `NUEVA/COTIZACION/${Math.abs(this.remoteId || 0) || this.uuid?.slice(-6)}`;
          break;
        case ESaleOrderType.SALE_ORDER:
          this.name = `NUEVA/ORDEN/${Math.abs(this.remoteId || 0) || this.uuid?.slice(-6)}`;
          break;
        default:
          this.name = "Borrador";
          break;
      }
    }
    return this;
  }

  private computeAmounts(): void {
    this.amountUntaxed = this.orderLines.reduce(
      (sum, line) => sum + line.getSubtotalWithDiscount(),
      0,
    );

    this.amountTax = this.orderLines.reduce((sum, line) => sum + line.getTaxAmount(), 0);

    this.amountTotal = this.amountUntaxed + this.amountTax;
    this.updatePaymentStateFromInvoices();
  }

  getTaxTotals(): ITaxDetail[] {
    const allDetails = this.orderLines.flatMap((line) => line.getTaxDetails());
    return TaxCalculator.consolidateTaxDetails(allDetails);
  }

  private updatePaymentStateFromInvoices(): void {
    if (this.displayInvoices.length === 0) {
      this.amountResidual = this.amountTotal;
      this.paymentState = ESaleOrderPaymentState.NOT_PAID;
      return;
    }

    const totalPaidFromInvoices = this.displayValidInvoices.reduce((sum, invoice) => {
      if (invoice.isPaid() || invoice.paymentState === "in_payment") {
        return sum + invoice.amountTotal;
      }
      if (invoice.isPartiallyPaid()) {
        return sum + invoice.getAmountPaid();
      }
      return sum;
    }, 0);

    this.amountResidual = Math.max(0, this.amountTotal - totalPaidFromInvoices);

    if (this.amountTotal <= 0) {
      this.paymentState = ESaleOrderPaymentState.NOT_PAID;
    } else if (this.amountResidual <= 0) {
      this.paymentState = ESaleOrderPaymentState.PAID;
    } else if (this.amountResidual < this.amountTotal) {
      this.paymentState = ESaleOrderPaymentState.PARTIAL;
    } else {
      this.paymentState = ESaleOrderPaymentState.NOT_PAID;
    }
  }

  static fromRemoteDTO(record: IRemoteSaleOrderDTO): SaleOrder {
    const invoices = (record.invoice_ids || []).map(SaleOrderInvoice.fromRemoteDTO);
    const invoiceUUIDs = invoices.map((inv) => inv.uuid);
    const remoteInvoiceIds = (record.invoice_ids || []).map((inv) => inv.id);

    const data: Partial<SaleOrder> = {
      uuid: record.external_uuid,
      remoteId: record.id,
      name: record.name,
      state: record.state,
      orderType:
        record.state === "sale" ? ESaleOrderType.SALE_ORDER : ESaleOrderType.QUOTATION,
      dateOrder: record.date_order,
      amountTotal: record.amount_total,
      amountUntaxed: record.amount_untaxed,
      amountTax: record.amount_tax,
      amountResidual: record.amount_total,
      customerId: record.partner_id?.id || 0,
      customerName: record.partner_id?.name || "",
      customerVat: record.partner_id?.vat || "",
      orderLines: (record.order_line || []).map(SaleOrderLine.fromRemoteDTO),
      displayInvoices: invoices,
      invoiceIds: remoteInvoiceIds,
      invoiceUUIDs: invoiceUUIDs,
      currency: record.currency_id?.name || "CRC",
      currencySymbol: record.currency_id?.symbol || "₡",
      remoteRef: `sale.order,${record.id}`,
      remoteState: ERemoteState.SYNCED,
      routeId: record.created_in_route_plan_id || undefined,
    };

    const saleOrder = SaleOrder.obj<SaleOrder>(data);

    if (remoteInvoiceIds.length > 0) {
      saleOrder.addDomainEvent<SaleOrderNewInvoicesDetectedEvent>(
        SaleOrderNewInvoicesDetectedEvent,
        { remoteInvoices: record.invoice_ids },
      );
    }

    return saleOrder;
  }

  static fromJSON(json: any): SaleOrder {
    const baseData = super.fromJSON(json) as SaleOrder;

    if (baseData.orderLines && Array.isArray(baseData.orderLines)) {
      baseData.orderLines = baseData.orderLines.map((line: any) => {
        return SaleOrderLine.obj(line);
      });
    }

    if (baseData.displayInvoices && Array.isArray(baseData.displayInvoices)) {
      baseData.displayInvoices = baseData.displayInvoices.map((invoice: any) => {
        return SaleOrderInvoice.obj(invoice);
      });
    }

    return baseData;
  }

  @mapped(EDistributionRepository.CUSTOMER, "customerId", true)
  get customer(): Customer | null {
    return null;
  }

  @mapped(EDistributionRepository.PRICE_LIST, "priceListId", true)
  get priceList(): PriceList | null {
    return null;
  }

  @mapped(EDistributionRepository.ROUTE_ORDER, "metaOrderId", true)
  get metaOrder(): RouteOrder | null {
    return null;
  }

  @mapped(EDistributionRepository.INVOICE, "invoiceUUIDs")
  get saleOrderInvoices(): RemoteEntityCollection<Invoice> {
    // @ts-ignore
    return [];
  }

  get hasDisplayInvoices(): boolean {
    return this.displayInvoices.length > 0;
  }

  get displayOutInvoices(): SaleOrderInvoice[] {
    return this.displayInvoices.filter((inv) => inv.isOutInvoice);
  }

  get displayCreditNotes(): SaleOrderInvoice[] {
    return this.displayInvoices.filter((inv) => inv.isOutRefund);
  }

  get displayPostedInvoices(): SaleOrderInvoice[] {
    return this.displayOutInvoices.filter((inv) => inv.isPosted());
  }

  get displayDraftInvoices(): SaleOrderInvoice[] {
    return this.displayOutInvoices.filter((inv) => inv.isDraft());
  }

  get displayPayableInvoices(): SaleOrderInvoice[] {
    return this.displayOutInvoices.filter((inv) => inv.canBePaid);
  }

  get displayPaidInvoices(): SaleOrderInvoice[] {
    return this.displayOutInvoices.filter((inv) => inv.isPaid());
  }

  get displayPartiallyPaidInvoices(): SaleOrderInvoice[] {
    return this.displayOutInvoices.filter((inv) => inv.isPartiallyPaid());
  }

  get hasDisplayPostedInvoices(): boolean {
    return this.displayPostedInvoices.length > 0;
  }

  get hasDisplayDraftInvoices(): boolean {
    return this.displayDraftInvoices.length > 0;
  }

  get displayValidInvoices(): SaleOrderInvoice[] {
    return this.displayOutInvoices.filter((inv) => inv.isValidInvoice());
  }

  get displayTotalInvoicedAmount(): number {
    const invoiceTotal = this.displayValidInvoices.reduce(
      (sum, inv) => sum + inv.amountTotal,
      0,
    );
    const creditNoteTotal = this.displayCreditNotes
      .filter((inv) => inv.isValidInvoice())
      .reduce((sum, inv) => sum + inv.amountTotal, 0);
    return invoiceTotal - creditNoteTotal;
  }

  get displayInvoiceCount(): number {
    return this.displayInvoices.length;
  }

  get hasDisplaySinglePayableInvoice(): boolean {
    return this.displayPayableInvoices.length === 1;
  }

  get hasDisplayMultiplePayableInvoices(): boolean {
    return this.displayPayableInvoices.length > 1;
  }

  get hasDisplayPaidInvoices(): boolean {
    return this.displayPaidInvoices.length > 0;
  }

  get canPayDirectly(): boolean {
    return this.isSaleOrder && this.hasDisplaySinglePayableInvoice;
  }

  get needsInvoiceSelection(): boolean {
    return this.isSaleOrder && this.hasDisplayMultiplePayableInvoices;
  }

  get displayTotalPendingAmount(): number {
    return Math.max(0, this.displayTotalInvoicedAmount - this.displayTotalPaidAmount);
  }

  get displayTotalPaidAmount(): number {
    const invoicePaid = this.displayPaidInvoices.reduce(
      (sum, inv) => sum + inv.amountTotal,
      0,
    );
    const creditNotePaid = this.displayCreditNotes
      .filter((inv) => inv.isPaid())
      .reduce((sum, inv) => sum + inv.amountTotal, 0);
    return invoicePaid - creditNotePaid;
  }

  get displayFirstPayableInvoice(): SaleOrderInvoice | undefined {
    return this.displayPayableInvoices[0];
  }

  get displayFirstPaidInvoice(): SaleOrderInvoice | undefined {
    return this.displayPaidInvoices[0];
  }

  get canViewReceipt(): boolean {
    return (
      this.hasDisplayPaidInvoices && Boolean(this.displayPaidInvoices[0]?.consecutiveNumber)
    );
  }

  get isQuotation(): boolean {
    return this.orderType === ESaleOrderType.QUOTATION;
  }

  get isSaleOrder(): boolean {
    return this.orderType === ESaleOrderType.SALE_ORDER;
  }

  get isCancelled(): boolean {
    return this.state === "cancel" || this.status === ESaleOrderStatus.CANCEL;
  }

  get isPaid(): boolean {
    return this.paymentState === ESaleOrderPaymentState.PAID;
  }

  get isPartiallyPaid(): boolean {
    return this.paymentState === ESaleOrderPaymentState.PARTIAL;
  }

  get isNotPaid(): boolean {
    return (
      this.paymentState === ESaleOrderPaymentState.NOT_PAID ||
      this.paymentState === ESaleOrderPaymentState.IN_PAYMENT
    );
  }

  get isInvoiced(): boolean {
    return this.hasDisplayPostedInvoices;
  }

  get isPlanned(): boolean {
    return this.metaOrderId != null && this.metaOrderId > 0;
  }

  get isDelivered(): boolean {
    return this.isPaid;
  }

  get shouldDeductStock(): boolean {
    if (this.isCancelled) return false;
    if (!this.isPlanned) return this.isSaleOrder;
    return this.isPaid;
  }

  get phone(): string {
    return this.metaOrder?.partnerPhone || this.metaOrder?.partnerMobile || "";
  }

  get address(): string {
    return this.metaOrder?.partnerStreet || "";
  }

  get coordinates(): { latitude: number; longitude: number } {
    return {
      latitude: this.metaOrder?.latitude || 0,
      longitude: this.metaOrder?.longitude || 0,
    };
  }

  get amountTaxTotal(): number {
    return this.amountTax;
  }

  get totalLineDiscounts(): number {
    return this.orderLines.reduce((sum, line) => {
      return sum + line.discountAmount;
    }, 0);
  }

  get totalDiscounts(): number {
    return this.totalLineDiscounts + (this.discount || 0);
  }

  get amountBeforeDiscount(): number {
    return this.orderLines.reduce((sum, line) => {
      return sum + line.baseAmount;
    }, 0);
  }

  get consecutiveNumber(): string | undefined {
    const validInvoice = this.displayValidInvoices.find((inv) =>
      Boolean(inv.consecutiveNumber),
    );
    return validInvoice?.consecutiveNumber;
  }

  get numericKey(): string | undefined {
    const validInvoice = this.displayValidInvoices.find((inv) => Boolean(inv.numericKey));
    return validInvoice?.numericKey;
  }

  createAsQuotation(customer?: Customer, routeRemoteId?: number): void {
    if (customer) {
      this.setCustomer(customer);
    }
    if (routeRemoteId) {
      this.routeId = routeRemoteId;
    }

    this.orderType = ESaleOrderType.QUOTATION;
    this.scheduleOrder();
    this.addDomainEventWithEntity<SaleOrderQuotationCreatedEvent>(
      SaleOrderQuotationCreatedEvent,
    );
  }

  createAsSaleOrder(customer?: Customer, routeRemoteID?: number): void {
    if (routeRemoteID) {
      this.routeId = routeRemoteID;
    }
    if (customer) {
      this.setCustomer(customer);
    }
    this.orderType = ESaleOrderType.SALE_ORDER;
    this.scheduleOrder();
    this.addDomainEvent<SaleOrderCreatedEvent>(SaleOrderCreatedEvent, {
      saleOrderUUID: this.uuid,
    });
    this.addDomainEvent<SaleOrderConfirmedEvent>(SaleOrderConfirmedEvent, {
      saleOrderUUID: this.uuid,
    });
  }

  setCustomer(customer: Customer): void {
    this.customerId = customer.remoteId || 0;
    this.customerName = customer.name || "";
    this.customerVat = customer.vat || "";
    this.customerUUID = customer.uuid;
    this.priceListId = customer.priceListId;
  }

  changeCustomer(customer: Customer, shouldReprice: boolean = false): void {
    const hadCustomer = this.customerId > 0;
    const priceListChanged = this.priceListId !== customer.priceListId;

    this.customerId = customer.remoteId || 0;
    this.customerName = customer.name || "";
    this.customerVat = customer.vat || "";
    this.customerUUID = customer.uuid;
    this.priceListId = customer.priceListId;

    if (shouldReprice && priceListChanged && this.priceListId) {
      this.repriceNonManualLines();
    }

    if (hadCustomer || shouldReprice) {
      this.addDomainEvent<SaleOrderUpdatedEvent>(SaleOrderUpdatedEvent, {
        saleOrderUUID: this.uuid,
      });
    }
  }

  needsRepriceForCustomer(newCustomer: Customer): boolean {
    if (this.orderLines.length === 0) return false;
    if (!newCustomer.priceListId) return false;
    if (this.priceListId === newCustomer.priceListId) return false;
    return this.hasNonManualLines();
  }

  hasNonManualLines(): boolean {
    return this.orderLines.some((line) => !line.isManuallyEdited);
  }

  repriceNonManualLines(): void {
    if (!this.priceList) {
      return;
    }

    let repriced = false;

    for (const line of this.orderLines) {
      if (!line.isManuallyEdited) {
        const product = line.product;

        if (product) {
          const newPrice = product.resolveUnitPrice(this.priceListId);
          if (newPrice !== line.priceUnit) {
            line.priceUnit = newPrice;
            line.calculateSubtotal();
            repriced = true;
          }
        }
      }
    }

    if (repriced) {
      this.computeAmounts();
    }
  }

  scheduleOrder(): SaleOrder {
    this.computeName();
    this.remoteRef = `sale.order,${this.remoteId}`;
    this.scheduledDate = new Date().toISOString().split("T")[0];
    return this;
  }

  addLine(line: SaleOrderLine): void {
    if (this.customer?.isExemptCustomer) {
      line.clearTaxes();
    }
    this.orderLines.push(line);
    this.computeAmounts();
  }

  addLineFromUnitPrice(
    product: Product,
    params: {
      quantity: number;
      baseUnitPrice: number;
      unitPrice: number;
      maxDiscountCap?: number;
      priceListName?: string;
    },
  ): void {
    const line = SaleOrderLine.fromProductWithDiscount(product, params);
    if (this.customer?.isExemptCustomer) {
      line.clearTaxes();
    }
    this.orderLines.push(line);
    this.computeAmounts();
  }

  addProduct(product: Product, quantity: number, unitPrice?: number): void {
    const basePrice = product.resolveUnitPrice(this.priceListId);
    const finalPrice = unitPrice ?? basePrice;

    this.addLineFromUnitPrice(product, {
      quantity,
      baseUnitPrice: basePrice,
      unitPrice: finalPrice,
      maxDiscountCap: this.customer?.maxDiscountApk,
      priceListName: this.priceList?.name,
    });
  }

  removeLine(lineId: number): void {
    this.orderLines = this.orderLines.filter((l) => l.id !== lineId);
    this.computeAmounts();
  }

  updateLine(lineId: number, quantity: number, priceUnit: number): void {
    const line = this.orderLines.find((l) => l.id === lineId);
    if (line) {
      const basePrice = line.originalPrice || line.priceUnit;
      line.quantity = quantity;
      line.discount = DocumentLineCalculator.calculateDiscountPercent(basePrice, priceUnit);
      line.markAsManuallyEdited();
      line.calculateSubtotal();
      this.computeAmounts();
    }
  }

  payOrderV2(payments: Payment[], documentType: EDocumentType): SaleOrder {
    this.doneDate = new Date().toISOString();

    const invoice = Invoice.fromSaleOrder(this, documentType);
    if (this.routeId) {
      invoice.setRoute(this.routeId);
    }

    invoice.payInvoice(payments);
    this.invoiceUUIDs = [...this.invoiceUUIDs, invoice.uuid];
    this.displayInvoices.push(SaleOrderInvoice.fromInvoice(invoice));

    this.updatePaymentStateFromInvoices();
    this.orderLines.forEach((line) => line.markAsDelivered());

    this.addDomainEvent<InvoiceCreatedFromSaleOrderEvent>(InvoiceCreatedFromSaleOrderEvent, {
      record: invoice,
    });
    this.addDomainEvent<ProductStockUpdatedEvent>(
      ProductStockUpdatedEvent,
      this.productStockUpdateEventPayload,
    );

    this.copyDomainEventsFrom(invoice);

    return this;
  }

  payOrderWithCreditV2(
    documentType: EDocumentType,
    creditApplicationId: number,
    paymentTermDisplay?: string,
    authorizedPersonName?: string,
    authorizedPersonId?: number,
  ): SaleOrder {
    if (this.orderType === ESaleOrderType.QUOTATION) {
      throw new Error("Cannot pay quotation with credit. Confirm the order first.");
    }

    this.doneDate = new Date().toISOString();

    const invoice = Invoice.fromSaleOrder(this, documentType);
    this.invoiceUUIDs = [...this.invoiceUUIDs, invoice.uuid];
    if (this.routeId) {
      invoice.setRoute(this.routeId);
    }

    invoice.payInvoiceWithCredit(
      invoice.uuid,
      creditApplicationId,
      paymentTermDisplay,
      authorizedPersonName,
      authorizedPersonId,
    );

    this.displayInvoices.push(SaleOrderInvoice.fromInvoice(invoice));

    this.updatePaymentStateFromInvoices();
    this.orderLines.forEach((line) => line.markAsDelivered());

    this.addDomainEvent<InvoiceCreatedFromSaleOrderEvent>(InvoiceCreatedFromSaleOrderEvent, {
      record: invoice,
    });

    this.copyDomainEventsFrom(invoice);

    return this;
  }

  markAsDone(): void {
    this.status = ESaleOrderStatus.DONE;
    this.doneDate = new Date().toISOString();
    this.orderLines.forEach((line) => line.markAsDelivered());

    const routeOrder = this.metaOrder;
    if (routeOrder) {
      routeOrder.markAsDelivered();
      this.addDomainEvent<SaleOrderDeliveredEvent>(SaleOrderDeliveredEvent, {
        order: this,
        routeOrder: routeOrder,
      });
    }
  }

  confirmOrder(
    remoteRouteId?: number,
    discount: number = 0,
    percentageDiscount?: number,
  ): void {
    if (remoteRouteId) {
      this.routeId = remoteRouteId;
    }

    this.discount = discount;
    if (percentageDiscount !== undefined && percentageDiscount > 0) {
      this.percentageDiscount = percentageDiscount;
      this.discount = (this.amountTotal * percentageDiscount) / 100;
    }

    this.computeAmounts();

    if (this.state === "draft" || this.orderType === ESaleOrderType.QUOTATION) {
      this.state = "sale";
      this.orderType = ESaleOrderType.SALE_ORDER;
      this.name = this.name.replace("COTIZACION", "ORDEN");
      this.addDomainEvent<SaleOrderConfirmedEvent>(SaleOrderConfirmedEvent, {
        saleOrderUUID: this.uuid,
      });
      this.addDomainEvent<ProductStockUpdatedEvent>(
        ProductStockUpdatedEvent,
        this.productStockUpdateEventPayload,
      );
    }
  }

  applyUpdate(updatedOrder: SaleOrder): SaleOrder {
    this.discount = updatedOrder.discount;
    this.percentageDiscount = updatedOrder.percentageDiscount;
    this.scheduledDate = updatedOrder.scheduledDate;
    this.orderLines = updatedOrder.orderLines;
    this.priceListId = updatedOrder.priceListId;
    this.customerId = updatedOrder.customerId;
    this.customerName = updatedOrder.customerName;
    this.customerVat = updatedOrder.customerVat;
    this.customerUUID = updatedOrder.customerUUID;
    this.metaOrderId = updatedOrder.metaOrderId;
    this.computeAmounts();
    this.remoteState = ERemoteState.PENDING;
    this.addDomainEvent<SaleOrderUpdatedEvent>(SaleOrderUpdatedEvent, {
      saleOrderUUID: this.uuid,
    });
    return this;
  }

  validateForUpdate(updatedOrder: SaleOrder): string[] {
    const errors: string[] = [];

    if (this.amountResidual <= 0 && this.amountTotal > 0) {
      errors.push("Cannot update a fully paid/invoiced order");
      return errors;
    }

    if (this.orderType === ESaleOrderType.SALE_ORDER && this.remoteId) {
      const existingProductIds = new Set(this.orderLines.map((l) => l.productId));
      const updatedProductIds = new Set(updatedOrder.orderLines.map((l) => l.productId));

      for (const productId of existingProductIds) {
        if (!updatedProductIds.has(productId)) {
          const hasQuantityZero = updatedOrder.orderLines.some(
            (l) => l.productId === productId && l.quantity === 0,
          );
          if (!hasQuantityZero) {
            errors.push(
              `Cannot delete product ${productId} from confirmed sale order. Set quantity to 0 instead.`,
            );
          }
        }
      }
    }

    return errors;
  }

  canBeUpdated(): boolean {
    return !(this.amountResidual <= 0 && this.amountTotal > 0);
  }

  getAllowedUpdateOperations(): {
    canAddLines: boolean;
    canRemoveLines: boolean;
    canModifyQuantities: boolean;
    canModifyPrices: boolean;
  } {
    const isPaid = this.amountResidual <= 0 && this.amountTotal > 0;
    const isQuotation = this.orderType === ESaleOrderType.QUOTATION;

    if (isPaid) {
      return {
        canAddLines: false,
        canRemoveLines: false,
        canModifyQuantities: false,
        canModifyPrices: false,
      };
    }

    if (isQuotation) {
      return {
        canAddLines: true,
        canRemoveLines: true,
        canModifyQuantities: true,
        canModifyPrices: true,
      };
    }

    return {
      canAddLines: true,
      canRemoveLines: false,
      canModifyQuantities: true,
      canModifyPrices: false,
    };
  }

  mergeWithRemote(remoteOrder: SaleOrder): SaleOrder {
    this.name = remoteOrder.name || this.name;
    this.orderType = remoteOrder.orderType || this.orderType;
    this.currency = remoteOrder.currency || this.currency;
    this.currencySymbol = remoteOrder.currencySymbol || this.currencySymbol;
    this.routeId = remoteOrder.routeId ?? this.routeId;

    if (remoteOrder.orderLines.length > 0) {
      this.orderLines = remoteOrder.orderLines;
    }

    if (remoteOrder.displayInvoices.length > 0) {
      this.displayInvoices = remoteOrder.displayInvoices;
      this.invoiceIds = remoteOrder.invoiceIds;
    }

    this.amountUntaxed = remoteOrder.amountUntaxed;
    this.amountTax = remoteOrder.amountTax;
    this.amountTotal = remoteOrder.amountTotal;

    this.computeAmounts();
    return this;
  }

  getTotalDiscount(): number {
    const lineDiscount = this.orderLines.reduce((sum, line) => {
      if (!line.discount || line.discount <= 0) return sum;
      const discountAmount = line.priceUnit * line.quantity * (line.discount / 100);
      return sum + discountAmount;
    }, 0);

    return Math.max(lineDiscount, this.discount || 0);
  }

  getLineTaxNames(lineId: string | number): string {
    const line = this.orderLines.find(
      (l) => String(l.id) === String(lineId) || String(l.remoteId) === String(lineId),
    );

    if (!line) return "Sin impuestos";

    const labels = line.getTaxLabels();
    return labels.length > 0 ? labels.join(", ") : "Sin impuestos";
  }

  remotePayload(): Record<string, any> {
    return {
      created_in_route_plan_id: this.routeId || false,
      partner_id: this.customerId,
      origin: this.uuid,
      external_uuid: this.uuid,
      order_line: this.orderLines.map((line) => line.remotePayload()),
    };
  }

  get productCount(): number {
    return this.orderLines.length;
  }

  get productStockUpdateEventPayload(): IUpdateProductStockPayload {
    return {
      type: "DECREASE",
      lines: this.orderLines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
    };
  }

  buildTimelineSteps(): ITimelineStep[] {
    const invoices = this.displayInvoices;
    const hasInvoices = invoices.length > 0;
    const allInvoicesPaid = hasInvoices && invoices.every((inv) => inv.isPaid());

    const isPending = [
      ESaleOrderPaymentState.NOT_PAID,
      ESaleOrderPaymentState.PARTIAL,
    ].includes(this.paymentState);

    if (isPending && this.dateOrder) {
      return [
        {
          id: "1",
          status: "Orden creada",
          date: this.dateOrder,
          completed: true,
          current: false,
        },
        {
          id: "2",
          status: hasInvoices ? `Facturada (${invoices.length})` : "Por facturar",
          date: hasInvoices ? this.scheduledDate : "Pendiente",
          completed: hasInvoices,
          current: hasInvoices && !allInvoicesPaid,
          invoices: hasInvoices ? invoices : undefined,
        },
        {
          id: "3",
          status: "Pagada",
          date: allInvoicesPaid ? this.doneDate || "" : "Pendiente",
          completed: allInvoicesPaid,
          current: allInvoicesPaid,
        },
      ];
    }

    return [
      {
        id: "1",
        status: "Orden creada",
        date: this.dateOrder || this.doneDate || "",
        completed: true,
        current: false,
      },
      {
        id: "2",
        status: hasInvoices ? `Facturada (${invoices.length})` : "Por facturar",
        date: this.doneDate || "",
        completed: hasInvoices,
        current: false,
        invoices: hasInvoices ? invoices : undefined,
      },
      {
        id: "3",
        status: "Pagada",
        date: this.doneDate || "",
        completed: allInvoicesPaid,
        current: allInvoicesPaid,
      },
    ];
  }
}
