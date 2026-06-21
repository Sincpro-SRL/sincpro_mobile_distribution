import {
  ETaxType,
  ITaxSegment,
  TaxCalculator,
} from "@sincpro/mobile-distribution/domain/product/tax";

export interface IRemoteLineTaxDTO {
  id: number;
  name: string;
  display_name: string;
  amount: number;
  amount_type: string;
  sequence: number;
  include_base_amount: boolean;
  tax_group_id: {
    id: number;
    name: string;
    sequence: number;
  };
}

export interface IDocumentLine {
  quantity: number;
  priceUnit: number;
  priceTotal: number;
  priceSubtotal: number;
  discount: number;
  taxSegments?: ITaxSegment[];

  getSubtotalWithDiscount(): number;
  calculateTax(): number;
  getTaxAmount(): number;
}

function mapAmountType(amountType: string): ETaxType {
  switch (amountType) {
    case "percent":
      return ETaxType.PERCENT;
    case "fixed":
      return ETaxType.FIXED;
    case "division":
      return ETaxType.DIVISION;
    case "group":
      return ETaxType.GROUP;
    default:
      return ETaxType.PERCENT;
  }
}

export class DocumentLineCalculator {
  static convertRemoteTaxToSegment(tax: IRemoteLineTaxDTO): ITaxSegment {
    return {
      id: tax.id,
      name: tax.name,
      amount: tax.amount,
      type: mapAmountType(tax.amount_type),
      sequence: tax.sequence,
      includeBaseAmount: tax.include_base_amount,
      taxGroupId: tax.tax_group_id.id,
      taxGroupName: tax.tax_group_id.name,
      invoiceLabel: tax.display_name,
      priceIncluded: false,
      originalAmountType: tax.amount_type,
    };
  }

  static parseRemoteTaxes(taxIds: number[] | IRemoteLineTaxDTO[]): {
    ids: number[];
    segments?: ITaxSegment[];
  } {
    const ids = Array.isArray(taxIds)
      ? taxIds.map((t) => (typeof t === "number" ? t : t.id))
      : [];

    const segments =
      Array.isArray(taxIds) && taxIds.length > 0 && typeof taxIds[0] === "object"
        ? (taxIds as IRemoteLineTaxDTO[]).map(
            DocumentLineCalculator.convertRemoteTaxToSegment,
          )
        : undefined;

    return { ids, segments };
  }

  static calculateDiscountPercent(
    basePrice: number,
    unitPrice: number,
    maxDiscountCap?: number,
  ): number {
    if (basePrice <= 0 || unitPrice >= basePrice) {
      return 0;
    }
    const rawDiscount = Number((((basePrice - unitPrice) / basePrice) * 100).toFixed(2));
    if (typeof maxDiscountCap === "number" && maxDiscountCap >= 0) {
      return Math.min(rawDiscount, maxDiscountCap);
    }
    return rawDiscount;
  }

  static getSubtotalWithDiscount(
    quantity: number,
    priceUnit: number,
    discount: number,
  ): number {
    const discountMultiplier = 1 - (discount || 0) / 100;
    return priceUnit * quantity * discountMultiplier;
  }

  static calculateTaxAmount(
    quantity: number,
    priceUnit: number,
    discount: number,
    taxSegments?: ITaxSegment[],
    priceTotal?: number,
    priceSubtotal?: number,
  ): number {
    if (!taxSegments || taxSegments.length === 0) {
      return (priceTotal || 0) - (priceSubtotal || 0);
    }
    const baseAmount = DocumentLineCalculator.getSubtotalWithDiscount(
      quantity,
      priceUnit,
      discount,
    );
    const calc = TaxCalculator.calculateTaxSegments(baseAmount, taxSegments, quantity);
    return calc.totalTaxAmount;
  }
}
