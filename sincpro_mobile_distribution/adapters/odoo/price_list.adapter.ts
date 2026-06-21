import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import {
  type IProductPricingInfo,
  type IRemotePriceListDTO,
  type IRemoteProductPricingDTO,
  PriceList,
  type PriceListID,
} from "@sincpro/mobile-distribution/domain/product/price_list";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

export const PRICELIST_SPEC_QUERY = {
  id: {},
  name: {},
  currency_id: {
    fields: {
      id: {},
      name: {},
      symbol: {},
    },
  },
};

export const PriceListOdooAdapter = {
  async getPriceListByIds(ids: PriceListID[]): Promise<RemoteEntityCollection<PriceList>> {
    loggerAdapter.info(`Fetching from Odoo price lists for IDs: ${ids}`);
    const priceListIds = convertToArray(ids);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemotePriceListDTO>(
      "product.pricelist",
      [["id", "in", priceListIds]],
      PRICELIST_SPEC_QUERY,
    );

    loggerAdapter.info(`Fetched ${result.records.length} price lists by IDs from Odoo`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, PriceList);
  },

  async getAllPriceLists(): Promise<RemoteEntityCollection<PriceList>> {
    loggerAdapter.info("Fetching all price lists from Odoo");
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemotePriceListDTO>(
      "product.pricelist",
      [],
      PRICELIST_SPEC_QUERY,
    );

    loggerAdapter.info(`Fetched ${result.records.length} price lists from Odoo`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, PriceList);
  },

  async searchPriceLists(searchString: string): Promise<RemoteEntityCollection<PriceList>> {
    loggerAdapter.info(`Searching price lists with string: ${searchString}`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemotePriceListDTO>(
      "product.pricelist",
      [["name", "ilike", searchString]],
      PRICELIST_SPEC_QUERY,
    );

    if (result.records.length === 0) {
      loggerAdapter.info(
        `No price lists found for the provided search criteria ${searchString}`,
      );
      return new RemoteEntityCollection([]);
    }

    loggerAdapter.info(
      `Found ${result.records.length} price lists matching "${searchString}"`,
    );
    return RemoteEntityCollection.fromRemoteDTO(result.records, PriceList);
  },

  async fetchProductsPricing(
    productIds: number[],
    priceListIds: PriceListID[],
  ): Promise<Map<number, Map<PriceListID, IProductPricingInfo>>> {
    loggerAdapter.info(
      `Fetching products pricing from Odoo for products: ${productIds} and price lists: ${priceListIds}`,
    );

    const odooClient = getOdooClient();
    const response = await odooClient.callModel<IRemoteProductPricingDTO>(
      "product.product",
      "api_get_products_pricing",
      [productIds, priceListIds],
      {},
    );

    const pricingMap = new Map<number, Map<PriceListID, IProductPricingInfo>>();

    for (const productIdStr in response) {
      const productId = Number(productIdStr);
      const productPricingMap = new Map<PriceListID, IProductPricingInfo>();

      for (const priceListIdStr in response[productIdStr]) {
        const priceListId = Number(priceListIdStr);
        const pricingInfo = response[productIdStr][priceListIdStr];

        productPricingMap.set(priceListId, {
          price: pricingInfo.price,
          priceListId: priceListId,
          priceListName: pricingInfo.pricelist_name,
          currency: pricingInfo.currency,
          currencyId: pricingInfo.currency_id,
        });
      }

      pricingMap.set(productId, productPricingMap);
    }

    loggerAdapter.info(
      `Fetched pricing for ${pricingMap.size} products across ${priceListIds.length} price lists`,
    );

    return pricingMap;
  },
};
