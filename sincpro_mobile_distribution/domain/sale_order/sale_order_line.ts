import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import { mapped } from "@sincpro/mobile/infrastructure/database";
import {
  DocumentLineCalculator,
  type IRemoteLineTaxDTO,
} from "@sincpro/mobile-distribution/domain/common";
import { Product } from "@sincpro/mobile-distribution/domain/product";
import {
  ITaxDetail,
  ITaxSegment,
  TaxCalculator,
} from "@sincpro/mobile-distribution/domain/product/tax";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";

export enum EOrderLineOperation {
  ADD = "ADD",
  UPDATE = "UPDATE",
}

export interface IOrderLineChangePayload {
  product: Product;
  quantity: number;
  effectivePrice: number;
  mode: EOrderLineOperation;
  lineId?: number;
}

export type IRemoteSaleOrderLineTaxDTO = IRemoteLineTaxDTO;

export interface IRemoteSaleOrderLineDTO {
  id: number;
  name: string;
  product_id: number;
  product_uom?: {
    id: number;
    name: string;
  };
  product_uom_qty: number;
  price_unit: number;
  price_total: number;
  price_subtotal: number;
  discount: number;
  qty_delivered?: number;
  tax_id: number[] | IRemoteSaleOrderLineTaxDTO[];
  currency_id?: {
    id: number;
    name: string;
    symbol: string;
  };
}

export class SaleOrderLine extends RemoteEntity {
  public id: number = 0;
  public name: string = "";
  public productId: number = 0;
  public quantity: number = 0;
  public priceUnit: number = 0;
  public priceTotal: number = 0;
  public priceSubtotal: number = 0;
  public discount: number = 0;
  public originalPrice: number = 0;
  public priceListName?: string;
  public taxIds: number[] = [];
  public taxSegments?: ITaxSegment[];
  public deliveredQuantity: number = 0;
  public isManuallyEdited: boolean = false;

  static override fromRemoteDTO(dto: IRemoteSaleOrderLineDTO): SaleOrderLine {
    const { ids, segments } = DocumentLineCalculator.parseRemoteTaxes(dto.tax_id);

    const data: Partial<SaleOrderLine> = {
      remoteId: dto.id,
      id: dto.id,
      name: dto.name,
      productId: dto.product_id,
      quantity: dto.product_uom_qty,
      priceUnit: dto.price_unit,
      priceTotal: dto.price_total,
      priceSubtotal: dto.price_subtotal,
      discount: dto.discount,
      originalPrice: dto.price_unit,
      taxIds: ids,
      taxSegments: segments,
      deliveredQuantity: dto.qty_delivered || 0,
      isManuallyEdited: false,
      remoteRef: `sale.order.line,${dto.id}`,
      remoteState: ERemoteState.SYNCED,
    };

    return SaleOrderLine.obj<SaleOrderLine>(data);
  }

  static fromProduct(product: Product, quantity: number, priceUnit: number): SaleOrderLine {
    const line = SaleOrderLine.obj<SaleOrderLine>({});
    line.productId = product.remoteId || 0;
    line.name = product.name;
    line.quantity = quantity;
    line.priceUnit = priceUnit;
    line.originalPrice = priceUnit;
    line.discount = 0;
    line.isManuallyEdited = false;
    line.calculateSubtotal();
    return line;
  }

  static fromProductWithDiscount(
    product: Product,
    params: {
      quantity: number;
      baseUnitPrice: number;
      unitPrice: number;
      maxDiscountCap?: number;
      priceListName?: string;
    },
  ): SaleOrderLine {
    const { quantity, baseUnitPrice, unitPrice, maxDiscountCap, priceListName } = params;
    const isManual = unitPrice !== baseUnitPrice;
    const discountPercent = DocumentLineCalculator.calculateDiscountPercent(
      baseUnitPrice,
      unitPrice,
      maxDiscountCap,
    );

    const line = SaleOrderLine.obj<SaleOrderLine>({});
    line.productId = product.remoteId || 0;
    line.name = product.name;
    line.quantity = quantity;
    line.priceUnit = baseUnitPrice;
    line.originalPrice = baseUnitPrice;
    line.discount = discountPercent;
    line.isManuallyEdited = isManual;
    line.priceListName = !isManual ? priceListName : undefined;
    line.taxSegments = product.taxSegments;
    line.calculateSubtotal();
    return line;
  }

  @mapped(EDistributionRepository.PRODUCT, "productId", true)
  get product(): Product | null {
    return null;
  }

  get effectiveUnitPrice(): number {
    return this.priceUnit * (1 - this.discount / 100);
  }

  get discountAmount(): number {
    return this.baseAmount * (this.discount / 100);
  }

  get baseAmount(): number {
    return this.priceUnit * this.quantity;
  }

  calculateSubtotal(): void {
    const discountMultiplier = 1 - this.discount / 100;
    this.priceSubtotal = this.priceUnit * this.quantity * discountMultiplier;
    this.priceTotal = this.priceSubtotal;
  }

  updateQuantityAndPrice(quantity: number, priceUnit: number): void {
    this.quantity = quantity;
    this.priceUnit = priceUnit;
    this.calculateSubtotal();
  }

  markAsManuallyEdited(): void {
    this.isManuallyEdited = true;
  }

  markAsDelivered(): void {
    this.deliveredQuantity = this.quantity;
  }

  getSubtotalWithDiscount(): number {
    return DocumentLineCalculator.getSubtotalWithDiscount(
      this.quantity,
      this.priceUnit,
      this.discount,
    );
  }

  calculateTax(): number {
    return DocumentLineCalculator.calculateTaxAmount(
      this.quantity,
      this.priceUnit,
      this.discount,
      this.taxSegments,
      this.priceTotal,
      this.priceSubtotal,
    );
  }

  getTaxAmount(): number {
    return this.calculateTax();
  }

  getTaxLabels(): string[] {
    return TaxCalculator.getTaxLabels(this.taxSegments);
  }

  getTaxDetails(): ITaxDetail[] {
    if (!this.taxSegments || this.taxSegments.length === 0) return [];
    const baseAmount = this.getSubtotalWithDiscount();
    return TaxCalculator.getTaxDetails(baseAmount, this.taxSegments, this.quantity);
  }

  clearTaxes(): void {
    this.taxSegments = [];
    this.taxIds = [];
  }

  remotePayload(): [number, number, Record<string, any>] {
    const linePayload: Record<string, any> = {
      product_id: this.productId,
      product_uom_qty: this.quantity,
      price_unit: this.priceUnit,
      discount: this.discount || 0,
    };

    if (!this.taxIds || this.taxIds.length === 0) {
      linePayload.tax_id = [[5, 0, 0]];
    }

    return [0, 0, linePayload];
  }
}
