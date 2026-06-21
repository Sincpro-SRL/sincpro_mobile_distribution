import { JsonSerializerAdapter } from "@sincpro/mobile/adapters/JsonSerializer.adapter";
import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { ECommonRepository, repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { ProductOdooAdapter } from "@sincpro/mobile-distribution/adapters/odoo/product.adapter";
import { RouteAdapter } from "@sincpro/mobile-distribution/adapters/odoo/route.adapter";
import type { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import type { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { Product } from "@sincpro/mobile-distribution/domain/product";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";
import {
  ERouteStatusType,
  type IRemoteRouteLineDetailDTO,
  Route,
  RouteOrder,
} from "@sincpro/mobile-distribution/domain/route";
import type { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { EDistributionSetting } from "@sincpro/mobile-distribution/domain/settings";
import { distributionSettingFeature } from "@sincpro/mobile-distribution/services/settings.feature";

class RouteService {
  private get repository() {
    return repos.get(EDistributionDomainRepository.ROUTE);
  }
  private get routeOrderRepository() {
    return repos.get(EDistributionDomainRepository.ROUTE_ORDER);
  }
  private get settingsRepository() {
    return repos.get(ECommonRepository.SETTINGS);
  }
  private get saleOrderRepository() {
    return repos.get(EDistributionDomainRepository.SALE_ORDER);
  }
  private get paymentRepository() {
    return repos.get(EDistributionDomainRepository.PAYMENT);
  }
  private get productRepository() {
    return repos.get(EDistributionDomainRepository.PRODUCT);
  }
  private get creditNoteRepository() {
    return repos.get(EDistributionDomainRepository.CREDIT_NOTE);
  }

  private settingsFeature = distributionSettingFeature;

  async getRemoteActiveRouteId(): Promise<number | null> {
    return await this.settingsFeature.getActiveRoute();
  }

  async getAllRoutes(): Promise<RemoteEntityCollection<Route>> {
    const routes = await this.repository.findAll();
    return new RemoteEntityCollection(routes.toArray());
  }

  async getRouteByUuid(uuid: string): Promise<Route | null> {
    const route = await this.repository.findById(uuid);

    if (route) {
      return route;
    }

    return null;
  }

  async updateRouteOrder(routeOrder: RouteOrder): Promise<void> {
    loggerUseCases.info(`Updating route order with remote ID: ${routeOrder.remoteId}`);
    const existingRouteOrder = await this.routeOrderRepository.findByRemoteId(
      routeOrder.remoteId!,
    );

    if (!existingRouteOrder) {
      throw new Error(`Route order with remote ID ${routeOrder.remoteId} not found`);
    }

    existingRouteOrder.mergeWithRemote(routeOrder);

    await this.routeOrderRepository.save(existingRouteOrder);
    loggerUseCases.info(
      `Route order with remote ID: ${routeOrder.remoteId} updated successfully`,
    );
  }

  async getRouteByRemoteId(remoteId: number): Promise<Route | null> {
    loggerUseCases.info(`Getting route by remote ID: ${remoteId}`);
    const route = await this.repository.findByRemoteId(remoteId);

    if (route) {
      loggerUseCases.info(`Route with remote ID ${remoteId} found`);
      return route;
    }

    loggerUseCases.warn(`Route with remote ID ${remoteId} not found`);
    return null;
  }

  async getActiveRoutes(): Promise<RemoteEntityCollection<Route>> {
    loggerUseCases.info("Getting active routes");
    const routes = await this.repository.findByActive();
    if (routes.isEmpty) {
      loggerUseCases.info("No active routes found");
    }
    return new RemoteEntityCollection(routes.toArray());
  }

  async getActiveRoute(): Promise<Route | null> {
    loggerUseCases.info("Getting active route");
    const routes = await this.getActiveRoutes();
    if (routes.isEmpty) {
      loggerUseCases.info("No active route found");
      return null;
    }
    return routes.first() ?? null;
  }

  async getRoutesByStatus(
    status: ERouteStatusType | ERouteStatusType[],
  ): Promise<RemoteEntityCollection<Route>> {
    loggerUseCases.info(`Getting routes by status: ${status}`);
    const routes = await this.repository.findByState(status);
    loggerUseCases.info(`Found ${routes.length} routes with status ${status}`);
    return new RemoteEntityCollection(routes.toArray());
  }

  async mergeRemoteRouteOrders(remoteRouteOrders: RouteOrder[]): Promise<void> {
    if (remoteRouteOrders.length === 0) {
      return;
    }

    const localRouteOrders = await this.routeOrderRepository.findAll();
    const localRouteOrdersMap = localRouteOrders.toMap((o: RouteOrder) => o.remoteId!);

    const existingRouteOrders: RouteOrder[] = [];
    const newRouteOrders: RouteOrder[] = [];

    for (const remoteOrder of remoteRouteOrders) {
      const localOrder = localRouteOrdersMap.get(remoteOrder.remoteId!);
      if (localOrder) {
        localOrder.mergeWithRemote(remoteOrder);
        existingRouteOrders.push(localOrder);
      } else {
        newRouteOrders.push(remoteOrder);
      }
    }

    if (newRouteOrders.length > 0) {
      await this.routeOrderRepository.save(newRouteOrders);
      loggerUseCases.info(`Saved ${newRouteOrders.length} new route orders`);
    }

    if (existingRouteOrders.length > 0) {
      await this.routeOrderRepository.save(existingRouteOrders);
      loggerUseCases.info(`Merged ${existingRouteOrders.length} existing route orders`);
    }
  }

  async createMetaRouteOrders(serializedRouteOrders: RouteOrder[]): Promise<void> {
    if (serializedRouteOrders.length === 0) {
      return;
    }
    const routeOrders = serializedRouteOrders.map((s) => RouteOrder.fromJSON<RouteOrder>(s));
    await this.mergeRemoteRouteOrders(routeOrders);
  }

  async loadActiveRoutes(): Promise<RemoteEntityCollection<Route>> {
    loggerUseCases.info("Load active routes from backend");
    const remoteActiveRoutes = await RouteAdapter.getMyCurrentPlanRoute();
    const localActiveRoutes = await this.repository.findByActive();

    if (remoteActiveRoutes.isEmpty) {
      for (const localRoute of localActiveRoutes) {
        await this.reconcileRoutePlan(localRoute.remoteId!);
      }
      return new RemoteEntityCollection([]);
    }

    const mapLocalRoute = localActiveRoutes.toMapByRemoteId();

    for (const remoteRoute of remoteActiveRoutes) {
      const localRoute = mapLocalRoute.get(remoteRoute.remoteId!);
      if (!localRoute) {
        remoteRoute.setActive();
        remoteRoute.markAsSynced();
        await this.repository.save(remoteRoute);
        await remoteRoute.publishAllDomainEvents();
        continue;
      }

      if (localRoute.hash === remoteRoute.hash) {
        continue;
      }

      if (localRoute.hash !== remoteRoute.hash) {
        loggerUseCases.info(`Route ${remoteRoute.remoteId} has changed, updating local copy`);
        localRoute.notifyRouteOutdated();
      }
    }

    return this.repository.findByActive();
  }

  async clearActiveRouteSettings(): Promise<void> {
    loggerUseCases.info("Clearing active route settings");
    await this.settingsRepository.saveOneSetting(EDistributionSetting.ACTIVE_ROUTE, null);
    await this.settingsRepository.saveOneSetting(EDistributionSetting.START_DATE_ROUTE, null);
    await this.settingsRepository.saveOneSetting(EDistributionSetting.END_DATE_ROUTE, null);
    await this.settingsRepository.saveOneSetting(
      EDistributionSetting.ACTIVE_ROUTE_STATE,
      null,
    );
    loggerUseCases.info("Active route settings cleared successfully");
  }

  async notifyIfRouteSynced(routeRemoteId: number): Promise<void> {
    loggerUseCases.info(`Checking if route [${routeRemoteId}] is synced`);
    const route = await this.repository.findByRemoteId(routeRemoteId);

    if (!route || !route.hash) {
      return;
    }
    const isSynced = await RouteAdapter.checkHashRoutePlan(route.remoteId!, route.hash);

    if (isSynced) {
      return;
    }
    route.notifyRouteOutdated();
  }

  async startRoute(uuid: string): Promise<Route> {
    loggerUseCases.info(`Start route with UUID: ${uuid}`);
    const route = await this.repository.findById(uuid);

    if (!route) {
      throw new Error(`Route with UUID ${uuid} not found`);
    }

    if (!route.remoteId) {
      throw new Error(`Route ${uuid} does not have remote ID, cannot start`);
    }
    const payments = await this.paymentRepository.findAll();
    const routePayments = payments.filter((p: Payment) => p.routeId !== route.remoteId);

    for (const payment of routePayments) {
      await this.paymentRepository.remove(payment);
    }

    route.start();
    await RouteAdapter.startRoutePlan(route.remoteId);
    await this.fetchConsolidatedRouteStock(route.remoteId);
    await this.loadActiveRoutes();
    loggerUseCases.info(`Route ${uuid} started successfully`);
    await this.repository.save(route);
    await route.publishAllDomainEvents();
    return route;
  }

  async finishRoute(uuid: string): Promise<Route> {
    loggerUseCases.info(`Finish route with UUID: ${uuid}`);
    const route = await this.repository.findById(uuid);

    if (!route) {
      throw new Error(`Route with UUID ${uuid} not found`);
    }

    if (!route.remoteId) {
      throw new Error(`Route ${uuid} does not have remote ID, cannot finish`);
    }

    route.finish();
    await this.repository.save(route);
    try {
      await RouteAdapter.finishRoutePlan(route.remoteId);
      await this.loadActiveRoutes();
      await this.settingsRepository.saveOneSetting(EDistributionSetting.ACTIVE_ROUTE, null);
      loggerUseCases.info(`Route ${uuid} finished successfully`);
      return route;
    } catch (error) {
      loggerUseCases.error(`Failed to finish route in backend: ${error}`);
      await route.publishAllDomainEvents();
      throw error;
    }
  }

  async pushRouteToBackend(remoteId: number): Promise<boolean> {
    loggerUseCases.info(`Push route ${remoteId} to backend`);
    const route = await this.repository.findByRemoteId(remoteId);

    if (!route) {
      loggerUseCases.error("Route not found");
      return false;
    }

    if (!route.remoteId || !route.rawData || !route.hash) {
      loggerUseCases.error("Route missing required data for sync");
      return false;
    }

    const isTheSameHash = await RouteAdapter.checkHashRoutePlan(route.remoteId, route.hash);

    if (!isTheSameHash) {
      route.notifyRouteOutdated();
      return true;
    }

    const canonicalJson = JsonSerializerAdapter.cleanData(route.rawData as any);
    const calculatedHash = await JsonSerializerAdapter.calculateHash(canonicalJson as any);
    const result = await RouteAdapter.syncPendingUpdates(
      route.remoteId,
      calculatedHash,
      canonicalJson as any,
    );

    if (result) {
      loggerUseCases.info("Route synced successfully");
      route.rawData = canonicalJson as any;
      route.hash = calculatedHash;
      route.markAsSynced();
      await this.repository.save(route);
      await route.publishAllDomainEvents();
    }

    return result;
  }

  async reconcileRoutePlan(remoteId: number): Promise<void> {
    loggerUseCases.info(`Reconcile route plan with remote ID: ${remoteId}`);

    if (!remoteId) {
      loggerUseCases.warn("Route plan ID is required for reconciliation");
      return;
    }

    const localRoute = await this.repository.findByRemoteId(remoteId);
    const remoteRoutes = await RouteAdapter.getMyCurrentPlanRoute();
    const remoteActiveRoute = remoteRoutes.find((r) => r.remoteId === remoteId);

    if (!remoteActiveRoute && localRoute) {
      loggerUseCases.info(`The route [${remoteId}] is not active in the backend`);
      localRoute.active = false;
      await this.clearActiveRouteSettings();
      await this.repository.save(localRoute);
      return;
    }

    if (!remoteActiveRoute) return;
    if (!localRoute) return;

    const remoteRouteOrders = remoteActiveRoute.rawData!.line_ids.map(
      RouteOrder.fromRemoteDTO,
    );
    await this.mergeRemoteRouteOrders(remoteRouteOrders);
    loggerUseCases.info(
      `Reconciled ${remoteRouteOrders.length} route orders for route ${remoteId}`,
    );

    localRoute.mergeWithRemote(remoteActiveRoute);
    localRoute.markAsSynced();
    await this.repository.save(localRoute);
    loggerUseCases.info(`Route ${remoteId} reconciled successfully`);
  }

  async fetchRouteStock(routeId: number): Promise<Product[]> {
    loggerUseCases.info(`Remote fetch stock route for route [${routeId}]`);
    const routeStockData = await ProductOdooAdapter.fetchRouteStock(routeId);
    const existingProducts = await this.productRepository.findAll();
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
        productsToUpdate.push(firstStockItem!);
      }
    }

    await this.productRepository.save(productsToUpdate);
    loggerUseCases.info(
      `Updated stock for [${productsToUpdate.length}] products for route ID: ${routeId}`,
    );
    return productsToUpdate;
  }

  async fetchConsolidatedRouteStock(routeId: number): Promise<Product[]> {
    loggerUseCases.info(`Fetching consolidated stock for route [${routeId}]`);
    const initialStock = await this.fetchRouteStock(routeId);
    const allRouteOrders = await this.saleOrderRepository.findByCriteria([
      {
        field: "routeId",
        operator: "=",
        value: routeId,
      },
    ]);

    const ordersToDeduct = allRouteOrders.filter(
      (order: SaleOrder) => order.shouldDeductStock,
    );
    loggerUseCases.info(
      `Found ${ordersToDeduct.length} orders to deduct from ${allRouteOrders.length} total`,
    );

    const soldQuantitiesByProduct = new Map<number, number>();

    for (const saleOrder of ordersToDeduct) {
      if (!saleOrder.orderLines) continue;

      for (const line of saleOrder.orderLines) {
        const productId = line.productId;
        const currentSold = soldQuantitiesByProduct.get(productId) || 0;
        soldQuantitiesByProduct.set(productId, currentSold + line.quantity);
      }
    }

    const allRouteCreditNotes = await this.creditNoteRepository.findByCriteria([
      {
        field: "routeId",
        operator: "=",
        value: routeId,
      },
    ]);

    const postedCreditNotes = allRouteCreditNotes.filter(
      (creditNote: CreditNote) => creditNote.state === "posted",
    );
    loggerUseCases.info(
      `Found ${postedCreditNotes.length} posted credit notes from ${allRouteCreditNotes.length} total`,
    );

    const returnedQuantitiesByProduct = new Map<number, number>();

    for (const creditNote of postedCreditNotes) {
      if (!creditNote.creditNoteLines) continue;

      for (const line of creditNote.creditNoteLines) {
        const productId = line.productId;
        const currentReturned = returnedQuantitiesByProduct.get(productId) || 0;
        returnedQuantitiesByProduct.set(productId, currentReturned + line.quantity);
      }
    }

    const consolidatedStock = initialStock.map((product) => {
      const soldQuantity = soldQuantitiesByProduct.get(product.remoteId!) || 0;
      const returnedQuantity = returnedQuantitiesByProduct.get(product.remoteId!) || 0;
      product.updateStock((product.quantity || 0) - soldQuantity + returnedQuantity);
      return product;
    });

    await this.productRepository.save(consolidatedStock);

    loggerUseCases.info(
      `Consolidated stock for route [${routeId}]: ${consolidatedStock.length} products updated`,
    );

    return consolidatedStock;
  }

  async getConsolidatedStockForActiveRoute(): Promise<Product[]> {
    loggerUseCases.info("Getting consolidated stock for active route");
    const activeRouteId = await this.settingsFeature.getActiveRoute();

    if (!activeRouteId) {
      loggerUseCases.warn("No active route found");
      return [];
    }

    return this.fetchConsolidatedRouteStock(activeRouteId);
  }

  async updateLocalRoutePlanLines(
    routeId: number,
    routeOrderRemoteId: number,
  ): Promise<void> {
    loggerUseCases.info(
      `Syncing RouteOrder [${routeOrderRemoteId}] state to Route [${routeId}] rawData`,
    );

    const route = await this.repository.findByRemoteId(routeId);

    if (!route) {
      loggerUseCases.error(`Route [${routeId}] not found`);
      return;
    }

    if (!route.rawData || !route.rawData.line_ids) {
      loggerUseCases.warn(`Route [${routeId}] has no rawData or line_ids`);
      return;
    }

    const routeOrder = await this.routeOrderRepository.findByRemoteId(routeOrderRemoteId);

    if (!routeOrder) {
      loggerUseCases.warn(`RouteOrder [${routeOrderRemoteId}] not found, skipping sync`);
      return;
    }

    for (const routeLine of route.rawData.line_ids) {
      if (routeLine.id === routeOrderRemoteId) {
        routeLine.state = routeOrder.state;
        routeLine.done_date = routeOrder.doneDate;

        for (const detail of routeLine.detail_ids) {
          const routeOrderDetail = routeOrder.details.find(
            (d: IRemoteRouteLineDetailDTO) => d.id === detail.id,
          );
          if (routeOrderDetail) {
            detail.delivered_quantity = routeOrderDetail.delivered_quantity;
          }
        }

        loggerUseCases.info(
          `Synced rawData for RouteOrder [${routeOrderRemoteId}] - state: ${routeLine.state}, done_date: ${routeLine.done_date}`,
        );
        break;
      }
    }

    await this.repository.save(route);
    loggerUseCases.info(`Route [${routeId}] rawData synced successfully`);
  }
}

export const routeService = new RouteService();
