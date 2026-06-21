import { DomainEvent, Subscriber } from "@sincpro/mobile/domain/event_sourcing";
import { PaymentReconciledEvent } from "@sincpro/mobile-distribution/domain/payment";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";

export class PaymentReconciledSubscriber extends Subscriber {
  readonly listen = [PaymentReconciledEvent];

  getEvent(event: DomainEvent): PaymentReconciledEvent {
    return PaymentReconciledEvent.from(event);
  }

  async process(event: PaymentReconciledEvent): Promise<void> {
    const paymentUUIDs = event.paymentUUIDs;
    const payments = await paymentService.getPaymentByIds(paymentUUIDs);

    if (payments.isEmpty) {
      throw new Error(`Payment ${paymentUUIDs} not found.`);
    }

    await paymentService.linkPaymentsToEntity(payments);
  }
}
