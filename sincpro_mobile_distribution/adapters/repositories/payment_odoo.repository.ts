import { IRemoteRepository } from "@sincpro/mobile/domain/database";
import {
  ERemoteState,
  ICriteria,
  RemoteEntityCollection,
} from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import { ESourceModel, PaymentOdoo } from "@sincpro/mobile-distribution/domain/payment";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class PaymentOdooRepositoryImpl implements IRemoteRepository<PaymentOdoo> {
  public readonly name = EDistributionRepository.PAYMENT_ODOO;
  public readonly table = DATABASE_TABLES.PAYMENT_ODOO;
  async save(
    entity: PaymentOdoo | PaymentOdoo[] | RemoteEntityCollection<PaymentOdoo>,
  ): Promise<void> {
    const payments = RemoteEntityCollection.toArrayFrom(entity);
    loggerRepositories.debug(`Saving ${payments.length} payment odoo(s)`);

    for (const payment of payments) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.PAYMENT_ODOO} (uuid, data, name, remote_id, payment_method_id, source_model, remote_state) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        payment.uuid,
        payment.asJSON(),
        payment.name || "Sin nombre",
        payment.remoteId ?? null,
        payment.paymentMethod?.id ?? null,
        payment.targetRemoteModel ?? null,
        payment.remoteState,
      );
    }

    loggerRepositories.info(`${payments.length} payment odoo(s) saved successfully`);
  }

  async findById(id: string): Promise<PaymentOdoo | null> {
    loggerRepositories.debug(`Finding payment odoo with ID: ${id}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE uuid = ?`,
      id,
    );

    if (!row) return null;

    loggerRepositories.info(`Payment odoo ${id} fetched successfully`);
    return PaymentOdoo.fromJSON(row.data);
  }

  async findAll(): Promise<RemoteEntityCollection<PaymentOdoo>> {
    loggerRepositories.info("Finding all payment odoo");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} ORDER BY uuid DESC`,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const payments = rows.map((row) => PaymentOdoo.fromJSON(row.data));
    return new RemoteEntityCollection<PaymentOdoo>(payments as PaymentOdoo[]);
  }

  async findByCriteria(
    criteria: ICriteria<PaymentOdoo>[],
  ): Promise<RemoteEntityCollection<PaymentOdoo>> {
    loggerRepositories.info("Finding payment odoo by criteria");
    const allPayments = await this.findAll();

    if (criteria.length === 0) {
      return allPayments;
    }

    const filtered = allPayments.filter((payment) => {
      return criteria.every((criterion) => {
        const value = payment[criterion.field as keyof PaymentOdoo];
        return criterion.operator === "="
          ? value === criterion.value
          : value !== criterion.value;
      });
    });

    return new RemoteEntityCollection(filtered.toArray());
  }

  async findByIds(ids: string[]): Promise<RemoteEntityCollection<PaymentOdoo>> {
    if (ids.length === 0) {
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.debug(`Finding ${ids.length} payment odoo by IDs`);
    const placeholder = ids.map(() => "?").join(",");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE id IN (${placeholder}) ORDER BY uuid DESC`,
      ...ids,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const payments = rows.map((row) => PaymentOdoo.fromJSON(row.data));
    loggerRepositories.info(`Found ${payments.length} payment odoo`);
    return new RemoteEntityCollection<PaymentOdoo>(payments as PaymentOdoo[]);
  }

  async remove(entity: PaymentOdoo | PaymentOdoo[]): Promise<void> {
    const payments = Array.isArray(entity) ? entity : [entity];
    loggerRepositories.info(`Removing ${payments.length} payment odoo(s)`);

    for (const payment of payments) {
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE uuid = ?`,
        payment.uuid,
      );
    }
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<PaymentOdoo>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");

    loggerRepositories.debug(`Finding payment odoo by remote state: ${states.join(", ")}`);

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE remote_state IN (${placeholder})`,
      ...states,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const payments = rows.map((row) => PaymentOdoo.fromJSON(row.data));
    return new RemoteEntityCollection<PaymentOdoo>(payments as PaymentOdoo[]);
  }

  async findByRemoteId(remoteId: number): Promise<PaymentOdoo | null> {
    loggerRepositories.debug(`Finding payment odoo by remote ID: ${remoteId}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) return null;

    loggerRepositories.info(`Payment odoo with remote ID ${remoteId} fetched successfully`);
    return PaymentOdoo.fromJSON(row.data);
  }

  async findByPaymentMethod(
    paymentMethodId: number,
  ): Promise<RemoteEntityCollection<PaymentOdoo>> {
    loggerRepositories.info(`Finding payment odoo by payment method ID: ${paymentMethodId}`);

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE payment_method_id = ?`,
      paymentMethodId,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const payments = rows.map((row) => PaymentOdoo.fromJSON(row.data));
    return new RemoteEntityCollection<PaymentOdoo>(payments as PaymentOdoo[]);
  }

  async findCreditPayments(): Promise<RemoteEntityCollection<PaymentOdoo>> {
    loggerRepositories.info("Finding credit payment odoo (source_model = INVOICE)");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE source_model = ? ORDER BY uuid DESC`,
      ESourceModel.INVOICE,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const payments = rows.map((row) => PaymentOdoo.fromJSON(row.data));
    return new RemoteEntityCollection<PaymentOdoo>(payments as PaymentOdoo[]);
  }

  async findOrderPayments(): Promise<RemoteEntityCollection<PaymentOdoo>> {
    loggerRepositories.info("Finding order payment odoo (source_model = ORDER)");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE source_model = ? ORDER BY uuid DESC`,
      ESourceModel.ORDER,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const payments = rows.map((row) => PaymentOdoo.fromJSON(row.data));
    return new RemoteEntityCollection<PaymentOdoo>(payments as PaymentOdoo[]);
  }

  findByIdSync(uuid: string): PaymentOdoo | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE uuid = ?`,
      uuid,
    );
    return row ? PaymentOdoo.fromJSON(row.data) : null;
  }

  findByIdsSync(uuids: string[]): RemoteEntityCollection<PaymentOdoo> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE uuid IN (${placeholder}) ORDER BY uuid DESC`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => PaymentOdoo.fromJSON(r.data)));
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<PaymentOdoo>> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => PaymentOdoo.fromJSON(r.data));
    return new RemoteEntityCollection<PaymentOdoo>(entities as PaymentOdoo[]);
  }

  findByRemoteIdSync(remoteId: number): PaymentOdoo | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? PaymentOdoo.fromJSON(row.data) : null;
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<PaymentOdoo> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENT_ODOO} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => PaymentOdoo.fromJSON(r.data));
    return new RemoteEntityCollection<PaymentOdoo>(entities as PaymentOdoo[]);
  }
}

export const PaymentOdooRepository = new PaymentOdooRepositoryImpl();
