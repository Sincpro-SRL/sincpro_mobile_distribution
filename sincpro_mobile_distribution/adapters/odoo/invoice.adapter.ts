import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { DomainBackendError } from "@sincpro/mobile/exceptions";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import {
  EInvoiceMoveType,
  EInvoicePaymentState,
  Invoice,
  IRemoteInvoiceDTO,
} from "@sincpro/mobile-distribution/domain/invoice";
import {
  IRemotePaymentCreditDTO,
  PaymentCredit,
} from "@sincpro/mobile-distribution/domain/payment";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

export enum EInvoiceConditionPayment {
  CASH = "01",
  CREDIT = "02",
}

const INVOICE_SPEC_QUERY = {
  id: {},
  name: {},
  state: {},
  move_type: {},
  credit_id: {},
  payment_state: {},
  ref: {},
  payment_reference: {},
  invoice_origin: {},
  invoice_date: {},
  date: {},
  amount_total: {},
  amount_untaxed: {},
  amount_tax: {},
  amount_residual: {},
  amount_residual_signed: {},
  consecutivo_hacienda: {},
  hacienda_clave_numerica: {},
  journal_id: {},
  external_uuid: {},
  distribution_route_plan_id: {},
  partner_id: {
    fields: {
      id: {},
      name: {},
      vat: {},
    },
  },
  invoice_line_ids: {
    fields: {
      id: {},
      name: {},
      product_id: {},
      product_uom_id: {
        fields: {
          id: {},
          name: {},
        },
      },
      quantity: {},
      price_unit: {},
      price_total: {},
      price_subtotal: {},
      discount: {},
      tax_ids: {
        fields: {
          id: {},
          name: {},
          display_name: {},
          amount: {},
          amount_type: {},
          sequence: {},
          include_base_amount: {},
          tax_group_id: {
            fields: {
              id: {},
              name: {},
              sequence: {},
            },
          },
        },
      },
    },
  },
  tax_totals: {},
  currency_id: {
    fields: {
      id: {},
      name: {},
      symbol: {},
    },
  },
};

