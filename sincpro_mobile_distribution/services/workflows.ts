import { RemoteEntityCollection } from "@sincpro/mobile/domain";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import {
  Customer,
  CustomerID,
  ECustomerRouteStatus,
} from "@sincpro/mobile-distribution/domain/customer";
import { CustomersFetchedEvent } from "@sincpro/mobile-distribution/domain/customer/events";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import { electronicInvoiceFeature } from "@sincpro/mobile-distribution/services/electronic_invoice.feature";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";
import { priceListService } from "@sincpro/mobile-distribution/services/price_list.service";
import { productService } from "@sincpro/mobile-distribution/services/product.service";
import { routeService } from "@sincpro/mobile-distribution/services/route.service";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";
import { distributionSettingFeature } from "@sincpro/mobile-distribution/services/settings.feature";

class DistributionWorkflowsImp {
  private get customerRepository() {
    return repos.get(EDistributionDomainRepository.CUSTOMER);
  }

  private readonly customerService = customerService;
  private readonly electronicInvoiceService = electronicInvoiceFeature;
  private readonly priceListService = priceListService;
  private readonly productService = productService;
  private readonly routeService = routeService;
  private readonly saleOrderService = saleOrderService;
  private readonly distributionSettingFeature = distributionSettingFeature;
  private readonly creditNoteService = creditNoteService;
  private readonly invoiceService = invoiceService;
  private readonly paymentService = paymentService;

  async configureDistributionSettings() {
    loggerUseCases.info(
      `STARTED WORKFLOW: ${this.constructor.name}#${this.configureDistributionSettings.name} - STARTED`,
    );

    try {
      await this.electronicInvoiceService.loadInvoiceConsecutive();
    } catch (e) {
      loggerUseCases.warn(
        `Failed to load invoice consecutive during distribution settings configuration ${e}`,
      );
    }

    try {
      await this.electronicInvoiceService.loadTicketConsecutive();
    } catch (e) {
      loggerUseCases.warn(
        `Failed to load ticket consecutive during distribution settings configuration ${e}`,
      );
    }

    try {
      await this.productService.fetchAllProductsFromBackend();
    } catch (e) {
      loggerUseCases.warn(
        `Failed to load products during distribution settings configuration ${e}`,
      );
    }

    await this.routeService.loadActiveRoutes();

    loggerUseCases.info(
      `COMPLETED WORKFLOW: ${this.constructor.name}#${this.configureDistributionSettings.name} - FINISHED`,
    );
  }

  async pullRouteDataWorkflow(routeRemoteID: number) {
    loggerUseCases.info(
      `STARTED WORKFLOW: ${this.constructor.name}#${this.pullRouteDataWorkflow.name}`,
    );
    const route = await this.routeService.getRouteByRemoteId(routeRemoteID);
    if (!route) {
      return;
    }

    const customers = new RemoteEntityCollection<Customer>(
      route.rawData!.line_ids.map((line) => Customer.fromRemoteDTO(line.partner_id)),
    );

    await customers.publishDomainEvent<CustomersFetchedEvent>(CustomersFetchedEvent, {
      customerIds: customers.mapToArray((c) => c.remoteId!),
    });

    for (const customer of customers!) {
      await this.customerService.createCustomer(customer, ECustomerRouteStatus.PLANNED);
    }

    const remoteSaleOrders = await this.saleOrderService.fetchRemoteSaleOrdersByRemoteIds(
      route.saleOrderIds,
    );

    const additionalSaleOrders = await this.saleOrderService.fetchRemoteSaleOrdersByRouteId(
      route.remoteId!,
    );

    const allSaleOrders = remoteSaleOrders.union(additionalSaleOrders);
    for (const saleOrder of allSaleOrders) {
      saleOrder.routeId = route.remoteId!;
    }

    await this.saleOrderService.mergeRemoteOrdersForRoute(allSaleOrders, route.remoteId!);
    await this.saleOrderService.linkOrdersToRouteOrders(route.orders, remoteSaleOrders);

    await this.customerService.fetchAndStoreMissingCustomersByRemoteIds(
      allSaleOrders.mapToArray((order) => order.customerId!),
    );

    await this.paymentService.pullAndMergeOdooPaymentsByRouteID(routeRemoteID);
    await this.paymentService.pullAndMergeCreditPaymentsByRouteID(routeRemoteID);

    await this.routeService.fetchConsolidatedRouteStock(route.remoteId!);
    await this.creditNoteService.fetchCreditNotesByRouteId(route.remoteId!);

    loggerUseCases.info(
      `COMPLETED WORKFLOW: ${this.constructor.name}#${this.pullRouteDataWorkflow.name} - FINISHED`,
    );
  }

