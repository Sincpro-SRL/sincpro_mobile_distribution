import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import {
  CreditNote,
  IRemoteCreditNoteDTO,
} from "@sincpro/mobile-distribution/domain/credit_note";
import { SaleOrder, SaleOrderInvoice } from "@sincpro/mobile-distribution/domain/sale_order";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

const CREDIT_NOTE_SPEC_QUERY = {
  id: {},
  name: {},
  state: {},
  move_type: {},
  payment_state: {},
  invoice_date: {},
  invoice_origin: {},
  external_uuid: {},
  distribution_route_plan_id: {},
  amount_total: {},
  amount_untaxed: {},
  amount_tax: {},
  amount_residual: {},
  amount_residual_signed: {},
  consecutivo_hacienda: {},
  hacienda_clave_numerica: {},
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
  reversed_entry_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  currency_id: {
    fields: {
      id: {},
      name: {},
      symbol: {},
    },
  },
};

class CreditNoteOdooAdapterImpl {
  async fetchCreditNotesByCustomer(
    customerIds: number[],
  ): Promise<RemoteEntityCollection<CreditNote>> {
    if (customerIds.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(`Fetching credit notes for ${customerIds.length} customers`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteCreditNoteDTO>(
      "account.move",
      [
        ["partner_id", "in", customerIds],
        ["move_type", "=", "out_refund"],
        ["state", "=", "posted"],
      ],
      CREDIT_NOTE_SPEC_QUERY,
    );

    loggerAdapter.info(`Fetched ${result.records.length} credit notes`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, CreditNote);
  }

  async fetchMoreCreditNotesByCustomer(
    customerIds: number[],
    limit: number = 20,
    excludeRemoteIds: number[] = [],
  ): Promise<RemoteEntityCollection<CreditNote>> {
    if (customerIds.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(
      `Fetching ${limit} more credit notes for ${customerIds.length} customers`,
    );
    const odooClient = getOdooClient();

    const domain: any[] = [
      ["partner_id", "in", customerIds],
      ["move_type", "=", "out_refund"],
      ["state", "in", ["draft", "posted"]],
    ];

    if (excludeRemoteIds.length > 0) {
      domain.push(["id", "not in", excludeRemoteIds]);
    }

    const result = await odooClient.queryModel<IRemoteCreditNoteDTO>(
      "account.move",
      domain,
      CREDIT_NOTE_SPEC_QUERY,
      {
        limit,
        order: "invoice_date desc",
      },
    );

    loggerAdapter.info(`Fetched ${result.records.length} credit notes`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, CreditNote);
  }

  async fetchCreditNotesByRouteId(
    routeId: number,
  ): Promise<RemoteEntityCollection<CreditNote>> {
    loggerAdapter.info(`Fetching credit notes for route: ${routeId}`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteCreditNoteDTO>(
      "account.move",
      [
        ["distribution_route_plan_id", "=", routeId],
        ["move_type", "=", "out_refund"],
        ["state", "=", "posted"],
      ],
      CREDIT_NOTE_SPEC_QUERY,
    );

    loggerAdapter.info(`Fetched ${result.records.length} credit notes for route ${routeId}`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, CreditNote);
  }

  async refreshCreditNoteFromBackend(creditNoteId: number): Promise<CreditNote | null> {
    loggerAdapter.info(`Refreshing credit note ${creditNoteId} from backend`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteCreditNoteDTO>(
      "account.move",
      [["id", "=", creditNoteId]],
      CREDIT_NOTE_SPEC_QUERY,
    );

    if (result.records.length === 0) {
      loggerAdapter.warn(`Credit note ${creditNoteId} not found in backend`);
      return null;
    }

    return CreditNote.fromRemoteDTO(result.records[0]);
  }

  async findByUUID(uuid: string): Promise<CreditNote | null> {
    if (!uuid) return null;

    loggerAdapter.info(`Finding credit note by UUID: ${uuid}`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteCreditNoteDTO>(
      "account.move",
      [
        ["external_uuid", "=", uuid],
        ["move_type", "=", "out_refund"],
      ],
      CREDIT_NOTE_SPEC_QUERY,
    );

    if (result.records.length === 0) {
      loggerAdapter.debug(`Credit note with UUID ${uuid} not found in backend`);
      return null;
    }

    loggerAdapter.info(`Found credit note ${result.records[0].name} with UUID ${uuid}`);
    return CreditNote.fromRemoteDTO(result.records[0]);
  }

  async postCreditNote(
    creditNoteId: number,
    routeId?: number,
    externalUuid?: string,
  ): Promise<void> {
    loggerAdapter.info(`Posting credit note ${creditNoteId}`);
    const odooClient = getOdooClient();

    if (routeId || externalUuid) {
      await odooClient.callModel("account.move", "write", [
        [creditNoteId],
        {
          ...(routeId && { distribution_route_plan_id: routeId }),
          ...(externalUuid && { external_uuid: externalUuid }),
        },
      ]);
    }

    await odooClient.callModel("account.move", "action_post", [creditNoteId], {});

    loggerAdapter.info(`Credit note ${creditNoteId} posted successfully`);
  }

  async createCreditNoteFromInvoice(
    invoice: SaleOrderInvoice,
    creditNote: CreditNote,
  ): Promise<CreditNote> {
    const invoiceId = invoice.remoteId!;
    loggerAdapter.info(`Creating credit note from invoice ${invoiceId}`);
    const odooClient = getOdooClient();

    const refundResult = await odooClient.callModel(
      "account.move.reversal",
      "create",
      [{ journal_id: invoice.journalId || false }],
      {},
      {
        active_model: "account.move",
        active_ids: [invoiceId],
        active_id: invoiceId,
      },
    );

    const actionRedirect = await odooClient.callModel(
      "account.move.reversal",
      "refund_moves",
      [refundResult],
    );

    if (
      !actionRedirect ||
      typeof actionRedirect !== "object" ||
      !("res_id" in actionRedirect)
    ) {
      throw new Error(`Failed to create credit note from invoice ${invoiceId}`);
    }

    const refundId = (actionRedirect as any).res_id;

    await odooClient.callModel("account.move", "write", [
      [refundId],
      {
        external_uuid: creditNote.uuid,
        distribution_route_plan_id: creditNote.routeId || false,
        invoice_origin: JSON.stringify(creditNote.embeddedMetadata),
      },
    ]);

    if (creditNote.creditNoteLines.length > 0) {
      await this.updateCreditNoteLines(refundId, creditNote);
    }

    const refreshed = await this.refreshCreditNoteFromBackend(refundId);
    if (!refreshed) {
      throw new Error(`Failed to refresh created credit note ${refundId}`);
    }

    creditNote.remoteId = refreshed.remoteId;
    creditNote.mergeWithRemote(refreshed);

    loggerAdapter.info(`Credit note created with ID ${refundId}`);
    return creditNote;
  }

  private async updateCreditNoteLines(
    creditNoteId: number,
    creditNote: CreditNote,
  ): Promise<void> {
    loggerAdapter.info(`Updating credit note ${creditNoteId} lines`);
    const odooClient = getOdooClient();

    const current = await this.refreshCreditNoteFromBackend(creditNoteId);
    if (!current || !current.creditNoteLines) {
      throw new Error(`Could not find credit note lines for ${creditNoteId}`);
    }

    const creditNoteProductMap = new Map(
      creditNote.creditNoteLines.map((line) => [line.productId, line.quantity]),
    );

    const lineCommands: [number, number, any?][] = [];

    for (const invoiceLine of current.creditNoteLines) {
      const newQuantity = creditNoteProductMap.get(invoiceLine.productId);

      if (newQuantity === undefined) {
        lineCommands.push([2, invoiceLine.remoteId!]);
      } else if (newQuantity !== invoiceLine.quantity) {
        lineCommands.push([
          1,
          invoiceLine.remoteId!,
          { quantity: newQuantity, price_unit: invoiceLine.priceUnit },
        ]);
      }
    }

    if (lineCommands.length > 0) {
      await odooClient.callModel("account.move", "write", [
        [creditNoteId],
        { invoice_line_ids: lineCommands },
      ]);
    }
  }

  async createCreditNoteForSaleOrder(
    creditNote: CreditNote,
    saleOrder: SaleOrder,
  ): Promise<CreditNote> {
    loggerAdapter.info(
      `Creating credit note from sale order ${saleOrder.name} (ID: ${saleOrder.remoteId})`,
    );

    const validInvoice = saleOrder.displayValidInvoices.find(
      (inv) => inv.isPosted() && inv.remoteId && inv.remoteId > 0,
    );

    if (!validInvoice || !validInvoice.remoteId) {
      throw new Error(
        `No valid posted invoice found for sale order ${saleOrder.name}. ` +
          `Cannot create credit note without an invoice.`,
      );
    }

    loggerAdapter.info(
      `Using invoice ${validInvoice.name} (ID: ${validInvoice.remoteId}) for credit note`,
    );

    creditNote.reversedEntryId = validInvoice.remoteId;
    creditNote.reversedEntryName = validInvoice.name;

    return await this.createCreditNoteFromInvoice(validInvoice, creditNote);
  }

  getValidInvoiceIdFromSaleOrder(saleOrder: SaleOrder): number | null {
    const validInvoice = saleOrder.displayValidInvoices.find(
      (inv) => inv.isPosted() && inv.remoteId && inv.remoteId > 0,
    );

    return validInvoice?.remoteId || null;
  }

  async reconcileCreditNoteAndPayments(
    creditNoteId: number,
    paymentIds: number[],
  ): Promise<void> {
    loggerAdapter.info(
      `Reconciling credit note ${creditNoteId} with payments: ${paymentIds}`,
    );
    const odooClient = getOdooClient();

    await odooClient.callModel(
      "account.move",
      "api_reconcile_invoice_with_payments",
      [creditNoteId, paymentIds],
      {},
    );

    loggerAdapter.info(
      `Credit note ${creditNoteId} reconciled with ${paymentIds.length} payments`,
    );
  }

  async syncExternalUUID(remoteId: number, uuid: string): Promise<void> {
    loggerAdapter.info(`Syncing external UUID ${uuid} to credit note ${remoteId}`);
    const client = getOdooClient();
    await client.callModel("account.move", "write", [[remoteId], { external_uuid: uuid }]);
    loggerAdapter.info(`External UUID synced successfully`);
  }
}

export const CreditNoteAdapter = new CreditNoteOdooAdapterImpl();
