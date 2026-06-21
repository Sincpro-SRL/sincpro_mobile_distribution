import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { ECommonRepository, repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { keyBy } from "@sincpro/mobile/tools/utils/collections";
import { LatestDebounced } from "@sincpro/mobile/tools/utils/searchTools";
import { ProductOdooAdapter } from "@sincpro/mobile-distribution/adapters/odoo/product.adapter";
import { EProductStockFilter, Product } from "@sincpro/mobile-distribution/domain/product";
import { ProductFetchedEvent } from "@sincpro/mobile-distribution/domain/product/events";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";
import { EDistributionSetting } from "@sincpro/mobile-distribution/domain/settings";

class ProductService {
  private readonly searchGate = new LatestDebounced(1000);
  private get repository() {
    return repos.get(EDistributionDomainRepository.PRODUCT);
  }
  private get settingsRepository() {
    return repos.get(ECommonRepository.SETTINGS);
  }

  async fetchAllProductsFromBackend(): Promise<RemoteEntityCollection<Product>> {
    const companies = await this.settingsRepository.getSettingByName(
      EDistributionSetting.COMPANIES,
    );
    if (!companies || companies.length === 0) {
      loggerUseCases.warn("No companies configured in settings");
    }

    const productCategories = await this.settingsRepository.getSettingByName(
      EDistributionSetting.PRODUCT_CATEGORIES,
    );

    if (!productCategories || productCategories.length === 0) {
      loggerUseCases.warn("No product categories configured in settings");
    }

    const products = await ProductOdooAdapter.fetchAllProducts(
      companies || [],
      productCategories || [],
    );

    if (products.isEmpty) {
      loggerUseCases.warn("No products found in backend");
      return products;
    }

    loggerUseCases.info(`Fetched ${products.length} products from backend`);
    await this.mergeRemoteProducts(products);
    await products.publishDomainEvent<ProductFetchedEvent>(ProductFetchedEvent, {
      productRemoteIds: products.mapToArray((p) => p.remoteId!),
    });
    return products;
  }

  async getProductsByRemoteIds(
    remoteIds: number[],
  ): Promise<RemoteEntityCollection<Product>> {
    loggerUseCases.info(`Fetching products by remote IDs: ${remoteIds.length} items`);

    const localProducts = await this.repository.findByRemoteIds(remoteIds);

    if (localProducts.length === remoteIds.length) {
      loggerUseCases.info(`All ${remoteIds.length} products found locally`);
      return new RemoteEntityCollection(localProducts.toArray());
    }

    const remoteProducts = await ProductOdooAdapter.getProductsByIds(remoteIds);

    if (remoteProducts.isNotEmpty) {
      await this.mergeRemoteProducts(remoteProducts);
      loggerUseCases.info(`Fetched and saved ${remoteProducts.length} products from backend`);
    }

    return remoteProducts;
  }

  async searchProducts(searchString: string): Promise<RemoteEntityCollection<Product>> {
    return this.searchGate.run(
      async () => {
        loggerUseCases.info(`Searching products with string: "${searchString}"`);

        const localMatches = await this.repository.findByString(searchString);

        if (!searchString || searchString.trim() === "" || localMatches) {
          loggerUseCases.info(`Found ${localMatches.length} products locally`);
          return new RemoteEntityCollection(localMatches.toArray());
        }

        loggerUseCases.info(`Searching remote products with string: "${searchString}"`);

        const companies = await this.settingsRepository.getSettingByName(
          EDistributionSetting.COMPANIES,
        );
        const productCategories = await this.settingsRepository.getSettingByName(
          EDistributionSetting.PRODUCT_CATEGORIES,
        );

        const allLocalProducts = await this.repository.findAll();
        const excludeRemoteIds = allLocalProducts
          .mapToArray((p: Product) => p.remoteId)
          .filter((id: number | undefined): id is number => id !== undefined && id > 0);

        const remoteProducts = await ProductOdooAdapter.searchProducts(searchString, {
          excludeRemoteIds,
          companyIds: companies || [],
          categoryIds: productCategories || [],
          limit: 80,
        });

        if (remoteProducts.isEmpty) {
          loggerUseCases.warn(`No products found remotely for: "${searchString}"`);
          return remoteProducts;
        }

        await this.mergeRemoteProducts(remoteProducts);

        loggerUseCases.info(
          `Found and saved ${remoteProducts.length} products from remote search`,
        );

        return remoteProducts;
      },
      async () => {
        const results = await this.repository.findByString(searchString);
        return new RemoteEntityCollection(results.toArray());
      },
    );
  }

  async mergeRemoteProducts(remoteProducts: RemoteEntityCollection<Product>): Promise<void> {
    const remoteIds = remoteProducts.mapToArray((p) => p.remoteId!).filter((id) => id > 0);
    const localProducts = await this.repository.findByRemoteIds(remoteIds);

    const localProductMap = localProducts.toMap((p: Product) => p.remoteId);
    const [existingRemote, missingRemote] = remoteProducts.partition((p) =>
      localProductMap.has(p.remoteId),
    );

    if (missingRemote.isNotEmpty) {
      await this.repository.save(missingRemote);
      loggerUseCases.info(`Saved ${missingRemote.length} new products from remote`);
    }

    if (existingRemote.isNotEmpty) {
      loggerUseCases.info(
        `Merging ${existingRemote.length} existing products with remote data`,
      );
      for (const remoteProduct of existingRemote) {
        const localProduct = localProductMap.get(remoteProduct.remoteId);
        if (!localProduct) continue;

        const localUuid = localProduct.uuid;
        const localQuantity = localProduct.quantity;
        localProduct.mergeWithRemote(remoteProduct);
        localProduct.uuid = localUuid;
        localProduct.quantity = localQuantity;
        await this.repository.save(localProduct);
      }
    }
  }

  async pullAndMergePricingFromBackend(): Promise<void> {
    loggerUseCases.info("Pulling and merging pricing for local products");

    const localProducts = await this.repository.findAll();

    if (localProducts.isEmpty) {
      loggerUseCases.warn("No local products found to update pricing");
      return;
    }

    const productIds = localProducts
      .mapToArray((p: Product) => p.remoteId)
      .filter((id: number | undefined): id is number => id !== undefined);

    if (productIds.length === 0) {
      loggerUseCases.warn("No products with remote IDs to update");
      return;
    }

    const remoteProducts = await ProductOdooAdapter.getProductsByIds(productIds);

    if (remoteProducts.isEmpty) {
      loggerUseCases.warn("No remote products fetched for pricing update");
      return;
    }

    const remoteMap = keyBy(remoteProducts.toArray(), (p) => p.remoteId!);

    const mergedProducts = localProducts.map((local: Product) => {
      const remote = remoteMap[local.remoteId!];
      if (!remote) return local;

      local.mergeFromRemote({
        price: remote.price,
        uomId: remote.uomId,
        uomName: remote.uomName,
      });

      return local;
    });

    await this.repository.save(new RemoteEntityCollection(mergedProducts.toArray()));

    loggerUseCases.info(
      `Merged pricing for ${mergedProducts.length} products (updated: price, uom)`,
    );
  }

  async getRouteStock(routeId: number): Promise<RemoteEntityCollection<Product>> {
    loggerUseCases.info(`Fetching route stock for route: ${routeId}`);

    const routeStockData = await ProductOdooAdapter.fetchRouteStock(routeId);

    if (routeStockData.isEmpty) {
      loggerUseCases.warn(`No stock found for route ${routeId}`);
      return routeStockData;
    }

    const existingProducts = await this.repository.findAll();
    const existingProductsMap = existingProducts.toMap((p: Product) => p.remoteId!);
    const groupedRouteStock = routeStockData.groupBy((p) => p.remoteId!);
    const productsToUpdate: Product[] = [];

    for (const groupedProducts of groupedRouteStock.values()) {
      const firstStockItem = groupedProducts.first();
      if (!firstStockItem) continue;

      let totalQuantity = 0;
      for (const stockItem of groupedProducts) {
        totalQuantity += stockItem.quantity || 0;
      }

      const existingProduct = existingProductsMap.get(firstStockItem.remoteId!);

      if (existingProduct) {
        existingProduct.mergeWithRemote(firstStockItem);
        existingProduct.quantity = totalQuantity;
        productsToUpdate.push(existingProduct);
      } else {
        firstStockItem.quantity = totalQuantity;
        productsToUpdate.push(firstStockItem);
      }
    }

    loggerUseCases.info(
      `Fetched ${productsToUpdate.length} products with stock for route ${routeId}`,
    );

    await this.repository.save(productsToUpdate);

    return new RemoteEntityCollection(productsToUpdate);
  }

  async getAllProducts(
    stockFilter?: EProductStockFilter,
  ): Promise<RemoteEntityCollection<Product>> {
    loggerUseCases.info("Getting all products from local database");

    const products = await this.repository.findAll();

    switch (stockFilter) {
      case EProductStockFilter.IN_STOCK: {
        const filtered = products.filter((p: Product) => p.inStock);
        loggerUseCases.info(
          `Found ${filtered.length} products IN_STOCK (total: ${products.length})`,
        );
        return new RemoteEntityCollection(filtered.toArray());
      }
      case EProductStockFilter.OUT_OF_STOCK: {
        const filtered = products.filter((p: Product) => !p.inStock);
        loggerUseCases.info(
          `Found ${filtered.length} products OUT_OF_STOCK (total: ${products.length})`,
        );
        return new RemoteEntityCollection(filtered.toArray());
      }
      case EProductStockFilter.ALL:
      default:
        loggerUseCases.info(`Found ${products.length} products (ALL)`);
        return new RemoteEntityCollection(products.toArray());
    }
  }

  async getProductByUuid(uuid: string): Promise<Product | null> {
    loggerUseCases.info(`Getting product by UUID: ${uuid}`);

    const product = await this.repository.findById(uuid);

    if (product) {
      loggerUseCases.info(`Product with UUID ${uuid} found in local database`);
      return product;
    }

    loggerUseCases.warn(`Product with UUID ${uuid} not found`);
    return null;
  }

  async getProductByRemoteId(remoteId: number): Promise<Product | null> {
    loggerUseCases.info(`Getting product by remote ID: ${remoteId}`);

    const product = await this.repository.findByRemoteId(remoteId);

    if (product) {
      loggerUseCases.info(`Product with remote ID ${remoteId} found in local database`);
      return product;
    }

    loggerUseCases.warn(`Product with remote ID ${remoteId} not found`);
    return null;
  }

  async updateProductStock(remoteId: number, quantity: number): Promise<Product> {
    loggerUseCases.info(`Updating stock for product ${remoteId}`);

    const product = await this.repository.findByRemoteId(remoteId);

    if (!product) {
      throw new Error(`Product with remote ID ${remoteId} not found`);
    }

    product.updateStock(quantity);
    await this.repository.save(product);

    loggerUseCases.info(
      `Updated stock for product ${remoteId}: quantity=${quantity}, inStock=${product.inStock}`,
    );

    return product;
  }
}

export const productService = new ProductService();
