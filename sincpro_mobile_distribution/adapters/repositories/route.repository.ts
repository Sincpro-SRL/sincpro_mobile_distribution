import { IRemoteRepository } from "@sincpro/mobile/domain/database";
import {
  ERemoteState,
  ICriteria,
  RemoteEntityCollection,
} from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { ERouteStatusType, Hash, Route } from "@sincpro/mobile-distribution/domain/route";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

interface IRouteRepository extends IRemoteRepository<Route> {
  findByHash: (hash: Hash) => Promise<Route | null>;
  findByState: (
    state: ERouteStatusType | ERouteStatusType[] | Set<ERouteStatusType>,
  ) => Promise<RemoteEntityCollection<Route>>;
  findByActive: () => Promise<RemoteEntityCollection<Route>>;
}

class RouteRepositoryImpl implements IRouteRepository {
  public readonly name = EDistributionRepository.ROUTE;
  public readonly table = DATABASE_TABLES.ROUTE_PLANS;
  async save(entity: Route[] | Route | RemoteEntityCollection<Route>): Promise<void> {
    const routes = RemoteEntityCollection.toArrayFrom(entity);
    for (const route of routes) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.ROUTE_PLANS} 
         (uuid, remote_id, hash, state, data, name, active, remote_state) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        route.uuid,
        route.remoteId ?? null,
        route.hash ?? "",
        route.status,
        route.asJSON(),
        route.name ?? "",
        route.active ? 1 : 0,
        route.remoteState,
      );
    }

    loggerRepositories.info(`${routes.length} route(s) saved successfully`);
  }

  async findById(uuid: string): Promise<Route | null> {
    loggerRepositories.debug(`Finding route with UUID: ${uuid}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.ROUTE_PLANS} WHERE uuid = ?`,
      uuid,
    );

    if (!row) {
      loggerRepositories.debug(`Route ${uuid} not found`);
      return null;
    }

    loggerRepositories.info(`Route ${uuid} fetched successfully`);
    return Route.fromJSON(row.data);
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<Route>> {
    const uuidArray = convertToArray(uuids);
    const placeholder = uuidArray.map(() => "?").join(",");

    loggerRepositories.debug(`Finding routes with UUIDs: ${uuidArray.length} items`);

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.ROUTE_PLANS} WHERE uuid IN (${placeholder})`,
      ...uuidArray,
    );

    if (rows.length === 0) {
      loggerRepositories.debug(`No routes found for provided UUIDs`);
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.info(`${rows.length} route(s) fetched successfully`);
    const routes = rows.map((row) => Route.fromJSON<Route>(row.data));
    return new RemoteEntityCollection(routes);
  }

  async findByRemoteId(remoteId: number): Promise<Route | null> {
    loggerRepositories.debug(`Finding route with remote ID: ${remoteId}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.ROUTE_PLANS} WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) {
      loggerRepositories.debug(`Route with remote ID ${remoteId} not found`);
      return null;
    }

    loggerRepositories.info(`Route with remote ID ${remoteId} fetched successfully`);
    return Route.fromJSON(row.data);
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<Route>> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);

    loggerRepositories.debug(`Finding routes with ${remoteIds.length} remote IDs`);

    const placeholders = remoteIds.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.ROUTE_PLANS} WHERE remote_id IN (${placeholders})`,
      ...remoteIds,
    );

    if (rows.length === 0) {
      loggerRepositories.debug(`No routes found for provided remote IDs`);
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.info(`Found ${rows.length} route(s) by remote IDs`);
    const routes = rows.map((row) => Route.fromJSON<Route>(row.data));
    return new RemoteEntityCollection(routes);
  }

  async findAll(): Promise<RemoteEntityCollection<Route>> {
    loggerRepositories.debug("Finding all routes");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.ROUTE_PLANS} ORDER BY uuid DESC`,
    );

    if (rows.length === 0) {
      loggerRepositories.debug("No routes found");
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.info(`${rows.length} route(s) fetched successfully`);
    const routes = rows.map((row) => Route.fromJSON<Route>(row.data));
    return new RemoteEntityCollection(routes);
  }

  async findByCriteria(criteria: ICriteria<Route>[]): Promise<RemoteEntityCollection<Route>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }

  async remove(entity: Route | Route[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      loggerRepositories.debug(`Removing route ${item.uuid}`);
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.ROUTE_PLANS} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByHash(hash: Hash): Promise<Route | null> {
    loggerRepositories.debug(`Finding route with hash: ${hash}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.ROUTE_PLANS} WHERE hash = ?`,
      hash,
    );

    if (!row) {
      loggerRepositories.debug(`Route with hash ${hash} not found`);
      return null;
    }

    loggerRepositories.info(`Route with hash ${hash} fetched successfully`);
    return Route.fromJSON(row.data);
  }

  async findByState(
    state: ERouteStatusType | ERouteStatusType[] | Set<ERouteStatusType>,
  ): Promise<RemoteEntityCollection<Route>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");

    loggerRepositories.debug(`Finding routes with state(s): ${states.join(", ")}`);

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.ROUTE_PLANS} WHERE state IN (${placeholder})`,
      ...states,
    );

    if (rows.length === 0) {
      loggerRepositories.debug(`No routes found for state(s): ${states.join(", ")}`);
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.info(`${rows.length} route(s) fetched successfully`);
    const routes = rows.map((row) => Route.fromJSON<Route>(row.data));
    return new RemoteEntityCollection(routes);
  }

  async findByActive(): Promise<RemoteEntityCollection<Route>> {
    loggerRepositories.debug("Finding active routes");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.ROUTE_PLANS} WHERE active = ?`,
      1,
    );

    if (rows.length === 0) {
      loggerRepositories.debug("No active routes found");
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.info(`${rows.length} active route(s) fetched successfully`);
    const routes = rows.map((row) => Route.fromJSON<Route>(row.data));
    return new RemoteEntityCollection(routes);
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<Route>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");
    loggerRepositories.debug(`Finding routes with remote state(s): ${states.join(", ")}`);

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data 
       FROM ${DATABASE_TABLES.ROUTE_PLANS}
       WHERE remote_state IN (${placeholder})`,
      ...states,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const routes = rows.map((row) => Route.fromJSON<Route>(row.data));

    loggerRepositories.info(
      `Found ${routes.length} route(s) with state(s): ${states.join(", ")}`,
    );

    return new RemoteEntityCollection(routes);
  }
}

export const RouteRepository = new RouteRepositoryImpl();
