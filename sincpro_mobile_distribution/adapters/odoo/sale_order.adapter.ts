import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import {
  IRemoteSaleOrderDTO,
  SaleOrder,
} from "@sincpro/mobile-distribution/domain/sale_order";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

const SALE_ORDER_SPEC_QUERY = {
  id: {},
  name: {},
  state: {},
  date_order: {},
  invoice_status: {},
  amount_total: {},
  amount_untaxed: {},
  amount_tax: {},
  created_in_route_plan_id: {},
  external_uuid: {},
  origin: {},
  partner_id: {
    fields: {
      id: {},
      name: {},
      vat: {},
    },
  },
  order_line: {
    fields: {
      id: {},
      name: {},
      product_id: {},
      product_uom: {
        fields: {
          id: {},
          name: {},
        },
      },
      product_uom_qty: {},
      price_unit: {},
      price_total: {},
      price_subtotal: {},
      discount: {},
      qty_delivered: {},
      tax_id: {
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
      currency_id: {
        fields: {
          id: {},
          name: {},
          symbol: {},
        },
      },
    },
  },
  invoice_ids: {
    fields: {
      id: {},
      external_uuid: {},
      name: {},
      state: {},
      move_type: {},
      credit_id: {},
      payment_state: {},
      ref: {},
      invoice_origin: {},
      invoice_date: {},
      amount_total: {},
      amount_untaxed: {},
      amount_tax: {},
      amount_residual: {},
      amount_residual_signed: {},
      partner_id: {
        fields: {
          id: {},
          name: {},
          vat: {},
        },
      },
      currency_id: {
        fields: {
          id: {},
          name: {},
          symbol: {},
        },
      },
      journal_id: {},
      tax_totals: {},
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
      consecutivo_hacienda: {},
      hacienda_clave_numerica: {},
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

class SaleOrderOdooAdapterImpl {
  private isOrderConfirmed(orderDTO: IRemoteSaleOrderDTO): boolean {
    return orderDTO.state === "sale";
  }

  private hasInvoices(orderDTO: IRemoteSaleOrderDTO): boolean {
    return (
      orderDTO.invoice_ids !== undefined &&
      orderDTO.invoice_ids !== null &&
      orderDTO.invoice_ids.length > 0
    );
  }

  private hasDraftInvoice(orderDTO: IRemoteSaleOrderDTO): boolean {
    if (!this.hasInvoices(orderDTO)) return false;
    return orderDTO.invoice_ids!.some((inv) => inv.state === "draft");
  }

  private hasPostedInvoice(orderDTO: IRemoteSaleOrderDTO): boolean {
    if (!this.hasInvoices(orderDTO)) return false;
    return orderDTO.invoice_ids!.some((inv) => inv.state === "posted");
  }

  private async createDraftInvoiceForSaleOrder(
    saleOrderId: number,
    consecutiveNumber?: string,
    numericKey?: string,
    invoiceUpdateDict?: Record<string, any>,
  ): Promise<IRemoteSaleOrderDTO | null> {
    const client = getOdooClient();

    if (consecutiveNumber) {
      await client.callModel("sale.order", "write", [
        saleOrderId,
        {
          external_consecutive_code: consecutiveNumber,
          external_cr_billing_code: numericKey || false,
        },
      ]);
    }

    const wizardId = await client.callModel(
      "sale.advance.payment.inv",
      "create",
      [{ sale_order_ids: [[6, 0, [saleOrderId]]] }],
      {},
    );
    await client.callModel("sale.advance.payment.inv", "create_invoices", [wizardId], {});

    const updatedOrder = await this.fetchOneSaleOrder(saleOrderId);
    const newDraftInvoice = updatedOrder?.invoice_ids?.find((inv) => inv.state === "draft");

    if (invoiceUpdateDict) {
      await client.callModel("account.move", "write", [
        newDraftInvoice!.id,
        invoiceUpdateDict,
      ]);
    }

    return await this.fetchOneSaleOrder(saleOrderId);
  }

  async fetchOneSaleOrder(
    id: number | string | undefined,
  ): Promise<IRemoteSaleOrderDTO | null> {
    if (!id) {
      loggerAdapter.warn("No ID provided to fetch sale order");
      return null;
    }

    const client = getOdooClient();
    const domain = typeof id === "number" ? [["id", "=", id]] : [["external_uuid", "=", id]];

    const result = await client.queryModel<IRemoteSaleOrderDTO>(
      "sale.order",
      domain,
      SALE_ORDER_SPEC_QUERY,
    );

    return result.records.length > 0 ? result.records[0] : null;
  }

  async fetchSaleOrdersAsOrder(
    saleOrderIds: number[],
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    if (saleOrderIds.length === 0) return new RemoteEntityCollection([]);

    loggerAdapter.info(`Fetching ${saleOrderIds.length} sale orders by IDs`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemoteSaleOrderDTO>(
      "sale.order",
      [["id", "in", saleOrderIds]],
      SALE_ORDER_SPEC_QUERY,
    );

    return RemoteEntityCollection.fromRemoteDTO(result.records, SaleOrder);
  }

  async createQuotation(order: SaleOrder): Promise<SaleOrder> {
    loggerAdapter.info(`Creating quotation for order: ${order.uuid}`);
    const client = getOdooClient();

    const existingOrder = await this.fetchOneSaleOrder(order.uuid);
    if (existingOrder) {
      loggerAdapter.warn(`Quotation already exists for order: ${order.uuid}`);
      const remoteOrder = SaleOrder.fromRemoteDTO(existingOrder);
      order.mergeWithRemote(remoteOrder);
      return order;
    }

    const quotationData = order.remotePayload();

    if (client.defaultCompanyId) {
      quotationData.company_id = client.defaultCompanyId;
    }

    const quotationId = await client.callModel<number>(
      "sale.order",
      "create",
      [quotationData],
      {},
    );

    const createdOrder = await this.fetchOneSaleOrder(quotationId);
    if (!createdOrder) {
      throw new Error(`Failed to fetch created quotation ${quotationId}`);
    }

    const remoteOrder = SaleOrder.fromRemoteDTO(createdOrder);
    order.remoteId = remoteOrder.remoteId;
    order.name = remoteOrder.name;
    order.state = remoteOrder.state;
    order.mergeWithRemote(remoteOrder);

    loggerAdapter.info(`Quotation created: ${order.name}`);
    return order;
  }

  async confirmQuotation(order: SaleOrder): Promise<SaleOrder> {
    loggerAdapter.info(`Confirming quotation ${order.name}`);

    if (!order.remoteId) {
      order = await this.createQuotation(order);
    }

    const existingOrder = await this.fetchOneSaleOrder(order.remoteId!);
    if (!existingOrder) {
      throw new Error(`Sale order with ID ${order.remoteId} not found.`);
    }

    if (this.isOrderConfirmed(existingOrder)) {
      loggerAdapter.warn(
        `Sale order ${order.name} already confirmed (state: ${existingOrder.state}). Skipping action_confirm.`,
      );
      const remoteOrder = SaleOrder.fromRemoteDTO(existingOrder);
      order.mergeWithRemote(remoteOrder);
      return order;
    }

    const client = getOdooClient();
    await client.callModel("sale.order", "action_confirm", [order.remoteId], {});

    const confirmedOrder = await this.fetchOneSaleOrder(order.remoteId!);
    if (!confirmedOrder) {
      throw new Error(`Sale order with ID ${order.remoteId} not found after confirm.`);
    }

    const remoteOrder = SaleOrder.fromRemoteDTO(confirmedOrder);
    order.mergeWithRemote(remoteOrder);
    loggerAdapter.info(`Quotation ${order.name} confirmed`);
    return order;
  }

  async createSaleOrder(order: SaleOrder): Promise<SaleOrder> {
    loggerAdapter.info(`Creating sale order for: ${order.uuid}`);

    const quotation = await this.createQuotation(order);

    const existingOrder = await this.fetchOneSaleOrder(quotation.remoteId!);
    if (!existingOrder) {
      throw new Error(`Sale order with ID ${quotation.remoteId} not found.`);
    }

    if (this.isOrderConfirmed(existingOrder)) {
      loggerAdapter.warn(
        `Sale order ${order.name} already confirmed (state: ${existingOrder.state}). Skipping action_confirm.`,
      );
      const remoteOrder = SaleOrder.fromRemoteDTO(existingOrder);
      order.mergeWithRemote(remoteOrder);
      return order;
    }

    const client = getOdooClient();
    await client.callModel("sale.order", "action_confirm", [quotation.remoteId], {});

    const confirmedOrder = await this.fetchOneSaleOrder(quotation.remoteId!);
    if (!confirmedOrder) {
      throw new Error(`Sale order with ID ${quotation.remoteId} not found after confirm.`);
    }

    const remoteOrder = SaleOrder.fromRemoteDTO(confirmedOrder);
    order.mergeWithRemote(remoteOrder);
    loggerAdapter.info(`Sale order created: ${order.name}`);
    return order;
  }

  async createDraftInvoice(order: SaleOrder): Promise<SaleOrder> {
    loggerAdapter.info(`Creating draft invoice for order ${order.name}`);
    const client = getOdooClient();

    if (!order.remoteId) {
      throw new Error(`Cannot create invoice without remoteId: ${order.uuid}`);
    }

    const existingOrder = await this.fetchOneSaleOrder(order.remoteId);
    if (!existingOrder) {
      throw new Error(`Sale order with ID ${order.remoteId} not found.`);
    }

    if (this.hasDraftInvoice(existingOrder)) {
      loggerAdapter.warn(
        `Sale order ${order.name} already has a draft invoice. Skipping invoice creation.`,
      );
      const remoteOrder = SaleOrder.fromRemoteDTO(existingOrder);
      order.mergeWithRemote(remoteOrder);
      return order;
    }

    if (this.hasPostedInvoice(existingOrder)) {
      loggerAdapter.warn(
        `Sale order ${order.name} already has a posted invoice. Skipping draft creation.`,
      );
      const remoteOrder = SaleOrder.fromRemoteDTO(existingOrder);
      order.mergeWithRemote(remoteOrder);
      return order;
    }

    if (order.consecutiveNumber) {
      await client.callModel("sale.order", "write", [
        order.remoteId,
        {
          external_consecutive_code: order.consecutiveNumber,
          external_cr_billing_code: order.numericKey || false,
        },
      ]);
    }

    const wizardId = await client.callModel(
      "sale.advance.payment.inv",
      "create",
      [{ sale_order_ids: [[6, 0, [order.remoteId]]] }],
      {},
    );

    await client.callModel("sale.advance.payment.inv", "create_invoices", [wizardId], {});

    const updatedOrder = await this.fetchOneSaleOrder(order.remoteId);
    if (!updatedOrder) {
      throw new Error(`Sale order with ID ${order.remoteId} not found.`);
    }

    if (order.discount > 0) {
      const draftInvoice = (updatedOrder as any).invoice_ids?.find(
        (inv: any) => inv.state === "draft",
      );
      if (draftInvoice) {
        await client.callModel("account.move", "write", [
          draftInvoice.id,
          { external_discount: order.percentageDiscount || 0 },
        ]);
      }
    }

    const remoteOrder = SaleOrder.fromRemoteDTO(updatedOrder);
    order.mergeWithRemote(remoteOrder);

    loggerAdapter.info(`Draft invoice created for order ${order.name}`);
    return order;
  }

  async createInvoiceForSaleOrder(invoice: Invoice): Promise<Invoice> {
    let remoteOrder = await this.fetchOneSaleOrder(invoice.saleOrderId!);

    if (!remoteOrder) {
      throw new Error(`Sale order ${invoice.saleOrderId} not found`);
    }

    let remoteInvoiceDTO = remoteOrder.invoice_ids?.find(
      (inv) => inv.external_uuid === invoice.uuid,
    );

    if (remoteInvoiceDTO) {
      invoice.mergeWithRemote(Invoice.fromRemoteDTO(remoteInvoiceDTO));
      return invoice;
    }

    const remoteSaleOrderDTO = await this.createDraftInvoiceForSaleOrder(
      invoice.saleOrderId!,
      invoice.consecutiveNumber,
      invoice.numericKey,
      {
        external_uuid: invoice.uuid,
        distribution_route_plan_id: invoice.routePlanId || false,
      },
    );

    if (!remoteSaleOrderDTO) {
      throw new Error(`Failed to create draft invoice for sale order ${invoice.saleOrderId}`);
    }

    invoice.mergeWithRemote(
      Invoice.fromRemoteDTO(
        remoteSaleOrderDTO.invoice_ids?.find((i) => i.external_uuid! === invoice.uuid)!,
      ),
    );

    return invoice;
  }

  async fetchSaleOrdersByRoute(routeId: number): Promise<RemoteEntityCollection<SaleOrder>> {
    loggerAdapter.info(`Fetching sale orders for route ID: ${routeId}`);
    const client = getOdooClient();

    const result = await client.queryModel<IRemoteSaleOrderDTO>(
      "sale.order",
      [["created_in_route_plan_id", "=", routeId]],
      SALE_ORDER_SPEC_QUERY,
    );

    if (!result || !result.records) {
      return new RemoteEntityCollection([]);
    }

    loggerAdapter.info(`Fetched ${result.records.length} sale orders for route ${routeId}`);
    return RemoteEntityCollection.fromRemoteDTO(result.records, SaleOrder);
  }

  async updateSaleOrder(order: SaleOrder): Promise<SaleOrder> {
    if (!order.remoteId) {
      throw new Error(`Cannot update order without remoteId: ${order.uuid}`);
    }

    loggerAdapter.info(`Updating sale order ${order.name}`);

    const existingOrder = await this.fetchOneSaleOrder(order.remoteId);
    if (!existingOrder) {
      throw new Error(`Sale order with ID ${order.remoteId} not found`);
    }

    const isConfirmed = existingOrder.state === "sale";

    try {
      await this.unlockSaleOrder(order.remoteId);

      if (isConfirmed) {
        await this.updateConfirmedSaleOrderLines(order, existingOrder);
      } else {
        await this.updateQuotationLines(order, existingOrder);
      }

      const updatedOrder = await this.fetchOneSaleOrder(order.remoteId);
      if (!updatedOrder) {
        throw new Error(`Failed to fetch updated sale order with ID ${order.remoteId}`);
      }

      const remoteOrder = SaleOrder.fromRemoteDTO(updatedOrder);
      order.mergeWithRemote(remoteOrder);

      loggerAdapter.info(`Successfully updated sale order: ${order.uuid}`);
      return order;
    } catch (error) {
      loggerAdapter.error(`Error updating sale order ${order.remoteId}: ${String(error)}`);
      throw error;
    } finally {
      try {
        await this.lockSaleOrder(order.remoteId);
      } catch (lockError) {
        loggerAdapter.warn(
          `Failed to lock sale order ${order.remoteId} after editing: ${String(lockError)}`,
        );
      }
    }
  }

  async unlockSaleOrder(saleOrderId: number): Promise<void> {
    const client = getOdooClient();

    try {
      await client.callModel("sale.order", "action_unlock", [saleOrderId], {});
      loggerAdapter.info(`Successfully unlocked sale order ${saleOrderId}`);
    } catch (error) {
      loggerAdapter.error(`Failed to unlock sale order ${saleOrderId}: ${String(error)}`);
      throw new Error(`Failed to unlock sale order ${saleOrderId}: ${String(error)}`);
    }
  }

  async lockSaleOrder(saleOrderId: number): Promise<void> {
    const client = getOdooClient();

    try {
      await client.callModel("sale.order", "action_lock", [saleOrderId], {});
      loggerAdapter.info(`Successfully locked sale order ${saleOrderId}`);
    } catch (error) {
      loggerAdapter.error(`Failed to lock sale order ${saleOrderId}: ${String(error)}`);
      throw new Error(`Failed to lock sale order ${saleOrderId}: ${String(error)}`);
    }
  }

  async updateConfirmedSaleOrderLines(
    localOrder: SaleOrder,
    remoteSaleOrder: IRemoteSaleOrderDTO,
  ): Promise<void> {
    const client = getOdooClient();
    const remoteLineMap = new Map(
      remoteSaleOrder.order_line.map((line) => [line.product_id, line]),
    );

    for (const localLine of localOrder.orderLines) {
      const remoteLine = remoteLineMap.get(localLine.productId);

      if (remoteLine) {
        if (remoteLine.product_uom_qty !== localLine.quantity) {
          await client.callModel(
            "sale.order.line",
            "write",
            [remoteLine.id, { product_uom_qty: localLine.quantity }],
            {},
          );
          loggerAdapter.info(
            `Updated quantity for line ${remoteLine.id}: ${remoteLine.product_uom_qty} -> ${localLine.quantity}`,
          );
        }
      } else {
        const newLineData = {
          order_id: remoteSaleOrder.id,
          product_id: localLine.productId,
          product_uom_qty: localLine.quantity,
          price_unit: localLine.priceUnit,
        };

        await client.callModel("sale.order.line", "create", [newLineData], {});
        loggerAdapter.info(
          `Added new line for product ${localLine.productId} to confirmed sale order`,
        );
      }
    }
  }

  async updateQuotationLines(
    localOrder: SaleOrder,
    remoteSaleOrder: IRemoteSaleOrderDTO,
  ): Promise<void> {
    const client = getOdooClient();
    const remoteLineMap = new Map(
      remoteSaleOrder.order_line.map((line) => [line.product_id, line]),
    );
    const localLineMap = new Map(localOrder.orderLines.map((line) => [line.productId, line]));

    for (const localLine of localOrder.orderLines) {
      const remoteLine = remoteLineMap.get(localLine.productId);

      if (remoteLine) {
        const updateData: any = {};
        if (remoteLine.product_uom_qty !== localLine.quantity) {
          updateData.product_uom_qty = localLine.quantity;
        }
        if (remoteLine.price_unit !== localLine.priceUnit) {
          updateData.price_unit = localLine.priceUnit;
        }
        if (localLine.discount && localLine.discount > 0) {
          updateData.discount = localLine.discount;
        }

        if (Object.keys(updateData).length > 0) {
          await client.callModel("sale.order.line", "write", [remoteLine.id, updateData], {});
          loggerAdapter.info(`Updated quotation line ${remoteLine.id}`);
        }
      } else {
        const newLineData = {
          order_id: remoteSaleOrder.id,
          product_id: localLine.productId,
          product_uom_qty: localLine.quantity,
          price_unit: localLine.priceUnit,
          discount: localLine.discount || 0,
        };

        await client.callModel("sale.order.line", "create", [newLineData], {});
        loggerAdapter.info(`Added new line for product ${localLine.productId} to quotation`);
      }
    }

    for (const remoteLine of remoteSaleOrder.order_line) {
      if (!localLineMap.has(remoteLine.product_id)) {
        await client.callModel("sale.order.line", "unlink", [remoteLine.id], {});
        loggerAdapter.info(`Removed line ${remoteLine.id} from quotation`);
      }
    }
  }

  async getSaleOrdersByCustomer(
    customerId: number,
    excludeIds: number[] = [],
    options: { limit?: number } = {},
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    loggerAdapter.info(
      `Fetching sale orders for customer ${customerId}, excluding ${excludeIds.length} IDs`,
    );

    const client = getOdooClient();
    const domain: any[] = [
      ["partner_id", "=", customerId],
      ["state", "=", "sale"],
    ];

    if (excludeIds.length > 0) {
      domain.push(["id", "not in", excludeIds]);
    }

    const queryOptions = {
      order: "date_order desc",
      ...options,
    };

    const response = await client.queryModel<IRemoteSaleOrderDTO>(
      "sale.order",
      domain,
      SALE_ORDER_SPEC_QUERY,
      queryOptions,
    );

    if (!response || response.records.length === 0) {
      loggerAdapter.info(`No new sale orders found for customer ${customerId}`);
      return new RemoteEntityCollection([]);
    }

    loggerAdapter.info(
      `Found ${response.records.length} new sale orders for customer ${customerId}`,
    );

    return RemoteEntityCollection.fromRemoteDTO(response.records, SaleOrder);
  }

  async syncExternalUUID(remoteId: number, uuid: string): Promise<void> {
    loggerAdapter.info(`Syncing external UUID ${uuid} to sale order ${remoteId}`);
    const client = getOdooClient();
    await client.callModel("sale.order", "write", [[remoteId], { external_uuid: uuid }]);
    loggerAdapter.info(`External UUID synced successfully`);
  }
}

export const SaleOrderAdapter = new SaleOrderOdooAdapterImpl();
