import { IRemoteRepository } from "@sincpro/mobile/domain/database";
import {
  ERemoteState,
  ICriteria,
  RemoteEntityCollection,
} from "@sincpro/mobile/domain/entity";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";
import { loggerRepositories } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import { PriceList } from "@sincpro/mobile-distribution/domain/product/price_list";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { DATABASE_TABLES } from "@sincpro/mobile-distribution/entrypoints/db/migrations";

class PriceListRepositoryImpl implements IRemoteRepository<PriceList> {
  public readonly name = EDistributionRepository.PRICE_LIST;
  public readonly table = DATABASE_TABLES.PRICE_LISTS;
  async save(
    entity: PriceList[] | PriceList | RemoteEntityCollection<PriceList>,
  ): Promise<void> {
    const priceLists = RemoteEntityCollection.toArrayFrom(entity);
    loggerRepositories.debug(`Saving ${priceLists.length} price list(s)`);

    for (const priceList of priceLists) {
      await DBCursor.mutateDatabase(
        `INSERT OR REPLACE INTO ${DATABASE_TABLES.PRICE_LISTS} (uuid, data, remote_id, name, remote_state) VALUES (?, ?, ?, ?, ?)`,
        priceList.uuid,
        priceList.asJSON(),
        priceList.remoteId ?? null,
        priceList.name,
        priceList.remoteState,
      );
    }

    loggerRepositories.info(`${priceLists.length} price list(s) saved successfully`);
  }

  async findById(uuid: string): Promise<PriceList | null> {
    loggerRepositories.debug(`Finding price list with UUID: ${uuid}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRICE_LISTS} WHERE uuid = ?`,
      uuid,
    );

    if (!row) {
      loggerRepositories.debug(`Price list ${uuid} not found`);
      return null;
    }

    loggerRepositories.info(`Price list ${uuid} fetched successfully`);
    return PriceList.fromJSON(row.data);
  }

  async findByIds(uuids: string[]): Promise<RemoteEntityCollection<PriceList>> {
    const uuidArray = convertToArray(uuids);
    const placeholder = uuidArray.map(() => "?").join(",");

    loggerRepositories.debug(`Finding price lists with UUIDs: ${uuidArray.length} items`);

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRICE_LISTS} WHERE uuid IN (${placeholder})`,
      ...uuidArray,
    );

    const priceLists = rows.map((row) => PriceList.fromJSON(row.data));
    return new RemoteEntityCollection<PriceList>(priceLists as PriceList[]);
  }

  async findAll(): Promise<RemoteEntityCollection<PriceList>> {
    loggerRepositories.info("Finding all price lists");

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRICE_LISTS} ORDER BY uuid DESC`,
    );

    const priceLists = rows.map((row) => PriceList.fromJSON(row.data));
    return new RemoteEntityCollection<PriceList>(priceLists as PriceList[]);
  }

  async findByCriteria(
    criteria: ICriteria<PriceList>[],
  ): Promise<RemoteEntityCollection<PriceList>> {
    const all = await this.findAll();
    return all.findByCriteria(criteria);
  }

  async remove(entity: PriceList | PriceList[]): Promise<void> {
    const items = convertToArray(entity);
    for (const item of items) {
      loggerRepositories.info(`Removing price list ${item.uuid}`);
      await DBCursor.mutateDatabase(
        `DELETE FROM ${DATABASE_TABLES.PRICE_LISTS} WHERE uuid = ?`,
        item.uuid,
      );
    }
  }

  async findByRemoteState(
    state: ERemoteState | ERemoteState[],
  ): Promise<RemoteEntityCollection<PriceList>> {
    const states = convertToArray(state);
    const placeholder = states.map(() => "?").join(",");
    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRICE_LISTS} WHERE remote_state IN (${placeholder})`,
      ...states,
    );
    return new RemoteEntityCollection(rows.map((r) => PriceList.fromJSON(r.data)));
  }

  async findByRemoteId(remoteId: number): Promise<PriceList | null> {
    loggerRepositories.debug(`Finding price list with remote_id: ${remoteId}`);

    const row = await DBCursor.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRICE_LISTS} WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) {
      loggerRepositories.debug(`Price list with remote_id ${remoteId} not found`);
      return null;
    }

    loggerRepositories.info(`Price list with remote_id ${remoteId} fetched successfully`);
    return PriceList.fromJSON(row.data);
  }

  async findByRemoteIds(remoteIds: number[]): Promise<RemoteEntityCollection<PriceList>> {
    const remoteIdArray = convertToArray(remoteIds);
    const placeholder = remoteIdArray.map(() => "?").join(",");

    loggerRepositories.debug(
      `Finding price lists with remote_ids: ${remoteIdArray.length} items`,
    );

    const rows = await DBCursor.getAllAsync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRICE_LISTS} WHERE remote_id IN (${placeholder})`,
      ...remoteIdArray,
    );

    const priceLists = rows.map((row) => PriceList.fromJSON(row.data));
    return new RemoteEntityCollection<PriceList>(priceLists as PriceList[]);
  }

  findByRemoteIdSync(remoteId: number): PriceList | null {
    loggerRepositories.debug(`Finding price list with remote_id (sync): ${remoteId}`);

    const row = DBCursor.getFirstSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRICE_LISTS} WHERE remote_id = ?`,
      remoteId,
    );

    if (!row) {
      loggerRepositories.debug(`Price list with remote_id ${remoteId} not found`);
      return null;
    }

    loggerRepositories.info(
      `Price list with remote_id ${remoteId} fetched successfully (sync)`,
    );
    return PriceList.fromJSON(row.data);
  }

  findByRemoteIdsSync(remoteIds: number[]): RemoteEntityCollection<PriceList> {
    const remoteIdArray = convertToArray(remoteIds);
    const placeholder = remoteIdArray.map(() => "?").join(",");

    loggerRepositories.debug(
      `Finding price lists with remote_ids (sync): ${remoteIdArray.length} items`,
    );

    const rows = DBCursor.getAllSync<{ data: string }>(
      `SELECT data FROM ${DATABASE_TABLES.PRICE_LISTS} WHERE remote_id IN (${placeholder})`,
      ...remoteIdArray,
    );

    const priceLists = rows.map((row) => PriceList.fromJSON(row.data));
    return new RemoteEntityCollection<PriceList>(priceLists as PriceList[]);
  }
}

export const PriceListRepository = new PriceListRepositoryImpl();
