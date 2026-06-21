import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { ProductStockUpdatedEvent } from "@sincpro/mobile-distribution/domain/product/events";
import { productService } from "@sincpro/mobile-distribution/services/product.service";

export class ProductStockUpdatedSubscriber extends Subscriber {
  listen = [ProductStockUpdatedEvent];

  getEvent(event: DomainEvent): ProductStockUpdatedEvent {
    return ProductStockUpdatedEvent.from(event);
  }

  async process(event: ProductStockUpdatedEvent): Promise<void> {
    for (const line of event.lines) {
      const product = await productService.getProductByRemoteId(line.productId);
      if (!product) {
        continue;
      }

      if (event.type === "INCREASE") {
        product.increaseStock(line.quantity);
      } else if (event.type === "DECREASE") {
        product.decreaseStock(line.quantity);
      }

      await productService.updateProductStock(product.remoteId!, product.quantity);
    }
  }
}
