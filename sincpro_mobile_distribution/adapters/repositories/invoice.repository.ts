import { IRemoteRepository } from "@sincpro/mobile/domain/database";
import {
  ERemoteState,
  ICriteria,
  RemoteEntityCollection,
} from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class InvoiceRepositoryImpl implements IRemoteRepository<Invoice> {
  public readonly name = EDistributionRepository.INVOICE;
  public readonly table = DATABASE_TABLES.INVOICES;
  async save(entities: Invoice | Invoice[] | RemoteEntityCollection<Invoice>): Promise<void> {
    const items = RemoteEntityCollection.toArrayFrom(entities);
    loggerRepositories.debug(`Saving ${items.length} invoices`);

    for (const item of items) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.INVOICES} (uuid, data, name, remote_id, customer_id, remote_state) VALUES (?, ?, ?, ?, ?, ?)`,
        item.uuid,
        item.asJSON(),
        item.name || "Sin nombre",
        item.remoteId ?? null,
        item.customerId,
        item.remoteState,
      );
    }
    loggerRepositories.info(`${items.length} invoices saved`);
  }

  async findById(uuid: string): Promise<Invoice | null> {
    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE uuid = ?`,
      uuid,
    );
    return row ? Invoice.fromJSON(row.data) : null;
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<Invoice>> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE uuid IN (${placeholder})`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => Invoice.fromJSON(r.data)));
  }

  async findAll(): Promise<RemoteEntityCollection<Invoice>> {
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} ORDER BY uuid DESC`,
    );
    return new RemoteEntityCollection(rows.map((r) => Invoice.fromJSON(r.data)));
  }

  async findByCriteria(
    criteria: ICriteria<Invoice>[],
  ): Promise<RemoteEntityCollection<Invoice>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }

  async remove(entity: Invoice | Invoice[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.INVOICES} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<Invoice>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE remote_state IN (${placeholder})`,
      ...states,
    );
    return new RemoteEntityCollection(rows.map((r) => Invoice.fromJSON(r.data)));
  }

  async findByRemoteId(remoteId: number): Promise<Invoice | null> {
    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? Invoice.fromJSON(row.data) : null;
  }

  async findByCustomerId(customerId: number): Promise<RemoteEntityCollection<Invoice>> {
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE customer_id = ? ORDER BY uuid DESC`,
      customerId,
    );
    return new RemoteEntityCollection(rows.map((r) => Invoice.fromJSON(r.data)));
  }

  findByIdSync(uuid: string): Invoice | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE uuid = ?`,
      uuid,
    );
    return row ? Invoice.fromJSON(row.data) : null;
  }

  findByIdsSync(uuids: string[]): RemoteEntityCollection<Invoice> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE uuid IN (${placeholder}) ORDER BY uuid DESC`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => Invoice.fromJSON(r.data)));
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<Invoice>> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => Invoice.fromJSON(r.data));
    return new RemoteEntityCollection(entities);
  }

  findByRemoteIdSync(remoteId: number): Invoice | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? Invoice.fromJSON(row.data) : null;
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<Invoice> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.INVOICES} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => Invoice.fromJSON(r.data));
    return new RemoteEntityCollection(entities);
  }
}

export const InvoiceRepository = new InvoiceRepositoryImpl();
