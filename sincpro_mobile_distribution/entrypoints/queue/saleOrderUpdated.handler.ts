import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { loggerQueueProcessor } from "@sincpro/mobile/infrastructure/logger";
import { SaleOrderAdapter } from "@sincpro/mobile-distribution/adapters/odoo/sale_order.adapter";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { SaleOrderUpdatedEvent } from "@sincpro/mobile-distribution/domain/sale_order/events";

export class SaleOrderUpdatedSubscriber extends Subscriber {
  readonly listen = [SaleOrderUpdatedEvent];

  getEvent(event: DomainEvent): SaleOrderUpdatedEvent {
    return SaleOrderUpdatedEvent.from(event);
  }

  async process(event: SaleOrderUpdatedEvent): Promise<void> {
    const repository = repos.get(EDistributionRepository.SALE_ORDER);
    const saleOrder = await repository.findById(event.saleOrderUUID);

    if (!saleOrder) {
      throw new Error(`Sale order with UUID ${event.saleOrderUUID} not found.`);
    }

    if (!saleOrder.remoteId) {
      loggerQueueProcessor.warn(
        `Sale order ${saleOrder.uuid} has no remoteId, cannot update in backend`,
      );
      return;
    }

    loggerQueueProcessor.info(`Updating sale order ${saleOrder.name} in backend`);

    const updatedOrder = await SaleOrderAdapter.updateSaleOrder(saleOrder);
    await repository.save(updatedOrder);

    loggerQueueProcessor.info(
      `Sale order ${updatedOrder.name} updated in backend successfully`,
    );
  }
}
