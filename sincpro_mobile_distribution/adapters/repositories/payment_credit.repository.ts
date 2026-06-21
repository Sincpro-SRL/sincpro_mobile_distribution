import { IRemoteRepository } from "@sincpro/mobile/domain/database";
import {
  ERemoteState,
  ICriteria,
  RemoteEntityCollection,
} from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import { PaymentCredit } from "@sincpro/mobile-distribution/domain/payment/payment_credit";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class PaymentCreditRepositoryImpl implements IRemoteRepository<PaymentCredit> {
  public readonly name = EDistributionRepository.PAYMENT_CREDIT;
  public readonly table = DATABASE_TABLES.PAYMENT_CREDITS;
  async save(
    entities: PaymentCredit | PaymentCredit[] | RemoteEntityCollection<PaymentCredit>,
  ): Promise<void> {
    const items = RemoteEntityCollection.toArrayFrom(entities);
    loggerRepositories.debug(`Saving ${items.length} payment credits`);

    for (const item of items) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.PAYMENT_CREDITS} (uuid, data, name, remote_id, customer_id, remote_state) VALUES (?, ?, ?, ?, ?, ?)`,
        item.uuid,
        item.asJSON(),
        item.name || "Sin nombre",
        item.remoteId ?? null,
        item.customerId,
        item.remoteState,
      );
    }
    loggerRepositories.info(`${items.length} payment credits saved`);
  }

  async findById(uuid: string): Promise<PaymentCredit | null> {
    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE uuid = ?`,
      uuid,
    );
    return row ? PaymentCredit.fromJSON(row.data) : null;
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<PaymentCredit>> {
    if (uuids.length === 0) return new RemoteEntityCollection<PaymentCredit>([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE uuid IN (${placeholder}) ORDER BY uuid DESC`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => PaymentCredit.fromJSON(r.data)));
  }

  async findAll(): Promise<RemoteEntityCollection<PaymentCredit>> {
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} ORDER BY uuid DESC`,
    );
    return new RemoteEntityCollection(rows.map((r) => PaymentCredit.fromJSON(r.data)));
  }

  async findByCriteria(
    criteria: ICriteria<PaymentCredit>[],
  ): Promise<RemoteEntityCollection<PaymentCredit>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }

  async remove(entity: PaymentCredit | PaymentCredit[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<PaymentCredit>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE remote_state IN (${placeholder})`,
      ...states,
    );
    return new RemoteEntityCollection(rows.map((r) => PaymentCredit.fromJSON(r.data)));
  }

  async findByRemoteId(remoteId: number): Promise<PaymentCredit | null> {
    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? PaymentCredit.fromJSON(row.data) : null;
  }

  async findByCustomerId(customerId: number): Promise<RemoteEntityCollection<PaymentCredit>> {
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE customer_id = ? ORDER BY uuid DESC`,
      customerId,
    );
    return new RemoteEntityCollection(rows.map((r) => PaymentCredit.fromJSON(r.data)));
  }

  findByIdSync(uuid: string): PaymentCredit | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE uuid = ?`,
      uuid,
    );
    return row ? PaymentCredit.fromJSON(row.data) : null;
  }

  findByIdsSync(uuids: string[]): RemoteEntityCollection<PaymentCredit> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE uuid IN (${placeholder}) ORDER BY uuid DESC`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => PaymentCredit.fromJSON(r.data)));
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<PaymentCredit>> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => PaymentCredit.fromJSON(r.data));
    return new RemoteEntityCollection<PaymentCredit>(entities as PaymentCredit[]);
  }

  findByRemoteIdSync(remoteId: number): PaymentCredit | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? PaymentCredit.fromJSON(row.data) : null;
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<PaymentCredit> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_CREDITS} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => PaymentCredit.fromJSON(r.data));
    return new RemoteEntityCollection<PaymentCredit>(entities as PaymentCredit[]);
  }
}

export const PaymentCreditRepository = new PaymentCreditRepositoryImpl();
