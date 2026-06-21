import { IRemoteRepository } from "@sincpro/mobile/domain/database";
import {
  ERemoteState,
  ICriteria,
  RemoteEntityCollection,
} from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class CreditNoteRepositoryImpl implements IRemoteRepository<CreditNote> {
  public readonly name = EDistributionRepository.CREDIT_NOTE;
  public readonly table = DATABASE_TABLES.CREDIT_NOTES;
  async save(
    entities: CreditNote | CreditNote[] | RemoteEntityCollection<CreditNote>,
  ): Promise<void> {
    const items = RemoteEntityCollection.toArrayFrom(entities);
    loggerRepositories.debug(`Saving ${items.length} credit notes`);

    for (const item of items) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.CREDIT_NOTES} (uuid, data, name, remote_id, customer_id, remote_state) VALUES (?, ?, ?, ?, ?, ?)`,
        item.uuid,
        item.asJSON(),
        item.name || "Sin nombre",
        item.remoteId ?? null,
        item.customerId,
        item.remoteState,
      );
    }
    loggerRepositories.info(`${items.length} credit notes saved`);
  }

  async findById(uuid: string): Promise<CreditNote | null> {
    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE uuid = ?`,
      uuid,
    );
    return row ? CreditNote.fromJSON(row.data) : null;
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<CreditNote>> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE uuid IN (${placeholder})`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => CreditNote.fromJSON(r.data)));
  }

  async findAll(): Promise<RemoteEntityCollection<CreditNote>> {
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} ORDER BY uuid DESC`,
    );
    return new RemoteEntityCollection(rows.map((r) => CreditNote.fromJSON(r.data)));
  }

  async findByCriteria(
    criteria: ICriteria<CreditNote>[],
  ): Promise<RemoteEntityCollection<CreditNote>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }

  async remove(entity: CreditNote | CreditNote[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<CreditNote>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE remote_state IN (${placeholder})`,
      ...states,
    );
    return new RemoteEntityCollection(rows.map((r) => CreditNote.fromJSON(r.data)));
  }

  async findByRemoteId(remoteId: number): Promise<CreditNote | null> {
    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? CreditNote.fromJSON(row.data) : null;
  }

  async findByCustomerId(customerId: number): Promise<RemoteEntityCollection<CreditNote>> {
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE customer_id = ? ORDER BY uuid DESC`,
      customerId,
    );
    return new RemoteEntityCollection(rows.map((r) => CreditNote.fromJSON(r.data)));
  }

  findByIdSync(uuid: string): CreditNote | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE uuid = ?`,
      uuid,
    );
    return row ? CreditNote.fromJSON(row.data) : null;
  }

  findByIdsSync(uuids: string[]): RemoteEntityCollection<CreditNote> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE uuid IN (${placeholder}) ORDER BY uuid DESC`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => CreditNote.fromJSON(r.data)));
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<CreditNote>> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => CreditNote.fromJSON<CreditNote>(r.data));
    return new RemoteEntityCollection(entities);
  }

  findByRemoteIdSync(remoteId: number): CreditNote | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? CreditNote.fromJSON(row.data) : null;
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<CreditNote> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CREDIT_NOTES} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => CreditNote.fromJSON<CreditNote>(r.data));
    return new RemoteEntityCollection(entities);
  }
}

export const CreditNoteRepository = new CreditNoteRepositoryImpl();
