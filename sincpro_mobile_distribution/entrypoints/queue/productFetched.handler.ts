import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { ProductFetchedEvent } from "@sincpro/mobile-distribution/domain/product/events";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";
import { priceListService } from "@sincpro/mobile-distribution/services/price_list.service";
import { routeService } from "@sincpro/mobile-distribution/services/route.service";

export class ProductFetchedSubscriber extends Subscriber {
  listen = [ProductFetchedEvent];

  getEvent(event: DomainEvent): ProductFetchedEvent {
    return ProductFetchedEvent.from(event);
  }

  async process(event: ProductFetchedEvent): Promise<void> {
    const repository = repos.get(EDistributionDomainRepository.PRODUCT);
    const products = await repository.findByRemoteIds(event.productRemoteIds);
    await priceListService.aggregateProductsPricing(products);
    await routeService.getConsolidatedStockForActiveRoute();
  }
}
