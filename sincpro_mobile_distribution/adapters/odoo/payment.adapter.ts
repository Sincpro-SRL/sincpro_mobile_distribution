import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import {
  type IRemotePaymentOdooDTO,
  PaymentOdoo,
} from "@sincpro/mobile-distribution/domain/payment";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

const PAYMENT_QUERY_SPEC = {
  id: {},
  name: {},
  state: {},
  ref: {},
  date: {},
  invoice_origin: {},
  payment_type: {},
  payment_reference: {},
  external_uuid: {},
  journal_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  partner_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  distribution_route_plan_id: {},
  amount: {},
  currency_id: {
    fields: {
      id: {},
      name: {},
      symbol: {},
    },
  },
};

class PaymentOdooAdapterImpl {
  async fetchSinglePayment(
    paymentId: number | string | undefined,
  ): Promise<PaymentOdoo | null> {
    if (!paymentId) {
      loggerAdapter.warn("No ID provided to fetch payment");
      return null;
    }

    loggerAdapter.info(`Fetching payment by ID or reference: ${paymentId}`);
    const client = getOdooClient();

    const domain =
      typeof paymentId === "number"
        ? [["id", "=", paymentId]]
        : ["|", ["payment_reference", "=", paymentId], ["external_uuid", "=", paymentId]];

    const result = await client.queryModel<IRemotePaymentOdooDTO>(
      "account.payment",
      domain,
      PAYMENT_QUERY_SPEC,
    );

    if (result.records.length === 0) {
      loggerAdapter.debug(`Payment ${paymentId} not found in backend`);
      return null;
    }

    const payment = PaymentOdoo.fromRemoteDTO(result.records[0]);
    loggerAdapter.info(
      `Payment ${paymentId} found in backend with remoteId: ${payment.remoteId}`,
    );
    return payment;
  }

  async createPayment(localPayment: PaymentOdoo): Promise<PaymentOdoo> {
    loggerAdapter.info(`Creating payment ${localPayment.remoteId} in backend`);
    const client = getOdooClient();

    const existingPayment = await this.fetchSinglePayment(localPayment.remoteId);
    if (existingPayment) {
      loggerAdapter.warn(
        `Payment ${localPayment.remoteId} already exists in backend with remoteId: ${existingPayment.remoteId}`,
      );
      localPayment.remoteId = existingPayment.remoteId;
      localPayment.name = existingPayment.name;
      localPayment.remoteState = existingPayment.remoteState;
      return localPayment;
    }

    const payload = localPayment.remotePayload();
    loggerAdapter.debug(`Creating payment with payload: ${JSON.stringify(payload)}`);

    const paymentId = await client.callModel<number>(
      "account.payment",
      "create",
      [payload],
      {},
    );

    loggerAdapter.info(`Payment created in backend with ID: ${paymentId}`);

    await client.callModel("account.payment", "action_post", [paymentId], {});
    loggerAdapter.info(`Payment ${paymentId} posted in backend`);

    const createdPayment = await this.fetchSinglePayment(paymentId);
    if (createdPayment) {
      localPayment.mergeWithRemote(createdPayment);
    }
    return localPayment;
  }

  async fetchPaymentsByRoute(routeId: number): Promise<RemoteEntityCollection<PaymentOdoo>> {
    loggerAdapter.info(`Fetching payments for route: ${routeId}`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemotePaymentOdooDTO>(
      "account.payment",
      [
        ["distribution_route_plan_id", "=", routeId],
        ["move_id", "!=", false],
      ],
      PAYMENT_QUERY_SPEC,
    );

    if (!result || !result.records) {
      return new RemoteEntityCollection([]);
    }

    loggerAdapter.info(`Fetched ${result.records.length} payments for route ${routeId}`);
    const odooPayments = RemoteEntityCollection.fromRemoteDTO(result.records, PaymentOdoo);
    for (const payment of odooPayments) {
      payment.setRoute(routeId);
    }
    return odooPayments;
  }

  async syncExternalUUID(remoteId: number, uuid: string): Promise<void> {
    loggerAdapter.info(`Syncing external UUID ${uuid} to payment ${remoteId}`);
    const client = getOdooClient();
    await client.callModel("account.payment", "write", [[remoteId], { external_uuid: uuid }]);
    loggerAdapter.info(`External UUID synced successfully`);
  }

  async updatePenalizationMetadata(payment: PaymentOdoo): Promise<void> {
    if (!payment.remoteId) {
      loggerAdapter.warn("No remoteId in payment for metadata update");
      return;
    }

    loggerAdapter.info(`Updating metadata for penalization payment ${payment.remoteId}`);
    const client = getOdooClient();

    const payload = {
      external_uuid: payment.uuid,
      distribution_route_plan_id: payment.routeId,
      journal_id: payment.paymentMethod?.id,
      payment_method_line_id:
        payment.paymentMethod?.outbound_payment_method_line_ids?.[0]?.id,
      invoice_origin: JSON.stringify({
        targetUUID: payment.targetUUID,
        targetRemoteId: payment.targetRemoteId,
        targetRemoteModel: payment.targetRemoteModel,
        targetRemoteRef: payment.targetRemoteRef,
        targetType: payment.targetType,
      }),
    };

    await client.callModel("account.payment", "write", [[payment.remoteId], payload], {});

    loggerAdapter.info(`Penalization metadata updated successfully`);
  }
}

export const PaymentAdapter = new PaymentOdooAdapterImpl();
