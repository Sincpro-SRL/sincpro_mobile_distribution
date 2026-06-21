export enum ETaxType {
  PERCENT = "percent",
  FIXED = "fixed",
  DIVISION = "division",
  GROUP = "group",
}

export interface IRawTax {
  id: number;
  name: string;
  invoice_label?: string;
  display_name?: string;
  amount: number;
  amount_type: string;
  sequence: number;
  price_include: boolean;
  include_base_amount: boolean;
  tax_group_id?: {
    id: number;
    name: string;
    sequence: number;
  };
}

export interface ITaxSegment {
  id: number;
  name: string;
  amount: number;
  type: ETaxType;
  sequence: number;
  includeBaseAmount: boolean;
  taxGroupId?: number;
  taxGroupName?: string;
  invoiceLabel?: string;
  priceIncluded: boolean;
  originalAmountType: string;
}

export interface ITaxCalculation {
  baseAmount: number;
  segments: ITaxSegmentCalculation[];
  totalTaxAmount: number;
  totalAmount: number;
  breakdown: ITaxBreakdown[];
}

export interface ITaxSegmentCalculation {
  segment: ITaxSegment;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface ITaxBreakdown {
  taxGroupId: number;
  taxGroupName: string;
  invoiceLabel?: string;
  baseAmount: number;
  taxAmount: number;
  percentage: number;
  formattedTaxAmount: string;
  formattedBaseAmount: string;
}

/**
 * Simple tax detail for display purposes
 * Used by lines and parent documents
 */
export interface ITaxDetail {
  taxGroupId: number;
  taxName: string;
  baseAmount: number;
  taxAmount: number;
}

export interface IOrderLineTaxDetail {
  orderLineId: number | string;
  baseAmount: number;
  taxCalculation: ITaxCalculation;
}

/**
 * TaxCalculator - Service for calculating taxes
 * This is a domain service (not an entity or value object)
 */
export class TaxCalculator {
  /**
   * Calculates taxes for a given base amount using tax segments
   */
  static calculateTaxSegments(
    baseAmount: number,
    taxSegments: ITaxSegment[],
    quantity: number = 1,
  ): ITaxCalculation {
    const sortedSegments = [...taxSegments].sort((a, b) => a.sequence - b.sequence);

    const segmentCalculations: ITaxSegmentCalculation[] = [];
    const breakdown: ITaxBreakdown[] = [];
    let currentBaseAmount = baseAmount;
    let totalTaxAmount = 0;

    const groupedSegments = new Map<
      number,
      { segments: ITaxSegment[]; totalAmount: number }
    >();

    for (const segment of sortedSegments) {
      if (segment.type === ETaxType.GROUP) {
        continue;
      }

      const segmentBaseAmount = segment.includeBaseAmount ? currentBaseAmount : baseAmount;
      let segmentTaxAmount = 0;

      switch (segment.type) {
        case ETaxType.PERCENT:
          segmentTaxAmount = (segmentBaseAmount * segment.amount) / 100;
          break;
        case ETaxType.DIVISION:
          segmentTaxAmount =
            segmentBaseAmount - segmentBaseAmount / (1 + segment.amount / 100);
          break;
        case ETaxType.FIXED:
          segmentTaxAmount = segment.amount * quantity;
          break;
      }

      const segmentTotalAmount = segmentBaseAmount + segmentTaxAmount;

      segmentCalculations.push({
        segment,
        baseAmount: segmentBaseAmount,
        taxAmount: segmentTaxAmount,
        totalAmount: segmentTotalAmount,
      });

      if (segment.taxGroupId) {
        if (!groupedSegments.has(segment.taxGroupId)) {
          groupedSegments.set(segment.taxGroupId, {
            segments: [],
            totalAmount: 0,
          });
        }
        const group = groupedSegments.get(segment.taxGroupId)!;
        group.segments.push(segment);
        group.totalAmount += segmentTaxAmount;
      }

      totalTaxAmount += segmentTaxAmount;

      if (segment.includeBaseAmount) {
        currentBaseAmount = segmentTotalAmount;
      }
    }

    groupedSegments.forEach((group, taxGroupId) => {
      const firstSegment = group.segments[0];
      const totalPercentage = group.segments.reduce((sum, seg) => {
        return seg.type === ETaxType.PERCENT || seg.type === ETaxType.DIVISION
          ? sum + seg.amount
          : sum;
      }, 0);

      breakdown.push({
        taxGroupId,
        taxGroupName: firstSegment.taxGroupName || `Grupo ${taxGroupId}`,
        invoiceLabel: firstSegment.invoiceLabel,
        baseAmount,
        taxAmount: group.totalAmount,
        percentage: totalPercentage,
        formattedTaxAmount: `₡${group.totalAmount.toFixed(2)}`,
        formattedBaseAmount: `₡${baseAmount.toFixed(2)}`,
      });
    });

    return {
      baseAmount,
      segments: segmentCalculations,
      totalTaxAmount,
      totalAmount: baseAmount + totalTaxAmount,
      breakdown,
    };
  }