class InvoiceOdooAdapterImpl {
  async getInvoicesByIds(ids: number[]): Promise<RemoteEntityCollection<Invoice>> {
    if (ids.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(`Fetching invoices by IDs: ${ids}`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      [["id", "in", ids]],
      INVOICE_SPEC_QUERY,
    );

    return RemoteEntityCollection.fromRemoteDTO(result.records, Invoice);
  }

  async getInvoiceNotPaidByIds(ids: number[]): Promise<RemoteEntityCollection<Invoice>> {
    if (ids.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(`Fetching unpaid invoices by IDs: ${ids}`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      [
        ["id", "in", ids],
        ["move_type", "=", "out_invoice"],
        ["state", "=", "posted"],
        [
          "payment_state",
          "in",
          [EInvoicePaymentState.NOT_PAID, EInvoicePaymentState.PARTIAL],
        ],
      ],
      INVOICE_SPEC_QUERY,
    );

    return RemoteEntityCollection.fromRemoteDTO(result.records, Invoice);
  }

  async getNotPaidInvoicesByCustomer(
    customerIds: number[],
  ): Promise<RemoteEntityCollection<Invoice>> {
    if (customerIds.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(`Fetching unpaid invoices for ${customerIds.length} customers`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      [
        ["partner_id", "in", customerIds],
        ["move_type", "=", "out_invoice"],
        ["state", "in", ["draft", "posted"]],
        [
          "payment_state",
          "in",
          [EInvoicePaymentState.NOT_PAID, EInvoicePaymentState.PARTIAL],
        ],
      ],
      INVOICE_SPEC_QUERY,
    );

    loggerAdapter.info(`Fetched ${result.records.length} unpaid invoices`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, Invoice);
  }

  async fetchMoreInvoicesByCustomer(
    customerIds: number[],
    limit: number = 20,
    excludeRemoteIds: number[] = [],
  ): Promise<RemoteEntityCollection<Invoice>> {
    if (customerIds.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(`Fetching ${limit} more invoices for ${customerIds.length} customers`);
    const client = getOdooClient();

    const domain: any[] = [
      ["partner_id", "in", customerIds],
      ["move_type", "=", "out_invoice"],
      ["state", "in", ["draft", "posted"]],
    ];

    if (excludeRemoteIds.length > 0) {
      domain.push(["id", "not in", excludeRemoteIds]);
    }

    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      domain,
      INVOICE_SPEC_QUERY,
      {
        limit,
        order: "date desc",
      },
    );

    loggerAdapter.info(`Fetched ${result.records.length} invoices`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, Invoice);
  }

  async refreshInvoicesFromBackend(
    invoiceIds: number[],
  ): Promise<RemoteEntityCollection<Invoice>> {
    if (invoiceIds.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(`Refreshing ${invoiceIds.length} invoices from backend`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      [["id", "in", invoiceIds]],
      INVOICE_SPEC_QUERY,
    );

    if (result.records.length === 0) {
      loggerAdapter.warn(`No invoices found in backend for IDs: ${invoiceIds}`);
      return new RemoteEntityCollection([]);
    }

    return RemoteEntityCollection.fromRemoteDTO(result.records, Invoice);
  }

  async reconcileInvoiceAndPayments(invoiceId: number, paymentIds: number[]): Promise<void> {
    loggerAdapter.info(`Reconciling invoice ${invoiceId} with payments: ${paymentIds}`);
    const client = getOdooClient();

    await client.callModel(
      "account.move",
      "api_reconcile_invoice_with_payments",
      [invoiceId, paymentIds],
      {},
    );
  }

  async getOutInvoicesByIds(ids: number[]): Promise<RemoteEntityCollection<Invoice>> {
    if (ids.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(`Fetching out_invoice invoices by IDs: ${ids}`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      [
        ["id", "in", ids],
        ["move_type", "=", EInvoiceMoveType.OUT_INVOICE],
        ["state", "=", "posted"],
      ],
      INVOICE_SPEC_QUERY,
    );

    return RemoteEntityCollection.fromRemoteDTO(result.records, Invoice);
  }

  async postInvoice(
    invoiceId: number,
    routeId?: number,
    externalUuid?: string,
  ): Promise<Invoice> {
    loggerAdapter.info(`Posting invoice ${invoiceId}`);
    const client = getOdooClient();

    if (routeId || externalUuid) {
      await client.callModel("account.move", "write", [
        [invoiceId],
        {
          ...(routeId && { distribution_route_plan_id: routeId }),
          ...(externalUuid && { external_uuid: externalUuid }),
        },
      ]);
    }

    await client.callModel("account.move", "action_post", [invoiceId], {});

    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      [["id", "=", invoiceId]],
      INVOICE_SPEC_QUERY,
    );

    if (result.records.length === 0) {
      throw new Error(`Invoice ${invoiceId} not found after posting`);
    }

    loggerAdapter.info(`Successfully posted invoice ${invoiceId}`);
    return Invoice.fromRemoteDTO(result.records[0]);
  }

  async fetchInvoiceAsCreditPayment(
    routeId: number,
  ): Promise<RemoteEntityCollection<PaymentCredit>> {
    loggerAdapter.info(`Fetching credit payments for route: ${routeId}`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemotePaymentCreditDTO>(
      "account.move",
      [
        ["distribution_route_plan_id", "=", routeId],
        ["state", "=", "posted"],
        ["credit_id", "!=", false],
      ],
      INVOICE_SPEC_QUERY,
    );
    return RemoteEntityCollection.fromRemoteDTO(result.records, PaymentCredit);
  }

  async postInvoiceAsCreditPayment(
    invoiceId: number,
    creditPayment: PaymentCredit,
  ): Promise<void> {
    loggerAdapter.info(
      `Posting invoice ${invoiceId} with credit (creditApplicationId: ${creditPayment})`,
    );
    const client = getOdooClient();

    const invoices = await this.getInvoicesByIds([invoiceId]);
    if (invoices.isEmpty) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const invoice = invoices.first()!;

    await client.callModel("account.move", "write", [
      [invoiceId],
      {
        credit_id: creditPayment.creditApplicationId,
        payment_reference: creditPayment.paymentReference,
        invoice_origin: JSON.stringify(creditPayment.embeddedTarget),
        distribution_route_plan_id: creditPayment.routeId,
        condicion_venta: EInvoiceConditionPayment.CREDIT,
      },
    ]);

    await client.callModel("account.move", "action_set_as_credit_payment", [[invoiceId]]);

    if (invoice.state === "draft") {
      loggerAdapter.info(`Posting draft invoice ${invoiceId} for credit payment`);
      await client.callModel("account.move", "action_post", [invoiceId], {});
    }

    loggerAdapter.info(
      `Successfully posted invoice ${invoiceId} with credit application ${creditPayment}`,
    );
  }

  async findByUUID(uuid: string): Promise<Invoice | null> {
    if (!uuid) return null;

    loggerAdapter.info(`Finding invoice by UUID: ${uuid}`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      [
        ["external_uuid", "=", uuid],
        ["move_type", "=", "out_invoice"],
      ],
      INVOICE_SPEC_QUERY,
    );

    if (result.records.length === 0) {
      loggerAdapter.debug(`Invoice with UUID ${uuid} not found in backend`);
      return null;
    }

    loggerAdapter.info(`Found invoice ${result.records[0].name} with UUID ${uuid}`);
    return Invoice.fromRemoteDTO(result.records[0]);
  }

  async fetchSingleInvoice(id: number | string): Promise<Invoice | null> {
    if (!id) return null;

    loggerAdapter.info(`Fetching invoice by ID or UUID: ${id}`);

    if (typeof id === "string") {
      return this.findByUUID(id);
    }

    const client = getOdooClient();
    const result = await client.queryModel<IRemoteInvoiceDTO>(
      "account.move",
      [["id", "=", id]],
      INVOICE_SPEC_QUERY,
    );

    if (result.records.length === 0) {
      loggerAdapter.debug(`Invoice ${id} not found in backend`);
      return null;
    }

    return Invoice.fromRemoteDTO(result.records[0]);
  }

  async syncExternalUUID(remoteId: number, uuid: string): Promise<void> {
    loggerAdapter.info(`Syncing external UUID ${uuid} to invoice ${remoteId}`);
    const client = getOdooClient();
    await client.callModel("account.move", "write", [[remoteId], { external_uuid: uuid }]);
    loggerAdapter.info(`External UUID synced successfully`);
  }

  async defineConditionPayment(
    remoteId: number,
    conditionPayment: EInvoiceConditionPayment,
  ): Promise<void> {
    loggerAdapter.info(`Marking invoice ${remoteId} as direct payment`);
    const client = getOdooClient();
    const payload = { condicion_venta: conditionPayment };
    await client.callModel("account.move", "write", [[remoteId], payload]);
    loggerAdapter.info(`Invoice ${remoteId} marked as direct payment successfully`);
  }

  private validatePenalizationResponse(response: {
    success: boolean;
    result: { invoice_id: number; amount_penalization: number; status: string }[];
  }): void {
    if (!response.success) {
      throw new DomainBackendError("Penalization API response indicates failure");
    }
    if (!Array.isArray(response.result)) {
      throw new DomainBackendError("Penalization API response result is not an array");
    }
  }

  async fetchPenalizationInformation(
    invoiceIds: number[],
  ): Promise<{ invoice_id: number; amount_penalization: number; status: string }[]> {
    const odooClient = getOdooClient();
    const result = await odooClient.httpRequestToServer("POST", "/api/show_penalizations", {
      invoices: invoiceIds.map((i) => {
        return {
          invoice_id: i,
        };
      }),
    });

    if (result.status !== 200) {
      throw new DomainBackendError(
        `Failed to fetch penalization information for invoices ${invoiceIds.join(", ")}`,
      );
    }
    this.validatePenalizationResponse(result.data);

    return result.data.result;
  }

  async createPenalization(invoiceIds: number[]): Promise<
    {
      invoice_id: number;
      amount_penalization: number;
      status: string;
      penalization_ids: number[];
    }[]
  > {
    const odooClient = getOdooClient();
    const result = await odooClient.httpRequestToServer("POST", "/api/create_penalizations", {
      invoices: invoiceIds.map((i) => {
        return {
          invoice_id: i,
        };
      }),
    });
    if (result.status !== 200) {
      throw new DomainBackendError(
        `Failed to create penalizations for invoices ${invoiceIds.join(", ")}`,
      );
    }

    this.validatePenalizationResponse(result.data);

    return result.data.result;
  }

  async payPenalization(
    invoiceId: number,
    amountPaid: number,
  ): Promise<{ invoice_id: number; status: string }[]> {
    const odooClient = getOdooClient();
    const result = await odooClient.httpRequestToServer("POST", "/api/pay_penalizations", {
      invoices: [
        {
          invoice_id: invoiceId,
          amount_paid: amountPaid,
        },
      ],
    });
    if (result.status !== 200) {
      throw new DomainBackendError(`Failed to pay penalization for invoice ${invoiceId}`);
    }

    this.validatePenalizationResponse(result.data);
    return result.data.result;
  }
}

export const InvoiceAdapter = new InvoiceOdooAdapterImpl();
