import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { DomainAppError } from "@sincpro/mobile/exceptions";
import { CustomerCreatedEvent } from "@sincpro/mobile-distribution/domain/customer/events";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";

export class CustomerCreatedSubscriber extends Subscriber {
  listen = [CustomerCreatedEvent];

  getEvent(event: DomainEvent): CustomerCreatedEvent {
    return CustomerCreatedEvent.from(event);
  }

  async process(event: CustomerCreatedEvent): Promise<void> {
    const customer = await customerService.getCustomerByUuid(event.customer.uuid);
    if (!customer) {
      throw new DomainAppError("Customer not found");
    }
    await customerService.pushCustomerToBackend(customer);
  }
}
