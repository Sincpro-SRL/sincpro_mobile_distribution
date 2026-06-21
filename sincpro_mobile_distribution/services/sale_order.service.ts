import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { SaleOrderAdapter } from "@sincpro/mobile-distribution/adapters/odoo/sale_order.adapter";
import { StockPickingAdapter } from "@sincpro/mobile-distribution/adapters/odoo/stock_picking.adapter";
import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { type IAuthorizedPerson } from "@sincpro/mobile-distribution/domain/customer/credit";
import { EDocumentType } from "@sincpro/mobile-distribution/domain/electronic_invoice";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { RouteOrder } from "@sincpro/mobile-distribution/domain/route";
import { ESaleOrderType, SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";

import { electronicInvoiceFeature } from "./electronic_invoice.feature";
import { distributionSettingFeature } from "./settings.feature";

class SaleOrderServiceImpl {
  private get repository() {
    return repos.get(EDistributionRepository.SALE_ORDER);
  }
  private get customerRepository() {
    return repos.get(EDistributionRepository.CUSTOMER);
  }
  private get routeOrderRepository() {
    return repos.get(EDistributionRepository.ROUTE_ORDER);
  }
  private get routeRepository() {
    return repos.get(EDistributionRepository.ROUTE);
  }
  private get invoiceRepository() {
    return repos.get(EDistributionRepository.INVOICE);
  }

  private readonly settingsFeature = distributionSettingFeature;
  private readonly electronicInvoiceFeature = electronicInvoiceFeature;

  async getOrderById(id: string | number): Promise<SaleOrder | null> {
    loggerUseCases.info(`Getting sale order by ID: ${id}`);

    let order: SaleOrder | null;

    if (typeof id === "string") {
      order = await this.repository.findById(id);
    } else {
      order = await this.repository.findByRemoteId(id);
    }

    if (!order) {
      loggerUseCases.warn(`Order ${id} not found`);
      return null;
    }

    return order;
  }

  async getAllSaleOrders(): Promise<RemoteEntityCollection<SaleOrder>> {
    loggerUseCases.info("Getting all sale orders");
    return this.repository.findAll();
  }

  async getSaleOrdersByCustomerId(
    customerId: number,
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    loggerUseCases.info(`Getting sale orders for customer ${customerId}`);
    const allOrders = await this.repository.findAll();
    const customerOrders = allOrders.filter(
      (order: SaleOrder) => order.customerId === customerId,
    );
    return new RemoteEntityCollection(customerOrders.toArray());
  }

  async fetchSaleOrdersByCustomer(
    customerIds: number[],
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    if (customerIds.length === 0) return new RemoteEntityCollection([]);

    loggerUseCases.info(`Fetching sale orders from backend for customers: ${customerIds}`);

    const allRemoteOrders: SaleOrder[] = [];
    for (const customerId of customerIds) {
      const remoteOrders = await SaleOrderAdapter.getSaleOrdersByCustomer(customerId, [], {
        limit: 10,
      });
      allRemoteOrders.push(...remoteOrders.toArray());
    }

    if (allRemoteOrders.length === 0) {
      return new RemoteEntityCollection([]);
    }

    const collection = new RemoteEntityCollection(allRemoteOrders);
    await this.mergeRemoteOrders(collection);
    return collection;
  }

  async fetchMoreSaleOrdersByCustomer(
    customerIds: number[],
    limit: number = 20,
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    if (customerIds.length === 0) return new RemoteEntityCollection([]);

    loggerUseCases.info(`Fetching ${limit} more sale orders for customers: ${customerIds}`);

    const localOrders = await this.repository.findByCriteria([
      {
        field: "customerId",
        operator: "in",
        value: customerIds,
      },
    ]);

    const existingRemoteIds = localOrders
      .mapToArray((order: SaleOrder) => order.remoteId!)
      .filter((id: number) => id != null);

    loggerUseCases.info(
      `Found ${existingRemoteIds.length} existing sale orders, excluding them from fetch`,
    );

    const allRemoteOrders: SaleOrder[] = [];
    for (const customerId of customerIds) {
      const remoteOrders = await SaleOrderAdapter.getSaleOrdersByCustomer(
        customerId,
        existingRemoteIds,
        { limit },
      );
      allRemoteOrders.push(...remoteOrders.toArray());
    }

    if (allRemoteOrders.length === 0) {
      loggerUseCases.info(`No more sale orders found for customers ${customerIds}`);
      return new RemoteEntityCollection([]);
    }

    const collection = new RemoteEntityCollection(allRemoteOrders);
    await this.mergeRemoteOrders(collection);
    loggerUseCases.info(`Fetched ${collection.length} more sale orders`);
    return collection;
  }

  async getOrdersByRouteId(
    routePlanId: number,
    query: string = "",
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    loggerUseCases.info(`Getting orders for route plan ${routePlanId}`);

    const orders = await this.repository.findByRouteId(routePlanId);

    if (query && query.trim() !== "") {
      const filtered = orders.filter(
        (o: SaleOrder) =>
          o.customerName.toLowerCase().includes(query.toLowerCase()) ||
          o.name.toLowerCase().includes(query.toLowerCase()),
      );
      return new RemoteEntityCollection(filtered.toArray());
    }
    return new RemoteEntityCollection(orders.toArray());
  }

  async fetchAndStoreMissingSaleOrders(remoteOrderIds: number[]) {
    if (remoteOrderIds.length === 0) {
      return;
    }

    loggerUseCases.info(`Fetching and merging ${remoteOrderIds.length} orders from backend`);

    const fetchedOrders = await SaleOrderAdapter.fetchSaleOrdersAsOrder(remoteOrderIds);
    if (fetchedOrders.isEmpty) {
      return;
    }

    await this.mergeRemoteOrders(fetchedOrders);
  }

  async mergeRemoteOrders(remoteOrders: RemoteEntityCollection<SaleOrder>) {
    const localOrders = await this.repository.findAll();

    const localOrderMap = localOrders.toMap((o: SaleOrder) => o.remoteId);
    const [existingRemote, missingRemote] = remoteOrders.partition((o) =>
      localOrderMap.has(o.remoteId),
    );

    if (missingRemote.isNotEmpty) {
      await this.repository.save(missingRemote);
      loggerUseCases.info(`Saved ${missingRemote.length} new orders from remote`);
    }

    loggerUseCases.info(`Merging ${existingRemote.length} existing orders with remote data`);
    for (const remoteOrder of existingRemote) {
      const localOrder = localOrderMap.get(remoteOrder.remoteId);
      if (!localOrder) continue;
      localOrder.mergeWithRemote(remoteOrder);
      await this.repository.save(localOrder);
    }

    for (const order of remoteOrders) {
      await order.publishAllDomainEvents();
    }
  }

  async mergeRemoteOrdersForRoute(
    remoteOrders: RemoteEntityCollection<SaleOrder>,
    routeId: number,
  ) {
    const localOrders = await this.repository.findAll();
    const localOrderMap = localOrders.toMap((o: SaleOrder) => o.remoteId);

    const [existingRemote, missingRemote] = remoteOrders.partition((o) =>
      localOrderMap.has(o.remoteId),
    );

    if (missingRemote.isNotEmpty) {
      await this.repository.save(missingRemote);
      loggerUseCases.info(`Saved ${missingRemote.length} new orders for route ${routeId}`);
    }

    loggerUseCases.info(
      `Merging ${existingRemote.length} existing orders for route ${routeId}`,
    );
    for (const remoteOrder of existingRemote) {
      const localOrder = localOrderMap.get(remoteOrder.remoteId);
      if (!localOrder) continue;
      localOrder.mergeWithRemote(remoteOrder);
      await this.repository.save(localOrder);
    }

    for (const order of remoteOrders) {
      await order.publishAllDomainEvents();
    }
    return existingRemote.union(missingRemote);
  }

  async createQuotationOrder(order: SaleOrder, customer?: Customer): Promise<SaleOrder> {
    loggerUseCases.info("Creating new quotation order");
    const activeRemoteRouteId = await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();
    order.createAsQuotation(customer, activeRemoteRouteId);
    await this.repository.save(order);
    await order.publishAllDomainEventsSync();

    loggerUseCases.info(`Quotation ${order.name} created`);
    return order;
  }

  async confirmQuotationToSaleOrder(orderId: string): Promise<SaleOrder> {
    loggerUseCases.info(`Confirming quotation ${orderId}`);

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.orderType !== ESaleOrderType.QUOTATION) {
      throw new Error(`Order ${orderId} is not a quotation, it is ${order.orderType}`);
    }

    const routeRemoteId = await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();

    order.confirmOrder(routeRemoteId);
    await this.repository.save(order);
    await order.publishAllDomainEventsSync();

    loggerUseCases.info(`Quotation ${order.name} confirmed successfully`);
    return order;
  }

  async createSaleOrder(order: SaleOrder, customer?: Customer): Promise<SaleOrder> {
    loggerUseCases.info("Creating new sale order");
    const activeRemoteRouteId = await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();

    order.createAsSaleOrder(customer, activeRemoteRouteId!);
    await this.repository.save(order);
    await order.publishAllDomainEventsSync();

    loggerUseCases.info(`Sale order ${order.name} created`);
    return order;
  }

  async updateOrder(orderToUpdate: SaleOrder): Promise<SaleOrder> {
    loggerUseCases.info(`Updating order ${orderToUpdate.name}`);
    await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();

    const existingOrder = await this.repository.findById(orderToUpdate.uuid);
    if (!existingOrder) {
      throw new Error(`Order ${orderToUpdate.uuid} not found`);
    }

    const validationErrors = existingOrder.validateForUpdate(orderToUpdate);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join("; "));
    }

    existingOrder.applyUpdate(orderToUpdate);
    await this.repository.save(existingOrder);
    await existingOrder.publishAllDomainEventsSync();

    loggerUseCases.info(`Order ${existingOrder.name} updated`);
    return existingOrder;
  }

  async markAsDelivered(orderId: string): Promise<SaleOrder> {
    loggerUseCases.info(`Marking order ${orderId} as delivered`);

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();

    const saleOrder = SaleOrder.fromJSON(order);
    saleOrder.markAsDone();

    await this.repository.save(saleOrder);
    loggerUseCases.info(`Order ${saleOrder.name} marked as delivered`);
    return saleOrder;
  }

  async fetchRemoteSaleOrdersByRouteId(
    routeId: number,
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    loggerUseCases.info(`Fetching remote sale orders for route ID ${routeId}`);
    const remoteOrders = await SaleOrderAdapter.fetchSaleOrdersByRoute(routeId);

    if (remoteOrders.isEmpty) {
      loggerUseCases.info(`No remote sale orders found for route ID ${routeId}`);
      return remoteOrders;
    }
    return remoteOrders;
  }

  async fetchRemoteSaleOrdersByRemoteIds(
    saleOrderRemoteIds: number[],
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    return await SaleOrderAdapter.fetchSaleOrdersAsOrder(saleOrderRemoteIds);
  }

  async fetchRemoteAndStoreOrdersByIds(
    saleOrderRemoteIds: number[],
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    if (saleOrderRemoteIds.length === 0) {
      return new RemoteEntityCollection([]);
    }

    loggerUseCases.info(`Fetching ${saleOrderRemoteIds.length} orders from backend`);
    const orders = await this.fetchRemoteSaleOrdersByRemoteIds(saleOrderRemoteIds);

    if (orders.isEmpty) {
      return orders;
    }
    await this.mergeRemoteOrders(orders);
    loggerUseCases.info(`Fetched and saved ${orders.length} orders`);
    return orders;
  }

  async payOrder(
    orderId: string,
    payments: Payment[],
    documentType: EDocumentType,
    discount: number = 0,
    percentageDiscount?: number,
  ): Promise<SaleOrder> {
    loggerUseCases.info(`Paying order ${orderId} (V2)`);

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();

    const saleOrder = SaleOrder.fromJSON(order);

    if (saleOrder.orderType === ESaleOrderType.QUOTATION) {
      saleOrder.confirmOrder(undefined, discount, percentageDiscount);
    }

    saleOrder.payOrderV2(payments, documentType);
    saleOrder.markAsDone();

    await this.repository.save(saleOrder);
    await saleOrder.publishAllDomainEventsSync();

    loggerUseCases.info(`Order ${saleOrder.name} paid successfully (V2)`);
    return saleOrder;
  }

  async payOrderWithCredit(
    orderId: string,
    customer: Customer,
    documentType: EDocumentType,
    authorizedPerson?: IAuthorizedPerson,
  ): Promise<SaleOrder> {
    loggerUseCases.info(`Paying order ${orderId} with customer credit`);

    if (!customer.availableCredit || customer.availableCredit <= 0) {
      throw new Error(
        `Customer ${customer.name} has no available credit (${customer.availableCredit || 0})`,
      );
    }

    await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const saleOrder = SaleOrder.fromJSON(order);

    if (saleOrder.orderType !== ESaleOrderType.SALE_ORDER) {
      saleOrder.confirmOrder();
    }

    if (saleOrder.amountResidual > customer.availableCredit) {
      throw new Error(
        `Order amount (${saleOrder.amountResidual}) exceeds available credit (${customer.availableCredit})`,
      );
    }

    if (!customer.creditApplicationIds || customer.creditApplicationIds.length === 0) {
      throw new Error(`Customer ${customer.name} has no credit applications`);
    }

    saleOrder.payOrderWithCreditV2(
      documentType,
      customer.creditApplicationIds[0],
      customer.paymentTermDisplay,
      authorizedPerson?.name,
      authorizedPerson?.partnerId,
    );
    saleOrder.markAsDone();

    await this.repository.save(saleOrder);
    await saleOrder.publishAllDomainEventsSync();

    loggerUseCases.info(`Order ${saleOrder.name} paid with credit successfully`);
    return saleOrder;
  }

  async getLastSaleOrdersForCustomer(
    customerId: number,
  ): Promise<RemoteEntityCollection<SaleOrder>> {
    loggerUseCases.info(`Fetching last sale orders for customer ${customerId}`);

    const remoteOrders = await SaleOrderAdapter.getSaleOrdersByCustomer(customerId, [], {
      limit: 4,
    });

    if (remoteOrders.isEmpty) {
      loggerUseCases.info(`No sale orders found for customer ${customerId}`);
      return remoteOrders;
    }

    await this.mergeRemoteOrders(remoteOrders);
    loggerUseCases.info(
      `Merged ${remoteOrders.length} sale orders for customer ${customerId}`,
    );

    return remoteOrders;
  }

  async linkOrdersToRouteOrders(
    routeOrders: RemoteEntityCollection<RouteOrder>,
    saleOrders: RemoteEntityCollection<SaleOrder>,
  ): Promise<void> {
    loggerUseCases.info(`Linking ${saleOrders.length} SaleOrders to RouteOrders`);

    if (routeOrders.isEmpty || saleOrders.isEmpty) {
      loggerUseCases.warn("No RouteOrders or SaleOrders provided for linking");
      return;
    }
    const localSaleOrders = await this.repository.findByRemoteIds(
      saleOrders.mapToArray((so) => so.remoteId!),
    );

    const routeOrderMap = routeOrders.toMap((ro) => ro.extractRemoteId());

    const ordersToUpdate: SaleOrder[] = [];
    for (const saleOrder of localSaleOrders) {
      const routeOrder = routeOrderMap.get(saleOrder.remoteId!);
      if (saleOrder.remoteId && routeOrder) {
        saleOrder.metaOrderId = routeOrder.remoteId!;
        ordersToUpdate.push(saleOrder);
      }
    }

    if (ordersToUpdate.length > 0) {
      await this.repository.save(ordersToUpdate);
      loggerUseCases.info(`Linked ${ordersToUpdate.length} SaleOrders to their RouteOrders`);
    }
  }

  async pushQuotationToBackend(order: SaleOrder): Promise<SaleOrder> {
    loggerUseCases.info(`Creating quotation in backend for order ${order.uuid}`);
    const result = await SaleOrderAdapter.createQuotation(order);
    await this.repository.save(result);
    loggerUseCases.info(`Quotation ${result.name} created in backend successfully`);
    return result;
  }

  async confirmQuotationInBackend(order: SaleOrder): Promise<SaleOrder> {
    loggerUseCases.info(`Confirming quotation in backend for order ${order.uuid}`);
    const result = await SaleOrderAdapter.confirmQuotation(order);
    await this.repository.save(result);
    loggerUseCases.info(`Quotation ${result.name} confirmed in backend successfully`);
    return result;
  }

  async pushSaleOrderToBackend(order: SaleOrder): Promise<SaleOrder> {
    loggerUseCases.info(`Creating sale order in backend for order ${order.uuid}`);

    const quotation = await SaleOrderAdapter.createQuotation(order);
    await this.repository.save(quotation);
    loggerUseCases.info(`Quotation ${quotation.name} created in backend`);

    const confirmed = await SaleOrderAdapter.confirmQuotation(quotation);
    await this.repository.save(confirmed);
    loggerUseCases.info(`Sale order ${confirmed.name} confirmed in backend successfully`);

    return confirmed;
  }

  async createRemoteInvoice(invoice: Invoice): Promise<Invoice> {
    loggerUseCases.info(`Creating remote invoice for sale order ${invoice.saleOrderUUID}`);
    const updatedInvoice = await SaleOrderAdapter.createInvoiceForSaleOrder(invoice);
    await this.invoiceRepository.save(updatedInvoice);
    loggerUseCases.info(
      `Remote invoice created: ${updatedInvoice.name} and remoteId: ${updatedInvoice.remoteId}`,
    );
    return updatedInvoice;
  }

  async refreshSaleOrderFromBackend(id: number | string): Promise<SaleOrder | null> {
    loggerUseCases.info(`Refreshing sale order ${id} from backend`);

    let localOrder: SaleOrder | null;
    if (typeof id === "string") {
      localOrder = await this.repository.findById(id);
    } else {
      localOrder = await this.repository.findByRemoteId(id);
    }

    if (!localOrder) {
      loggerUseCases.warn(`Sale order ${id} not found locally`);
      return null;
    }

    try {
      const identifier = localOrder.remoteId ?? localOrder.uuid;
      const remoteDTO = await SaleOrderAdapter.fetchOneSaleOrder(identifier);

      if (!remoteDTO) {
        loggerUseCases.warn(`Sale order ${id} not found in backend`);
        return localOrder;
      }

      const remoteOrder = SaleOrder.fromRemoteDTO(remoteDTO);
      localOrder.mergeWithRemote(remoteOrder);

      await this.repository.save(localOrder);
      loggerUseCases.info(`Sale order ${id} refreshed from backend`);
      return localOrder;
    } catch (error) {
      loggerUseCases.error(`Failed to refresh sale order ${id}: ${error}`);
      return localOrder;
    }
  }

  async returnProducts(creditNote: CreditNote): Promise<void> {
    loggerUseCases.info(
      `Processing stock return for sale order from credit note ${creditNote.name}`,
    );

    if (!creditNote.originalOrderId || creditNote.originalOrderId <= 0) {
      throw new Error(
        `Cannot process stock return without originalOrderId for ${creditNote.name}`,
      );
    }

    if (creditNote.hasPhysicalReturn) {
      loggerUseCases.info(`Credit note ${creditNote.name} already has physical return`);
      return;
    }

    const hasRemoteReturn = await StockPickingAdapter.hasPhysicalReturn(creditNote.uuid);
    if (hasRemoteReturn) {
      loggerUseCases.info(`Physical return already exists in backend for ${creditNote.uuid}`);
      const status = await StockPickingAdapter.getPhysicalReturnStatus(creditNote.uuid);
      if (status.picking) {
        creditNote.setPhysicalReturn(status.picking.id, status.picking.name);
        const creditNoteRepo = repos.get(EDistributionRepository.CREDIT_NOTE);
        await creditNoteRepo.save(creditNote);
      }
      return;
    }

    const { pickingId, pickingName } =
      await StockPickingAdapter.createPhysicalReturnFromCreditNote(
        creditNote,
        creditNote.originalOrderId,
      );

    creditNote.setPhysicalReturn(pickingId, pickingName);
    const creditNoteRepo = repos.get(EDistributionRepository.CREDIT_NOTE);
    await creditNoteRepo.save(creditNote);

    loggerUseCases.info(
      `Physical return ${pickingName} created for sale order from credit note ${creditNote.name}`,
    );
  }
}

export const saleOrderService = new SaleOrderServiceImpl();