  /**
   * Creates tax breakdown from Odoo tax_totals response
   */
  static createBreakdownFromOdooTaxTotals(taxTotals: any): ITaxBreakdown[] {
    const breakdown: ITaxBreakdown[] = [];

    if (!taxTotals?.groups_by_subtotal) {
      return breakdown;
    }

    for (const [, groups] of Object.entries(taxTotals.groups_by_subtotal)) {
      if (!Array.isArray(groups)) {
        continue;
      }

      for (const group of groups) {
        if (!group.tax_group_id || group.tax_group_amount === undefined) {
          continue;
        }

        breakdown.push({
          taxGroupId: group.tax_group_id,
          taxGroupName: group.tax_group_name || `Impuesto ${group.tax_group_id}`,
          invoiceLabel: group.invoice_label,
          baseAmount: group.tax_group_base_amount || 0,
          taxAmount: group.tax_group_amount,
          percentage:
            group.tax_group_base_amount > 0
              ? (group.tax_group_amount / group.tax_group_base_amount) * 100
              : 0,
          formattedTaxAmount:
            group.formatted_tax_group_amount || `₡${group.tax_group_amount.toFixed(2)}`,
          formattedBaseAmount:
            group.formatted_tax_group_base_amount ||
            `₡${(group.tax_group_base_amount || 0).toFixed(2)}`,
        });
      }
    }

    return breakdown;
  }

  /**
   * Calculates the total tax factor (percentage) from tax segments
   */
  static calculateTotalTaxFactor(taxSegments: ITaxSegment[]): number {
    return taxSegments.reduce((total, segment) => {
      if (segment.type === ETaxType.PERCENT || segment.type === ETaxType.DIVISION) {
        return total + segment.amount;
      }
      return total;
    }, 0);
  }

  /**
   * Get tax details from tax segments - simple format for display
   */
  static getTaxDetails(
    baseAmount: number,
    taxSegments: ITaxSegment[],
    quantity: number = 1,
  ): ITaxDetail[] {
    if (!taxSegments || taxSegments.length === 0) return [];

    const calc = TaxCalculator.calculateTaxSegments(baseAmount, taxSegments, quantity);
    return calc.breakdown.map((b) => ({
      taxGroupId: b.taxGroupId,
      taxName: b.invoiceLabel || b.taxGroupName,
      baseAmount: b.baseAmount,
      taxAmount: b.taxAmount,
    }));
  }

  /**
   * Get tax labels from tax segments
   */
  static getTaxLabels(taxSegments?: ITaxSegment[]): string[] {
    if (!taxSegments || taxSegments.length === 0) return [];
    return taxSegments.map((s) => s.invoiceLabel || s.name);
  }

  /**
   * Consolidate tax details from multiple lines into totals
   */
  static consolidateTaxDetails(allDetails: ITaxDetail[]): ITaxDetail[] {
    const grouped = new Map<number, ITaxDetail>();

    for (const detail of allDetails) {
      const existing = grouped.get(detail.taxGroupId);
      if (existing) {
        existing.baseAmount += detail.baseAmount;
        existing.taxAmount += detail.taxAmount;
      } else {
        grouped.set(detail.taxGroupId, { ...detail });
      }
    }

    return Array.from(grouped.values());
  }
}
