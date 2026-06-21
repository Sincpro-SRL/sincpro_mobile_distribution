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
import { RouteOrder } from "@sincpro/mobile-distribution/domain/route";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class RouteOrderRepositoryImpl implements IRemoteRepository<RouteOrder> {
  public readonly name = EDistributionRepository.ROUTE_ORDER;
  public readonly table = DATABASE_TABLES.ROUTE_ORDERS;
  async save(
    routeOrders: RouteOrder[] | RouteOrder | RemoteEntityCollection<RouteOrder>,
  ): Promise<void> {
    const convertedRouteOrders = RemoteEntityCollection.toArrayFrom(routeOrders);
    loggerRepositories.debug(
      `Saving ${convertedRouteOrders.length} route orders to the database`,
    );

    for (const routeOrder of convertedRouteOrders) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.ROUTE_ORDERS} (uuid, data, name, remote_id, remote_state) VALUES (?, ?, ?, ?, ?)`,
        routeOrder.uuid,
        routeOrder.asJSON(),
        routeOrder.name || "Sin nombre",
        routeOrder.remoteId ?? null,
        routeOrder.remoteState,
      );
    }

    loggerRepositories.info(`Route orders ${convertedRouteOrders.length} saved successfully`);
  }

  async findById(uuid: string): Promise<RouteOrder | null> {
    loggerRepositories.debug(`Finding route order with UUID: ${uuid}`);

    const row = await DBCursor.getFirstAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE uuid = ?`,
      uuid,
    );

    if (!row) return null;

    loggerRepositories.info(`Route order with UUID: ${uuid} fetched successfully`);
    return RouteOrder.fromJSON(row.data);
  }

  findByIdSync(uuid: string): RouteOrder | null {
    const row = DBCursor.getFirstSync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE uuid = ?`,
      uuid,
    );

    if (!row) return null;
    return RouteOrder.fromJSON(row.data);
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<RouteOrder>> {
    const routeOrderUuids = convertToArray(uuids);
    loggerRepositories.info(
      `Finding route orders with UUIDs: ${routeOrderUuids.length} items`,
    );

    if (routeOrderUuids.length === 0) return new RemoteEntityCollection([]);

    const placeholders = routeOrderUuids.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE uuid IN (${placeholders})`,
      ...routeOrderUuids,
    );

    if (rows.length === 0) {
      loggerRepositories.info(`No route orders found for provided UUIDs`);
      return new RemoteEntityCollection([]);
    }

    const routeOrders = rows.map((row) => RouteOrder.fromJSON(row.data));
    return new RemoteEntityCollection<RouteOrder>(routeOrders as RouteOrder[]);
  }

  findByIdsSync(uuids: string[]): RemoteEntityCollection<RouteOrder> {
    const routeOrderUuids = convertToArray(uuids);
    if (routeOrderUuids.length === 0) return new RemoteEntityCollection([]);

    const placeholders = routeOrderUuids.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE uuid IN (${placeholders})`,
      ...routeOrderUuids,
    );

    if (rows.length === 0) return new RemoteEntityCollection([]);
    return new RemoteEntityCollection(rows.map((row) => RouteOrder.fromJSON(row.data)));
  }

  async findAll(): Promise<RemoteEntityCollection<RouteOrder>> {
    loggerRepositories.info("Finding all route orders from the database");

    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} ORDER BY uuid DESC`,
    );

    if (rows.length === 0) {
      loggerRepositories.info("No route orders found in the database");
      return new RemoteEntityCollection([]);
    }

    const routeOrders = rows.map((row) => RouteOrder.fromJSON(row.data));
    return new RemoteEntityCollection<RouteOrder>(routeOrders as RouteOrder[]);
  }

  async remove(entity: RouteOrder | RouteOrder[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      loggerRepositories.info(`Removing route order with UUID: ${item.uuid}`);
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<RouteOrder>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");
    loggerRepositories.debug(
      `Finding route orders with remote state(s): ${states.join(", ")}`,
    );

    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE remote_state IN (${placeholder})`,
      ...states,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const routeOrders = rows.map((row) => RouteOrder.fromJSON(row.data));
    loggerRepositories.info(
      `Found ${routeOrders.length} route orders with state(s): ${states.join(", ")}`,
    );

    return new RemoteEntityCollection<RouteOrder>(routeOrders as RouteOrder[]);
  }

  async findByRemoteId(remoteId: number): Promise<RouteOrder | null> {
    loggerRepositories.debug(`Finding route order with remote ID: ${remoteId}`);

    const row = await DBCursor.getFirstAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) {
      loggerRepositories.info(`No route order found with remote ID: ${remoteId}`);
      return null;
    }

    loggerRepositories.info(`Route order with remote ID: ${remoteId} fetched successfully`);
    return RouteOrder.fromJSON(row.data);
  }

  findByRemoteIdSync(remoteId: number): RouteOrder | null {
    const row = DBCursor.getFirstSync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) return null;
    return RouteOrder.fromJSON(row.data);
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<RouteOrder>> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);

    loggerRepositories.debug(`Finding route orders with ${remoteIds.length} remote IDs`);

    const placeholders = remoteIds.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE remote_id IN (${placeholders})`,
      ...remoteIds,
    );

    if (rows.length === 0) {
      loggerRepositories.info(`No route orders found for provided remote IDs`);
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.info(`Found ${rows.length} route orders by remote IDs`);
    const routeOrders = rows.map((row) => RouteOrder.fromJSON(row.data));
    return new RemoteEntityCollection<RouteOrder>(routeOrders as RouteOrder[]);
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<RouteOrder> {
    if (remoteIds.length === 0) new RemoteEntityCollection([]);

    const placeholders = remoteIds.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.ROUTE_ORDERS} WHERE remote_id IN (${placeholders})`,
      ...remoteIds,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }
    return new RemoteEntityCollection(rows.map((row) => RouteOrder.fromJSON(row.data)));
  }

  async findByCriteria(
    criteria: ICriteria<RouteOrder>[],
  ): Promise<RemoteEntityCollection<RouteOrder>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }
}

export const RouteOrderRepository = new RouteOrderRepositoryImpl();
