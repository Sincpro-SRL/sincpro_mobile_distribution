import { IRemoteRepository } from "@sincpro/mobile/domain/database";
import {
  ERemoteState,
  ICriteria,
  RemoteEntityCollection,
} from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import { Product } from "@sincpro/mobile-distribution/domain/product";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class ProductRepositoryImpl implements IRemoteRepository<Product> {
  public readonly name = EDistributionRepository.PRODUCT;
  public readonly table = DATABASE_TABLES.PRODUCTS;
  async save(entity: Product[] | Product | RemoteEntityCollection<Product>): Promise<void> {
    const products = RemoteEntityCollection.toArrayFrom(entity);
    loggerRepositories.debug(`Saving ${products.length} product(s)`);

    for (const product of products) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.PRODUCTS} (uuid, data, remote_id, name, remote_state) VALUES (?, ?, ?, ?, ?)`,
        product.uuid,
        product.asJSON(),
        product.remoteId ?? null,
        product.name,
        product.remoteState,
      );
    }

    loggerRepositories.info(`${products.length} product(s) saved successfully`);
  }

  async findById(uuid: string): Promise<Product | null> {
    loggerRepositories.debug(`Finding product with UUID: ${uuid}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE uuid = ?`,
      uuid,
    );

    if (!row) {
      loggerRepositories.debug(`Product ${uuid} not found`);
      return null;
    }

    loggerRepositories.info(`Product ${uuid} fetched successfully`);
    return Product.fromJSON(row.data);
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<Product>> {
    const uuidArray = convertToArray(uuids);
    const placeholder = uuidArray.map(() => "?").join(",");

    loggerRepositories.debug(`Finding products with UUIDs: ${uuidArray.length} items`);

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE uuid IN (${placeholder})`,
      ...uuidArray,
    );

    const products = rows.map((row) => Product.fromJSON(row.data));
    return new RemoteEntityCollection(products);
  }

  async findAll(): Promise<RemoteEntityCollection<Product>> {
    loggerRepositories.info("Finding all products");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} ORDER BY uuid DESC`,
    );

    const products = rows.map((row) => Product.fromJSON(row.data));
    return new RemoteEntityCollection(products);
  }

  async findByCriteria(
    criteria: ICriteria<Product>[],
  ): Promise<RemoteEntityCollection<Product>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }

  async remove(entity: Product | Product[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      loggerRepositories.info(`Removing product ${item.uuid}`);
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.PRODUCTS} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByRemoteId(remoteId: number): Promise<Product | null> {
    loggerRepositories.debug(`Finding product with remote_id: ${remoteId}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) {
      loggerRepositories.debug(`Product with remote_id ${remoteId} not found`);
      return null;
    }

    loggerRepositories.info(`Product with remote_id ${remoteId} fetched successfully`);
    return Product.fromJSON(row.data);
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<Product>> {
    const remoteIdArray = convertToArray(remoteIds);
    const placeholder = remoteIdArray.map(() => "?").join(",");

    loggerRepositories.debug(
      `Finding products with remote_ids: ${remoteIdArray.length} items`,
    );

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE remote_id IN (${placeholder})`,
      ...remoteIdArray,
    );

    const products = rows.map((row) => Product.fromJSON(row.data));
    return new RemoteEntityCollection(products);
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<Product>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");

    loggerRepositories.debug(`Finding products with remote_state in: ${states.join(", ")}`);

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE remote_state IN (${placeholder})`,
      ...states,
    );

    const products = rows.map((row) => Product.fromJSON(row.data));
    return new RemoteEntityCollection(products);
  }

  async findByString(searchString: string): Promise<RemoteEntityCollection<Product>> {
    loggerRepositories.debug(`Searching products with string: ${searchString}`);

    const searchPattern = `%${searchString}%`;
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} 
       WHERE name LIKE ? OR code LIKE ? OR barcode LIKE ?`,
      searchPattern,
      searchPattern,
      searchPattern,
    );

    loggerRepositories.info(`Found ${rows.length} products matching search`);
    const products = rows.map((row) => Product.fromJSON(row.data));
    return new RemoteEntityCollection(products);
  }

  findByIdSync(uuid: string): Product | null {
    loggerRepositories.debug(`Finding product with UUID (sync): ${uuid}`);

    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE uuid = ?`,
      uuid,
    );

    if (!row) {
      loggerRepositories.debug(`Product ${uuid} not found`);
      return null;
    }

    loggerRepositories.info(`Product ${uuid} fetched successfully (sync)`);
    return Product.fromJSON(row.data);
  }

  findByIdsSync(uuids: string[]): RemoteEntityCollection<Product> {
    const uuidArray = convertToArray(uuids);
    const placeholder = uuidArray.map(() => "?").join(",");

    loggerRepositories.debug(`Finding products with UUIDs (sync): ${uuidArray.length} items`);

    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE uuid IN (${placeholder})`,
      ...uuidArray,
    );

    const products = rows.map((row) => Product.fromJSON(row.data));
    return new RemoteEntityCollection(products);
  }

  findByRemoteIdSync(remoteId: number): Product | null {
    loggerRepositories.debug(`Finding product with remote_id (sync): ${remoteId}`);

    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) {
      loggerRepositories.debug(`Product with remote_id ${remoteId} not found`);
      return null;
    }

    loggerRepositories.info(`Product with remote_id ${remoteId} fetched successfully (sync)`);
    return Product.fromJSON(row.data);
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<Product> {
    const remoteIdArray = convertToArray(remoteIds);
    const placeholder = remoteIdArray.map(() => "?").join(",");

    loggerRepositories.debug(
      `Finding products with remote_ids (sync): ${remoteIdArray.length} items`,
    );

    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRODUCTS} WHERE remote_id IN (${placeholder})`,
      ...remoteIdArray,
    );

    const products = rows.map((row) => Product.fromJSON(row.data));
    return new RemoteEntityCollection(products);
  }
}

export const ProductRepository = new ProductRepositoryImpl();
