import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import { mapped } from "@sincpro/mobile/infrastructure/database";

import { EDistributionRepository } from "../repository";
import { type IProductPricingInfo, PriceList, type PriceListID } from "./price_list";
import { ETaxType, type IRawTax, type ITaxSegment, TaxCalculator } from "./tax";

export type ProductID = number;

export enum EProductStockFilter {
  ALL = "all",
  IN_STOCK = "in_stock",
  OUT_OF_STOCK = "out_of_stock",
}

export interface IRemoteProductDTO {
  id: number;
  name: string;
  default_code?: string;
  barcode?: string;
  list_price: number;
  categ_id?: {
    id: number;
    name: string;
  };
  description_sale?: string;
  image_1920?: string;
  taxes_id?: IRawTax[];
  uom_id?: {
    id: number;
    name: string;
  };
  cabys_code?: string;
}

export interface IUpdateProductStockPayload {
  type: "INCREASE" | "DECREASE";
  lines: {
    productId: number;
    quantity: number;
  }[];
}

// @ts-expect-error - Static fromJSON signature differs from base class intentionally for type safety
export class Product extends RemoteEntity {
  protected readonly REPOSITORY = EDistributionRepository.PRODUCT;

  public name: string = "";
  public code: string = "";
  public barcode: string = "";
  public price: number = 0;
  public category: string = "";
  public description: string = "";
  public imageUrl: string = "";
  public quantity: number = 0;
  public isExtraProduct: boolean = false;
  public taxFactor?: number;
  public taxSegments?: ITaxSegment[];
  public rawTaxes?: IRawTax[];
  public priceMap?: Map<PriceListID, IProductPricingInfo>;
  public uomId?: number;
  public uomName?: string;
  public cabysCode?: string;
  public priceListIds?: PriceListID[];

  static fromRemoteDTO(record: IRemoteProductDTO): Product {
    const taxSegments = Product.convertTaxesToSegments(record.taxes_id || []);
    const taxFactor = Product.calculateTotalTaxFactor(taxSegments);

    const data: Partial<Product> = {
      remoteId: record.id,
      name: record.name,
      code: record.default_code || "",
      barcode: record.barcode || "",
      price: Number(record.list_price) || 0,
      category: record.categ_id?.name || "",
      description: record.description_sale || "",
      imageUrl: record.image_1920 || "",
      quantity: 0,
      isExtraProduct: false,
      taxFactor,
      taxSegments,
      rawTaxes: record.taxes_id || [],
      uomId: record.uom_id?.id,
      uomName: record.uom_id?.name,
      cabysCode: record.cabys_code,
      priceListIds: [],
      remoteState: ERemoteState.SYNCED,
    };
    return Product.obj(data);
  }

  @mapped(EDistributionRepository.PRICE_LIST, "priceListIds")
  get priceLists(): PriceList[] {
    return [];
  }

  /**
   * Merge remote product information updating ONLY pricing related fields.
   * Other local fields are preserved to avoid overwriting enriched local data.
   */
  mergeFromRemote(remote: Partial<Product>): void {
    if (!remote) return;

    if (typeof remote.price === "number") {
      this.price = remote.price;
    }

    this.uomId = remote.uomId ?? this.uomId;
    this.uomName = remote.uomName ?? this.uomName;

    if (remote.priceMap instanceof Map) {
      this.priceMap = remote.priceMap;
    } else if (remote.priceMap && typeof remote.priceMap === "object") {
      this.priceMap = new Map<PriceListID, IProductPricingInfo>(
        Object.entries(remote.priceMap as any).map(([k, v]) => [
          Number(k),
          v as IProductPricingInfo,
        ]),
      );
    }
  }

  setPricingInfo(pricingInfoMap: Map<PriceListID, IProductPricingInfo>): void {
    this.priceListIds = Array.from(pricingInfoMap.keys());
    this.priceMap = pricingInfoMap;
  }

  get inStock(): boolean {
    return this.quantity > 0;
  }

  get hasNegativeStock(): boolean {
    return this.quantity < 0;
  }

  get hasStockIssue(): boolean {
    return this.quantity < 0;
  }

  updateStock(quantity: number): void {
    this.quantity = quantity;
  }

  decreaseStock(amount: number): void {
    this.quantity = this.quantity - amount;
  }

  increaseStock(amount: number): void {
    this.quantity = this.quantity + amount;
  }

  resolveUnitPrice(priceListId?: PriceListID): number {
    if (!priceListId || !this.priceMap) return this.price;

    const info =
      this.priceMap instanceof Map
        ? this.priceMap.get(priceListId)
        : (this.priceMap as any)[priceListId];

    if (!info) return this.price;
    if (info.price === undefined || info.price === null) return this.price;
    if (typeof info.price !== "number") return this.price;
    if (info.price <= 0) return this.price;
    return info.price;
  }

  /**
   * Get unit of measure with fallback
   */
  get getUnitOfMeasure(): string {
    return this.uomName || "Unidades";
  }

  /**
   * Check if product has CABYS code
   */
  hasCabysCode(): boolean {
    return !!(this.cabysCode && this.cabysCode.trim().length > 0);
  }

  // ===== Tax helpers (centralized) =====
  private static mapAmountType(amountType: string): ETaxType {
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
        return ETaxType.FIXED;
    }
  }

  private static convertTaxesToSegments(taxes: IRawTax[]): ITaxSegment[] {
    return taxes.map((tax: IRawTax, index: number) => ({
      id: tax.id,
      name: tax.name || `Tax ${tax.id}`,
      amount: tax.amount || 0,
      type: Product.mapAmountType(tax.amount_type),
      sequence: tax.sequence || index,
      includeBaseAmount: tax.include_base_amount || false,
      taxGroupId: tax.tax_group_id?.id,
      taxGroupName: tax.tax_group_id?.name,
      invoiceLabel: tax.invoice_label,
      priceIncluded: !!tax.price_include,
      originalAmountType: tax.amount_type,
    }));
  }

  private static calculateTotalTaxFactor(taxSegments: ITaxSegment[]): number {
    return TaxCalculator.calculateTotalTaxFactor(taxSegments);
  }

  static fromJSON(json: any): Product {
    const product = super.fromJSON(json) as Product;

    if (product.priceMap && !(product.priceMap instanceof Map)) {
      product.priceMap = new Map<PriceListID, IProductPricingInfo>(
        Object.entries(product.priceMap as any).map(([k, v]) => [
          Number(k),
          v as IProductPricingInfo,
        ]),
      );
    }

    return product;
  }
}
