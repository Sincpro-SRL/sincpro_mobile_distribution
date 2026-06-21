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

export interface IRemoteCreditNoteLineDTO {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  price_unit: number;
  price_total: number;
  price_subtotal: number;
  discount: number;
  tax_ids: number[] | IRemoteLineTaxDTO[];
}

export class CreditNoteLine extends RemoteEntity {
  public name: string = "";
  public productId: number = 0;
  public quantity: number = 0;
  public priceUnit: number = 0;
  public priceTotal: number = 0;
  public priceSubtotal: number = 0;
  public discount: number = 0;
  public taxIds: number[] = [];
  public taxSegments?: ITaxSegment[];

  static override fromRemoteDTO(dto: IRemoteCreditNoteLineDTO): CreditNoteLine {
    const { ids, segments } = DocumentLineCalculator.parseRemoteTaxes(dto.tax_ids);

    const data: Partial<CreditNoteLine> = {
      remoteId: dto.id,
      name: dto.name,
      productId: dto.product_id,
      quantity: dto.quantity,
      priceUnit: dto.price_unit,
      priceTotal: dto.price_total,
      priceSubtotal: dto.price_subtotal,
      discount: dto.discount,
      taxIds: ids,
      taxSegments: segments,
      remoteRef: `account.move.line,${dto.id}`,
      remoteState: ERemoteState.SYNCED,
    };

    return CreditNoteLine.obj<CreditNoteLine>(data);
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
