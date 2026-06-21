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
import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class SaleOrderRepositoryImpl implements IRemoteRepository<SaleOrder> {
  public readonly name = EDistributionRepository.SALE_ORDER;
  public readonly table = DATABASE_TABLES.SALE_ORDERS;
  async save(
    entities: SaleOrder | SaleOrder[] | RemoteEntityCollection<SaleOrder>,
  ): Promise<void> {
    const items = RemoteEntityCollection.toArrayFrom(entities);
    loggerRepositories.debug(`Saving ${items.length} sale orders`);

    for (const item of items) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.SALE_ORDERS} (uuid, data, name, remote_id, route_id, remote_state) VALUES (?, ?, ?, ?, ?, ?)`,
        item.uuid,
        item.asJSON(),
        item.name || "Sin nombre",
        item.remoteId ?? null,
        item.routeId ?? null,
        item.remoteState,
      );
    }
    loggerRepositories.info(`${items.length} sale orders saved`);
  }

  async findById(uuid: string): Promise<SaleOrder | null> {
    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE uuid = ?`,
      uuid,
    );
    return row ? SaleOrder.fromJSON(row.data) : null;
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<SaleOrder>> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE uuid IN (${placeholder})`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => SaleOrder.fromJSON(r.data)));
  }

  async findAll(): Promise<RemoteEntityCollection<SaleOrder>> {
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} ORDER BY uuid DESC`,
    );
    return new RemoteEntityCollection(rows.map((r) => SaleOrder.fromJSON(r.data)));
  }

  async findByCriteria(
    criteria: ICriteria<SaleOrder>[],
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }

  async remove(entity: SaleOrder | SaleOrder[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE remote_state IN (${placeholder})`,
      ...states,
    );
    return new RemoteEntityCollection(rows.map((r) => SaleOrder.fromJSON(r.data)));
  }

  async findByRemoteId(remoteId: number): Promise<SaleOrder | null> {
    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? SaleOrder.fromJSON(row.data) : null;
  }

  async findByRouteId(routeId: number): Promise<RemoteEntityCollection<SaleOrder>> {
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE route_id = ? ORDER BY uuid DESC`,
      routeId,
    );
    return new RemoteEntityCollection(rows.map((r) => SaleOrder.fromJSON(r.data)));
  }

  findByIdSync(uuid: string): SaleOrder | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE uuid = ?`,
      uuid,
    );
    return row ? SaleOrder.fromJSON(row.data) : null;
  }

  findByIdsSync(uuids: string[]): RemoteEntityCollection<SaleOrder> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE uuid IN (${placeholder}) ORDER BY uuid DESC`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => SaleOrder.fromJSON(r.data)));
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<SaleOrder>> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => SaleOrder.fromJSON(r.data));
    return new RemoteEntityCollection(entities);
  }

  findByRemoteIdSync(remoteId: number): SaleOrder | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? SaleOrder.fromJSON(row.data) : null;
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<SaleOrder> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.SALE_ORDERS} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => SaleOrder.fromJSON(r.data));
    return new RemoteEntityCollection(entities);
  }
}

export const SaleOrderRepository = new SaleOrderRepositoryImpl();
