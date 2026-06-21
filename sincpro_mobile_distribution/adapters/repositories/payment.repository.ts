import { IRepository } from "@sincpro/mobile/domain/database";
import { EntityCollection, ICriteria } from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { EPaymentTargetType, Payment } from "@sincpro/mobile-distribution/domain/payment";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class PaymentRepositoryImpl implements IRepository<Payment, EntityCollection<Payment>> {
  public readonly name = EDistributionRepository.PAYMENT;
  public readonly table = DATABASE_TABLES.PAYMENTS;
  async save(entity: Payment | Payment[] | EntityCollection<Payment>): Promise<void> {
    const payments = EntityCollection.toArrayFrom(entity);
    loggerRepositories.debug(`Saving ${payments.length} payment(s)`);

    for (const payment of payments) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.PAYMENTS} (uuid, data, name) VALUES (?, ?, ?)`,
        payment.uuid,
        payment.asJSON(),
        payment.name || "Sin nombre",
      );
    }

    loggerRepositories.info(`${payments.length} payment(s) saved successfully`);
  }

  async findById(id: string): Promise<Payment | null> {
    loggerRepositories.debug(`Finding payment with ID: ${id}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENTS} WHERE uuid = ?`,
      id,
    );

    if (!row) return null;

    loggerRepositories.info(`Payment ${id} fetched successfully`);
    return Payment.fromJSON(row.data);
  }

  async findAll(): Promise<EntityCollection<Payment>> {
    loggerRepositories.info("Finding all payments");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENTS} ORDER BY uuid DESC`,
    );

    if (rows.length === 0) {
      return new EntityCollection([]);
    }

    const payments = rows.map((row) => Payment.fromJSON(row.data));
    return new EntityCollection<Payment>(payments as Payment[]);
  }

  async findByCriteria(criteria: ICriteria<Payment>[]): Promise<EntityCollection<Payment>> {
    loggerRepositories.info("Finding payments by criteria");
    const allPayments = await this.findAll();

    if (criteria.length === 0) {
      return allPayments;
    }

    const filtered = allPayments.filter((payment) => {
      return criteria.every((criterion) => {
        const value = payment[criterion.field as keyof Payment];
        return criterion.operator === "="
          ? value === criterion.value
          : value !== criterion.value;
      });
    });

    return new EntityCollection(filtered.toArray());
  }

  async findByIds(ids: string[]): Promise<EntityCollection<Payment>> {
    if (ids.length === 0) {
      return new EntityCollection([]);
    }

    loggerRepositories.debug(`Finding ${ids.length} payments by IDs`);
    const placeholder = ids.map(() => "?").join(",");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENTS} WHERE uuid IN (${placeholder}) ORDER BY uuid DESC`,
      ...ids,
    );

    if (rows.length === 0) {
      return new EntityCollection([]);
    }

    const payments = rows.map((row) => Payment.fromJSON<Payment>(row.data));
    loggerRepositories.info(`Found ${payments.length} payments`);
    return new EntityCollection<Payment>(payments);
  }

  async remove(entity: Payment | Payment[]): Promise<void> {
    const payments = Array.isArray(entity) ? entity : [entity];
    loggerRepositories.info(`Removing ${payments.length} payment(s)`);

    for (const payment of payments) {
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.PAYMENTS} WHERE uuid = ?`,
        payment.uuid,
      );
    }
  }

  async findByPaymentMethod(paymentMethodId: number): Promise<EntityCollection<Payment>> {
    loggerRepositories.info(`Finding payments by payment method ID: ${paymentMethodId}`);

    const allPayments = await this.findAll();
    const filtered = allPayments.filter(
      (payment) => payment.paymentMethod?.id === paymentMethodId,
    );

    return new EntityCollection(filtered.toArray());
  }

  async findCreditPayments(): Promise<EntityCollection<Payment>> {
    loggerRepositories.info("Finding credit payments (targetType = INVOICE or CREDIT_NOTE)");

    const allPayments = await this.findAll();
    const filtered = allPayments.filter(
      (payment) =>
        payment.targetType === EPaymentTargetType.INVOICE ||
        payment.targetType === EPaymentTargetType.CREDIT_NOTE,
    );

    return new EntityCollection(filtered.toArray());
  }

  async findOrderPayments(): Promise<EntityCollection<Payment>> {
    loggerRepositories.info("Finding order payments (targetType = SALE_ORDER)");

    const allPayments = await this.findAll();
    const filtered = allPayments.filter(
      (payment) => payment.targetType === EPaymentTargetType.SALE_ORDER,
    );

    return new EntityCollection(filtered.toArray());
  }

  findByIdSync(uuid: string): Payment | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENTS} WHERE uuid = ?`,
      uuid,
    );
    return row ? Payment.fromJSON(row.data) : null;
  }

  findByIdsSync(uuids: string[]): EntityCollection<Payment> {
    if (uuids.length === 0) return new EntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PAYMENTS} WHERE uuid IN (${placeholder}) ORDER BY uuid DESC`,
      ...uuids,
    );
    return new EntityCollection(rows.map((r) => Payment.fromJSON(r.data)));
  }
}

export const PaymentRepository = new PaymentRepositoryImpl();
