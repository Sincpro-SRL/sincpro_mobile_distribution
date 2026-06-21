import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";

import { EDistributionDomainRepository } from "../repository";

export type PriceListID = number;

export interface IRemotePriceListDTO {
  id: number;
  name: string;
  currency_id: {
    id: number;
    name: string;
    symbol: string;
  };
}

export interface IProductPricingInfo {
  price: number;
  priceListId: PriceListID;
  priceListName: string;
  currency: string;
  currencyId: number;
  currencySymbol?: string;
}

export interface IRemoteProductPricingDTO {
  [productId: string]: {
    [priceListId: string]: {
      price: number;
      pricelist_id: number;
      pricelist_name: string;
      currency: string;
      currency_id: number;
    };
  };
}

export class PriceList extends RemoteEntity {
  protected readonly REPOSITORY = EDistributionDomainRepository.PRICE_LIST;

  public name: string = "";
  public currencyId: number = 0;
  public currencySymbol: string = "";
  public currencyName: string = "";

  static override fromRemoteDTO(record: IRemotePriceListDTO): PriceList {
    const data: Partial<PriceList> = {
      remoteId: record.id,
      name: record.name,
      currencyId: record.currency_id.id,
      currencySymbol: record.currency_id.symbol,
      currencyName: record.currency_id.name,
      remoteState: ERemoteState.SYNCED,
    };

    const priceList = PriceList.obj(data);
    return priceList;
  }
}
