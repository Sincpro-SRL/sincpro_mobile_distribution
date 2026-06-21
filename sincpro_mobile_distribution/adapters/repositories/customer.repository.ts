import { IRemoteRepository } from "@sincpro/mobile/domain/database";
import {
  ERemoteState,
  ICriteria,
  RemoteEntityCollection,
} from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class CustomerRepositoryImpl implements IRemoteRepository<Customer> {
  public readonly name = EDistributionRepository.CUSTOMER;
  public readonly table = DATABASE_TABLES.CUSTOMERS;
  async save(
    customers: Customer[] | Customer | RemoteEntityCollection<Customer>,
  ): Promise<void> {
    const convertedCustomers = RemoteEntityCollection.toArrayFrom(customers);
    loggerRepositories.debug(`Saving ${convertedCustomers.length} customers to the database`);

    for (const customer of convertedCustomers) {
      if (!customer.id && customer.remoteId) {
        customer.id = customer.remoteId;
      }

      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.CUSTOMERS} (uuid, data, name, remote_id, remote_state) VALUES (?, ?, ?, ?, ?)`,
        customer.uuid,
        customer.asJSON(),
        customer.name ?? "",
        customer.remoteId ?? null,
        customer.remoteState,
      );
    }

    loggerRepositories.info(`Customers ${convertedCustomers.length} saved successfully`);
  }

  async findById(uuid: string): Promise<Customer | null> {
    loggerRepositories.debug(`Finding customer with UUID: ${uuid}`);

    const row = await DBCursor.getFirstAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data
       FROM ${DATABASE_TABLES.CUSTOMERS}
       WHERE uuid = ?`,
      uuid,
    );

    if (!row) return null;

    loggerRepositories.info(`Customer with UUID: ${uuid} fetched successfully`);
    return Customer.fromJSON(row.data);
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<Customer>> {
    const customerUuids = convertToArray(uuids);
    loggerRepositories.info(`Finding customers with UUIDs: ${customerUuids.length} items`);

    const placeholders = customerUuids.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data
       FROM ${DATABASE_TABLES.CUSTOMERS}
       WHERE uuid IN (${placeholders})
       ORDER BY name DESC`,
      ...customerUuids,
    );

    if (rows.length === 0) {
      loggerRepositories.info(`No customers found for provided UUIDs`);
      return new RemoteEntityCollection([]);
    }

    const customers = rows.map((row) => Customer.fromJSON<Customer>(row.data));
    return new RemoteEntityCollection(customers);
  }

  async findAll(): Promise<RemoteEntityCollection<Customer>> {
    loggerRepositories.info("Finding all customers from the database");

    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data FROM ${DATABASE_TABLES.CUSTOMERS} ORDER BY name DESC`,
    );

    if (rows.length === 0) {
      loggerRepositories.info("No customers found in the database");
      return new RemoteEntityCollection([]);
    }

    const customers = rows.map((row) => Customer.fromJSON<Customer>(row.data));
    return new RemoteEntityCollection(customers);
  }

  async findByCriteria(
    criteria: ICriteria<Customer>[],
  ): Promise<RemoteEntityCollection<Customer>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }

  async remove(entity: Customer | Customer[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      loggerRepositories.info(`Removing customer with UUID: ${item.uuid}`);
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.CUSTOMERS} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByString(searchString: string): Promise<RemoteEntityCollection<Customer>> {
    loggerRepositories.debug(`Searching customers with string: "${searchString}"`);

    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data
       FROM ${DATABASE_TABLES.CUSTOMERS}
       WHERE name COLLATE NOCASE LIKE ? 
       OR json_extract(data, '$.vat') COLLATE NOCASE LIKE ?
       ORDER BY name DESC`,
      `%${searchString}%`,
      `${searchString}%`,
    );

    if (rows.length === 0) {
      loggerRepositories.info(`No customers found for search: "${searchString}"`);
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.info(`Found ${rows.length} customers matching: "${searchString}"`);
    const customers = rows.map((row) => Customer.fromJSON<Customer>(row.data));
    return new RemoteEntityCollection(customers);
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<Customer>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");
    loggerRepositories.debug(`Finding customers with remote state(s): ${states.join(", ")}`);

    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data 
       FROM ${DATABASE_TABLES.CUSTOMERS} 
       WHERE remote_state IN (${placeholder})
       ORDER BY name DESC`,
      ...states,
    );

    if (rows.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const customers = rows.map((row) => Customer.fromJSON<Customer>(row.data));

    loggerRepositories.info(
      `Found ${customers.length} customers with state(s): ${states.join(", ")}`,
    );

    return new RemoteEntityCollection(customers);
  }

  async findByRemoteId(remoteId: number): Promise<Customer | null> {
    loggerRepositories.debug(`Finding customer with remote ID: ${remoteId}`);

    const row = await DBCursor.getFirstAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data
       FROM ${DATABASE_TABLES.CUSTOMERS}
       WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) {
      loggerRepositories.info(`No customer found with remote ID: ${remoteId}`);
      return null;
    }

    loggerRepositories.info(`Customer with remote ID: ${remoteId} fetched successfully`);
    return Customer.fromJSON(row.data);
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<Customer>> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);

    loggerRepositories.debug(`Finding customers with ${remoteIds.length} remote IDs`);

    const placeholders = remoteIds.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ uuid: string; data: string }>(
      `SELECT uuid, data
       FROM ${DATABASE_TABLES.CUSTOMERS}
       WHERE remote_id IN (${placeholders})
       ORDER BY name DESC`,
      ...remoteIds,
    );

    if (rows.length === 0) {
      loggerRepositories.info(`No customers found for provided remote IDs`);
      return new RemoteEntityCollection([]);
    }

    loggerRepositories.info(`Found ${rows.length} customers by remote IDs`);
    const customers = rows.map((row) => Customer.fromJSON<Customer>(row.data));
    return new RemoteEntityCollection(customers);
  }

  findByIdSync(uuid: string): Customer | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CUSTOMERS} WHERE uuid = ?`,
      uuid,
    );
    return row ? Customer.fromJSON(row.data) : null;
  }

  findByIdsSync(uuids: string[]): RemoteEntityCollection<Customer> {
    if (uuids.length === 0) return new RemoteEntityCollection([]);
    const placeholder = uuids.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CUSTOMERS} WHERE uuid IN (${placeholder})`,
      ...uuids,
    );
    return new RemoteEntityCollection(rows.map((r) => Customer.fromJSON<Customer>(r.data)));
  }

  findByRemoteIdSync(remoteId: number): Customer | null {
    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CUSTOMERS} WHERE remote_id = ?`,
      remoteId,
    );
    return row ? Customer.fromJSON(row.data) : null;
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<Customer> {
    if (remoteIds.length === 0) return new RemoteEntityCollection([]);
    const placeholder = remoteIds.map(() => "?").join(",");
    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.CUSTOMERS} WHERE remote_id IN (${placeholder})`,
      ...remoteIds,
    );
    const entities = rows.map((r) => Customer.fromJSON<Customer>(r.data));
    return new RemoteEntityCollection(entities);
  }
}

export const CustomerRepository = new CustomerRepositoryImpl();