  async pullAndMergeRemoteOrdersWorkflow(routeRemoteId: number) {
    loggerUseCases.info(
      `STARTED WORKFLOW: ${this.constructor.name}#${this.pullAndMergeRemoteOrdersWorkflow.name} - STARTED`,
    );
    const route = await this.routeService.getRouteByRemoteId(routeRemoteId);
    if (!route) {
      return;
    }
    const remoteSaleOrders = await this.saleOrderService.fetchRemoteSaleOrdersByRemoteIds(
      route.saleOrderIds,
    );

    const additionalSaleOrders = await this.saleOrderService.fetchRemoteSaleOrdersByRouteId(
      route.remoteId!,
    );

    const allSaleOrders = remoteSaleOrders.union(additionalSaleOrders);

    if (allSaleOrders.isEmpty) {
      return;
    }
    for (const saleOrder of allSaleOrders) {
      saleOrder.routeId = route.remoteId!;
    }

    await this.saleOrderService.mergeRemoteOrdersForRoute(allSaleOrders, route.remoteId!);

    const remoteCustomerIds = remoteSaleOrders.toArray().map((order) => order.customerId!);
    await this.customerService.fetchAndStoreMissingCustomersByRemoteIds(remoteCustomerIds);

    loggerUseCases.info(
      `COMPLETED WORKFLOW: ${this.constructor.name}#${this.pullAndMergeRemoteOrdersWorkflow.name} - FINISHED`,
    );
  }

  async pullCustomerDataWorkflow(customerIds: CustomerID[]) {
    loggerUseCases.info(
      `STARTED WORKFLOW: ${this.constructor.name}#${this.pullCustomerDataWorkflow.name} - STARTED`,
    );

    for (const customerId of customerIds) {
      try {
        await this.saleOrderService.getLastSaleOrdersForCustomer(customerId);
      } catch (e) {
        loggerUseCases.warn(
          `Failed to load sale orders for customer ${customerId} during pullCustomerDataWorkflow ${e}`,
        );
      }
    }

    await this.creditNoteService.fetchCreditNotesByCustomer(customerIds);
    await this.invoiceService.fetchNotPaidInvoicesByCustomer(customerIds);
    await this.customerService.aggregateCreditToCustomers(customerIds);
    loggerUseCases.info(
      `COMPLETED WORKFLOW: ${this.constructor.name}#${this.pullCustomerDataWorkflow.name} - FINISHED`,
    );
  }

  async syncDistributionApp() {
    loggerUseCases.info(
      `STARTED WORKFLOW: ${this.constructor.name}#${this.syncDistributionApp.name} - STARTED`,
    );
    const activeRoute = await this.distributionSettingFeature.getActiveRoute();
    if (!activeRoute) {
      loggerUseCases.info(`No active route set, skipping syncDistributionApp workflow`);
      return;
    }

    try {
      await this.routeService.pushRouteToBackend(activeRoute);
      await this.routeService.fetchConsolidatedRouteStock(activeRoute);
      await this.customerService.pullAndMergeCustomersFromBackend();
      await this.customerService.pushCustomersToBackend();
      loggerUseCases.info("Active routes synchronized successfully");
    } catch (error) {
      loggerUseCases.error(
        `Failed to sync active routes during distribution app sync: ${error}`,
      );
      throw error;
    }

    loggerUseCases.info(
      `COMPLETED WORKFLOW: ${this.constructor.name}#${this.syncDistributionApp.name} - FINISHED`,
    );
  }
}

export const distributionWorkflows = new DistributionWorkflowsImp();
