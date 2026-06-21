import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { CustomersFetchedEvent } from "@sincpro/mobile-distribution/domain/customer/events";
import { distributionWorkflows } from "@sincpro/mobile-distribution/services/workflows";

export class CustomersFetchedSubscriber extends Subscriber {
  listen = [CustomersFetchedEvent];

  getEvent(event: DomainEvent): CustomersFetchedEvent {
    return CustomersFetchedEvent.from(event);
  }

  async process(event: CustomersFetchedEvent): Promise<void> {
    let customerIds = event.customerIds;
    if (!Array.isArray(customerIds)) {
      customerIds = [customerIds];
    }
    await distributionWorkflows.pullCustomerDataWorkflow(customerIds);
  }
}
