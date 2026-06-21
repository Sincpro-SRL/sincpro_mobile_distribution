import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import {
  IRawTax,
  IRemoteProductDTO,
  Product,
  ProductID,
} from "@sincpro/mobile-distribution/domain/product";
import { getOdooClient, IRecordResult } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

export const PRODUCT_SPEC_QUERY = {
  id: {},
  name: {},
  default_code: {},
  barcode: {},
  list_price: {},
  categ_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  description_sale: {},
  image_1920: {},
  taxes_id: {
    fields: {
      id: {},
      name: {},
      amount: {},
      amount_type: {},
      sequence: {},
      include_base_amount: {},
      tax_group_id: {
        fields: {
          id: {},
          name: {},
        },
      },
      invoice_label: {},
      price_include: {},
    },
  },
  uom_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  cabys_code: {},
};

interface RouteStockResponse {
  name: string;
  state: string;
  route_id: number;
  move_type_id: string;
  distributor_id: number;
  route_plan_id: number;
  line_ids: {
    product_id: {
      id: number;
      name: string;
      default_code: string;
      barcode: string;
      list_price: number;
      cabys_code: string;
      taxes_id: IRawTax[];
    };
    uom_id: number;
    quantity: number;
    move_context: string;
  }[];
}

export const ProductOdooAdapter = {
  async fetchAllProducts(
    companyIds: number[],
    productCategoryIds: number[],
  ): Promise<RemoteEntityCollection<Product>> {
    loggerAdapter.info(
      `Fetching all products from Odoo for companies: ${companyIds} and categories: ${productCategoryIds}`,
    );
    const odooClient = getOdooClient();

    let domain: any[] = [
      ["sale_ok", "=", true],
      ["cabys_code", "!=", false],
    ];

    if (companyIds.length > 0) {
      const companyCondition = [
        "|",
        ["company_id", "=", false],
        ["company_id", "in", companyIds],
      ];
      domain = ["&", ...domain, ...companyCondition];
    }

    if (productCategoryIds.length > 0) {
      const categoryCondition = ["categ_id", "in", productCategoryIds];
      domain = ["&", ...domain, categoryCondition];
    }

    const result = await odooClient.queryModel<IRemoteProductDTO>(
      "product.product",
      domain,
      PRODUCT_SPEC_QUERY,
    );

    loggerAdapter.info(`Fetched ${result.records.length} products from Odoo`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, Product);
  },

  async getProductsByIds(ids: ProductID[]): Promise<RemoteEntityCollection<Product>> {
    loggerAdapter.info(`Fetching products from Odoo for IDs: ${ids}`);
    const productIds = convertToArray(ids);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteProductDTO>(
      "product.product",
      [["id", "in", productIds]],
      PRODUCT_SPEC_QUERY,
    );

    return RemoteEntityCollection.fromRemoteDTO(result.records, Product);
  },

  async searchProducts(
    query: string,
    options?: {
      excludeRemoteIds?: number[];
      companyIds?: number[];
      categoryIds?: number[];
      limit?: number;
    },
  ): Promise<RemoteEntityCollection<Product>> {
    loggerAdapter.info(`Searching products in Odoo with query: ${query}`);
    const odooClient = getOdooClient();

    const orDomain: any[] = [
      "|",
      "|",
      ["name", "ilike", query],
      ["default_code", "ilike", query],
      ["barcode", "=", query],
    ];

    let domain: any[] = [
      "&",
      "&",
      ...orDomain,
      ["sale_ok", "=", true],
      ["cabys_code", "!=", false],
    ];

    if (options?.companyIds && options.companyIds.length > 0) {
      domain = [
        "&",
        ...domain,
        "|",
        ["company_id", "=", false],
        ["company_id", "in", options.companyIds],
      ];
    }

    if (options?.categoryIds && options.categoryIds.length > 0) {
      domain = ["&", ...domain, ["categ_id", "in", options.categoryIds]];
    }

    if (options?.excludeRemoteIds && options.excludeRemoteIds.length > 0) {
      domain = ["&", ...domain, ["id", "not in", options.excludeRemoteIds]];
    }

    const result = await odooClient.queryModel<IRemoteProductDTO>(
      "product.product",
      domain,
      PRODUCT_SPEC_QUERY,
      {
        limit: options?.limit,
      },
    );

    if (result.records.length === 0) {
      loggerAdapter.info(`No products found in Odoo for query: ${query}`);
      return new RemoteEntityCollection([]);
    }

    return RemoteEntityCollection.fromRemoteDTO(result.records, Product);
  },

  async fetchRouteStock(routeId: number): Promise<RemoteEntityCollection<Product>> {
    loggerAdapter.info(`Fetching route stock from Odoo for route: ${routeId}`);
    const odooClient = getOdooClient();

    const response = await odooClient.callModel<IRecordResult<RouteStockResponse>>(
      "distribution.route.stock",
      "api_distribution_route_stock",
      [routeId],
      {},
    );

    if (response.records.length === 0) {
      loggerAdapter.info(`No stock found for route ${routeId}`);
      return new RemoteEntityCollection([]);
    }

    const stockLines = response.records.flatMap((record) => record.line_ids);
    const products = stockLines.map((line) => {
      const productDTO: IRemoteProductDTO = {
        id: line.product_id.id,
        name: line.product_id.name,
        default_code: line.product_id.default_code || undefined,
        barcode: line.product_id.barcode || undefined,
        list_price: line.product_id.list_price,
        cabys_code: line.product_id.cabys_code || undefined,
        taxes_id: line.product_id.taxes_id || [],
      };

      const product = Product.fromRemoteDTO(productDTO);
      product.updateStock(line.quantity);
      product.isExtraProduct = line.move_context === "extra_product";
      product.uomId = line.uom_id;

      return product;
    });

    return new RemoteEntityCollection(products);
  },
};
