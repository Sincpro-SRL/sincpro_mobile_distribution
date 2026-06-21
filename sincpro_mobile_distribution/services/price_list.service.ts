import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { PriceListOdooAdapter } from "@sincpro/mobile-distribution/adapters/odoo/price_list.adapter";
import { Product } from "@sincpro/mobile-distribution/domain/product";
import { PriceList } from "@sincpro/mobile-distribution/domain/product/price_list";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";

class PriceListService {
  private get repository() {
    return repos.get(EDistributionDomainRepository.PRICE_LIST);
  }
  private get productRepository() {
    return repos.get(EDistributionDomainRepository.PRODUCT);
  }

  async fetchAllPriceListsFromBackend(): Promise<RemoteEntityCollection<PriceList>> {
    const priceLists = await PriceListOdooAdapter.getAllPriceLists();
    if (priceLists.isEmpty) {
      loggerUseCases.warn("No price lists found in backend");
      return priceLists;
    }
    await this.repository.save(priceLists);
    loggerUseCases.info(`Fetched ${priceLists.length} price lists from backend`);
    return priceLists;
  }

  async aggregateProductsPricing(
    products: RemoteEntityCollection<Product>,
  ): Promise<RemoteEntityCollection<Product>> {
    const priceLists = await this.fetchAllPriceListsFromBackend();
    if (priceLists.isEmpty) {
      loggerUseCases.warn("No price lists found, products will use regular pricing only");
      return products;
    }

    loggerUseCases.info(
      `Found ${priceLists.length} price lists, fetching pricing for ${products.length} products`,
    );

    const productIds = products.mapToArray((p) => p.remoteId!).filter((id) => id != null);
    const priceListIds = priceLists
      .mapToArray((pl) => pl.remoteId!)
      .filter((id) => id != null);

    const pricingMap = await PriceListOdooAdapter.fetchProductsPricing(
      productIds,
      priceListIds,
    );

    for (const product of products) {
      const productPricing = pricingMap.get(product.remoteId!);
      if (productPricing) {
        product.setPricingInfo(productPricing);
      }
    }

    await this.productRepository.save(products);

    loggerUseCases.info(
      `Successfully aggregated ${products.length} products with pricing information`,
    );

    return products;
  }
}

export const priceListService = new PriceListService();
