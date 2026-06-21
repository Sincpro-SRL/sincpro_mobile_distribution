import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import { IRemoteRouteDTO, Route } from "@sincpro/mobile-distribution/domain/route";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

/**
 * Backend response structure from Odoo API.
 * Contains array of route records and their corresponding hashes.
 */
interface IOdooRoutePlanResponse {
  length: number;
  records: IRemoteRouteDTO[];
  hashes: [number, string][];
}

function parseBackendResponse(
  response: IOdooRoutePlanResponse,
): RemoteEntityCollection<Route> {
  if (!response || !response.records || response.records.length === 0) {
    return new RemoteEntityCollection([]);
  }

  const routes: Route[] = [];
  const hashDict = Object.fromEntries(response.hashes || []);

  for (const plan of response.records) {
    if (plan.plan_type !== "sale_order") {
      continue;
    }

    const route = Route.fromRemoteDTO({
      route: plan,
      hash: hashDict[plan.id] || "",
    });
    routes.push(route);
  }

  return new RemoteEntityCollection(routes);
}

class RouteOdooAdapterImpl {
  /**
   * Get current active route plans from backend.
   */
  async getMyCurrentPlanRoute(): Promise<RemoteEntityCollection<Route>> {
    loggerAdapter.info("Fetching current route plan from Odoo");
    const odooClient = getOdooClient();
    const response = await odooClient.callModel<IOdooRoutePlanResponse>(
      "distribution.route.plan",
      "api_get_my_current_route_plan",
      [],
      {},
    );

    const routes = parseBackendResponse(response);
    loggerAdapter.info(`Fetched ${routes.count()} current route plans`);
    return routes;
  }

  /**
   * Check if route hash matches backend hash.
   */
  async checkHashRoutePlan(routePlanId: number, hash: string): Promise<boolean> {
    loggerAdapter.info(`Checking hash for route plan ID: ${routePlanId}`);
    const odooClient = getOdooClient();
    const response = await odooClient.callModel<any>(
      "distribution.route.plan",
      "api_check_hash",
      [routePlanId, hash],
      {},
    );
    return response.sync;
  }

  /**
   * Sync pending updates to backend.
   */
  async syncPendingUpdates(
    routePlanId: number,
    hash: string,
    canonicalRoutePlanJson: object,
  ): Promise<boolean> {
    loggerAdapter.info(`Syncing route plan with ID: ${routePlanId} and hash: ${hash}`);
    const odooClient = getOdooClient();
    const response = await odooClient.callModel<any>(
      "distribution.route.plan",
      "api_sync_route_plan",
      [routePlanId, hash, canonicalRoutePlanJson],
      {},
    );

    return response.sync;
  }

  /**
   * Get historical route plans from backend.
   */
  async getHistory(): Promise<RemoteEntityCollection<Route>> {
    loggerAdapter.info("Fetching historical route plans from Odoo");
    const odooClient = getOdooClient();
    const response = await odooClient.callModel<any>(
      "distribution.route.plan",
      "api_get_historical_route_plans",
      [],
      { limit: 2 },
    );

    const routes = parseBackendResponse(response);
    loggerAdapter.info(`Fetched ${routes.count()} historical route plans`);
    return routes;
  }

  /**
   * Start route plan in backend.
   */
  async startRoutePlan(routePlanId: number): Promise<void> {
    loggerAdapter.info(`Starting route plan with ID: ${routePlanId} in backend`);
    const odooClient = getOdooClient();
    const result = await odooClient.callModel<boolean>(
      "distribution.route.plan",
      "api_start_process",
      [routePlanId],
      {},
    );
    if (!result) {
      throw new Error("Failed to start route plan in backend");
    }
    loggerAdapter.info(`Route plan ${routePlanId} started successfully in backend`);
  }

  /**
   * Finish route plan in backend.
   */
  async finishRoutePlan(routePlanId: number): Promise<void> {
    loggerAdapter.info(`Finishing route plan with ID: ${routePlanId} in backend`);
    const odooClient = getOdooClient();
    await odooClient.callModel<any>(
      "distribution.route.plan",
      "api_finish_process",
      [routePlanId],
      {},
    );
    loggerAdapter.info(`Route plan ${routePlanId} finished successfully in backend`);
  }
}

export const RouteAdapter = new RouteOdooAdapterImpl();
