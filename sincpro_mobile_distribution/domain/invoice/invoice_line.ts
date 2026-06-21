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
import type { SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order/sale_order_line";

export type IRemoteInvoiceLineTaxDTO = IRemoteLineTaxDTO;

export interface IRemoteInvoiceLineDTO {
  id: number;
  name: string;
  product_id: number;
  product_uom_id?: {
    id: number;
    name: string;
  };
  quantity: number;
  price_unit: number;
  price_total: number;
  price_subtotal: number;
  discount?: number;
  tax_ids: number[] | IRemoteInvoiceLineTaxDTO[];
}

export class InvoiceLine extends RemoteEntity {
  public id: number = 0;
  public name: string = "";
  public productId: number = 0;
  public quantity: number = 0;
  public priceUnit: number = 0;
  public priceTotal: number = 0;
  public priceSubtotal: number = 0;
  public discount: number = 0;
  public taxIds: number[] = [];
  public taxSegments?: ITaxSegment[];

  static override fromRemoteDTO(dto: IRemoteInvoiceLineDTO): InvoiceLine {
    const { ids, segments } = DocumentLineCalculator.parseRemoteTaxes(dto.tax_ids);

    const data: Partial<InvoiceLine> = {
      remoteId: dto.id,
      id: dto.id,
      name: dto.name,
      productId: dto.product_id,
      quantity: dto.quantity,
      priceUnit: dto.price_unit,
      priceTotal: dto.price_total,
      priceSubtotal: dto.price_subtotal,
      discount: dto.discount || 0,
      taxIds: ids,
      taxSegments: segments,
      remoteRef: `account.move.line,${dto.id}`,
      remoteState: ERemoteState.SYNCED,
    };

    return InvoiceLine.obj<InvoiceLine>(data);
  }

  static fromSaleOrderLine(line: SaleOrderLine): InvoiceLine {
    const data: Partial<InvoiceLine> = {
      id: line.id,
      name: line.name,
      productId: line.productId,
      quantity: line.quantity,
      priceUnit: line.priceUnit,
      priceTotal: line.priceTotal,
      priceSubtotal: line.priceSubtotal,
      discount: line.discount,
      taxIds: [...line.taxIds],
      taxSegments: line.taxSegments ? [...line.taxSegments] : undefined,
      remoteState: ERemoteState.PENDING,
    };

    return InvoiceLine.obj<InvoiceLine>(data);
  }

  @mapped(EDistributionRepository.PRODUCT, "productId", true)
  get product(): Product | null {
    return null;
  }

  calculateSubtotal(): void {
    const discountMultiplier = 1 - this.discount / 100;
    this.priceSubtotal = this.priceUnit * this.quantity * discountMultiplier;
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
}
