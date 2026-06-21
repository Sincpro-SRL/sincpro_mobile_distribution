import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { InvoiceAdapter } from "@sincpro/mobile-distribution/adapters/odoo/invoice.adapter";
import {
  Invoice,
  InvoicePenalizationInfoFetchedEvent,
  IRemoteInvoiceDTO,
} from "@sincpro/mobile-distribution/domain/invoice";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";
import _ from "lodash";

import { electronicInvoiceFeature } from "./electronic_invoice.feature";
import { distributionSettingFeature } from "./settings.feature";

class InvoiceServiceImpl {
  private get repository() {
    return repos.get(EDistributionDomainRepository.INVOICE);
  }
  private readonly settingsFeature = distributionSettingFeature;
  private readonly electronicInvoiceFeature = electronicInvoiceFeature;

  private async mergeRemoteInvoices(
    remoteInvoices: RemoteEntityCollection<Invoice>,
  ): Promise<void> {
    const localInvoices = await this.repository.findAll();
    const localMap = localInvoices.toMap((i: Invoice) => i.remoteId);

    const [existing, missing] = remoteInvoices.partition((i) => localMap.has(i.remoteId));

    if (missing.isNotEmpty) {
      await this.repository.save(missing);
      loggerUseCases.info(`Saved ${missing.length} new invoices from remote`);
    }

    for (const remoteInvoice of existing) {
      const localInvoice = localMap.get(remoteInvoice.remoteId);
      if (!localInvoice) continue;
      localInvoice.mergeWithRemote(remoteInvoice);
      await this.repository.save(localInvoice);
    }

    if (existing.isNotEmpty) {
      loggerUseCases.info(`Merged ${existing.length} existing invoices with remote data`);
    }
  }

  async getAllInvoices(): Promise<RemoteEntityCollection<Invoice>> {
    loggerUseCases.info("Getting all invoices from local database");
    const invoices = await this.repository.findAll();
    loggerUseCases.info(`Found ${invoices.length} invoices`);
    return invoices;
  }

  async fetchAndStoreRemoteInvoiceByRemoteID(
    remoteIds: number[],
  ): Promise<RemoteEntityCollection<Invoice>> {
    if (remoteIds.length === 0) {
      return new RemoteEntityCollection([]);
    }

    loggerUseCases.info(`Fetching invoices by remote IDs: ${remoteIds.join(", ")}`);

    const invoices = await InvoiceAdapter.getInvoicesByIds(remoteIds);

    if (invoices.isEmpty) {
      return invoices;
    }

    await this.mergeRemoteInvoices(invoices);
    return invoices;
  }

  async createLocalInvoice(
    invoices: RemoteEntityCollection<Invoice>,
  ): Promise<RemoteEntityCollection<Invoice>> {
    for (const invoice of invoices) {
      if (!invoice.consecutiveNumber && invoice.documentType) {
        await this.electronicInvoiceFeature.addElectronicInvoiceToOrder(
          invoice,
          invoice.documentType,
        );
      }
    }
    await this.repository.save(invoices);
    return invoices;
  }

  async findOrCreateInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    let invoice = await this.repository.findById(invoiceData.uuid!);
    if (invoice) {
      return invoice;
    }

    const invoices = await this.createLocalInvoice(
      new RemoteEntityCollection<Invoice>([Invoice.fromJSON(invoiceData)]),
    );

    return invoices.first()!;
  }

  async storeMissingInvoiceFromRemote(remoteInvoices: IRemoteInvoiceDTO[]) {
    const remoteOnlyOutInvoices = remoteInvoices.filter(
      (inv) => inv.move_type === "out_invoice",
    );
    const allInvoices = await this.repository.findAll();
    const mapLocalInvoices = allInvoices.toMapByRemoteId();
    const missingInvoices = remoteOnlyOutInvoices.filter(
      (inv) => !mapLocalInvoices.has(inv.id),
    );

    if (missingInvoices.length === 0) {
      return;
    }

    const invoiceToStore = RemoteEntityCollection.fromRemoteDTO(missingInvoices, Invoice);
    await this.repository.save(invoiceToStore);
    loggerUseCases.info(`Stored ${invoiceToStore.length} from remote source`);

    return invoiceToStore;
  }

  async getInvoicesByCustomer(
    customerIds: number[],
  ): Promise<RemoteEntityCollection<Invoice>> {
    loggerUseCases.info(`Getting invoices for customers ${customerIds}`);

    const invoices = await this.repository.findByCriteria([
      {
        field: "customerId",
        operator: "in",
        value: customerIds,
      },
    ]);

    if (invoices.isEmpty) {
      loggerUseCases.info(`No local invoices, fetching from backend`);
      return await this.fetchNotPaidInvoicesByCustomer(customerIds);
    }

    return new RemoteEntityCollection(invoices.toArray());
  }

  async getInvoiceByUUID(uuid: string): Promise<Invoice | null> {
    loggerUseCases.info(`Getting invoice by UUID: ${uuid}`);

    const invoice = await this.repository.findById(uuid);
    if (!invoice) {
      loggerUseCases.warn(`Invoice ${uuid} not found`);
      return null;
    }

    return invoice;
  }

  async getInvoiceByRemoteId(invoiceId: number): Promise<Invoice | null> {
    loggerUseCases.info(`Getting invoice by ID: ${invoiceId}`);

    const invoice = await this.repository.findByRemoteId(invoiceId);
    if (!invoice) {
      loggerUseCases.warn(`Invoice ${invoiceId} not found`);
      return null;
    }

    return invoice;
  }

  async addPenalizationInfoToInvoice(remoteIds: number[]): Promise<void> {
    if (remoteIds.length === 0) {
      return;
    }
    loggerUseCases.info(`Fetching penalization info for invoices: ${remoteIds.join(", ")}`);
    const penalizationInfo = await InvoiceAdapter.fetchPenalizationInformation(remoteIds);

    for (const [remoteId, penalization] of _.zip(remoteIds, penalizationInfo)) {
      const invoice = await this.repository.findByRemoteId(remoteId!);
      if (!invoice) {
        loggerUseCases.warn(`Invoice with remote ID ${remoteId} not found locally`);
        continue;
      }

      invoice.penalizationAmount = penalization!.amount_penalization;
      await this.repository.save(invoice);
      loggerUseCases.info(
        `Updated invoice ${invoice.remoteId!} with penalization amount ${penalization!.amount_penalization}`,
      );
    }
  }

  async fetchNotPaidInvoicesByCustomer(
    customerIds: number[],
  ): Promise<RemoteEntityCollection<Invoice>> {
    loggerUseCases.info(`Fetching unpaid invoices for customers ${customerIds}`);

    const invoices = await InvoiceAdapter.getNotPaidInvoicesByCustomer(customerIds);

    if (invoices.isEmpty) {
      loggerUseCases.info(`No unpaid invoices found for customers ${customerIds}`);
      return invoices;
    }

    await this.mergeRemoteInvoices(invoices);
    loggerUseCases.info(`Fetched ${invoices.length} unpaid invoices`);

    await invoices.publishDomainEvent<InvoicePenalizationInfoFetchedEvent>(
      InvoicePenalizationInfoFetchedEvent,
      {
        remoteInvoiceIds: invoices.mapToArray((i) => i.remoteId!),
      },
    );
    return invoices;
  }

  async fetchMoreInvoicesByCustomer(
    customerIds: number[],
    limit: number = 20,
  ): Promise<RemoteEntityCollection<Invoice>> {
    loggerUseCases.info(`Fetching ${limit} more invoices for customers ${customerIds}`);

    const localInvoices = await this.repository.findByCriteria([
      {
        field: "customerId",
        operator: "in",
        value: customerIds,
      },
    ]);

    const existingRemoteIds = localInvoices
      .mapToArray((inv: Invoice) => inv.remoteId!)
      .filter((id: number) => id != null);

    loggerUseCases.info(
      `Found ${existingRemoteIds.length} existing invoices, excluding them from fetch`,
    );

    const invoices = await InvoiceAdapter.fetchMoreInvoicesByCustomer(
      customerIds,
      limit,
      existingRemoteIds,
    );

    if (invoices.isEmpty) {
      loggerUseCases.info(`No more invoices found for customers ${customerIds}`);
      return invoices;
    }

    await this.mergeRemoteInvoices(invoices);
    loggerUseCases.info(`Fetched ${invoices.length} more invoices`);
    return invoices;
  }

  async refreshInvoicesFromBackend(
    invoiceIds: number[],
  ): Promise<RemoteEntityCollection<Invoice>> {
    if (invoiceIds.length === 0) return new RemoteEntityCollection([]);

    loggerUseCases.info(`Refreshing ${invoiceIds.length} invoices from backend`);

    const remoteInvoices = await InvoiceAdapter.refreshInvoicesFromBackend(invoiceIds);

    if (remoteInvoices.isEmpty) {
      loggerUseCases.warn(`No invoices found in backend for IDs: ${invoiceIds}`);
      return new RemoteEntityCollection([]);
    }

    await this.mergeRemoteInvoices(remoteInvoices);
    loggerUseCases.info(`Refreshed ${remoteInvoices.length} invoices from backend`);

    return remoteInvoices;
  }

  async postInvoice(invoiceId: string): Promise<Invoice> {
    loggerUseCases.info(`Posting invoice ${invoiceId}`);
    const activeRouteId = await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();
    const existingInvoice = await this.repository.findById(invoiceId);
    if (!existingInvoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const invoice = Invoice.fromJSON<Invoice>(existingInvoice);
    invoice.setRoute(activeRouteId);

    if (!invoice.remoteId) {
      throw new Error(`Invoice ${invoiceId} has no remote ID, cannot post`);
    }

    if (invoice.isPosted()) {
      loggerUseCases.warn(`Invoice ${invoiceId} is already posted`);
      return invoice;
    }

    const postedInvoice = await InvoiceAdapter.postInvoice(
      invoice.remoteId,
      activeRouteId,
      invoice.uuid,
    );

    invoice.mergeWithRemote(postedInvoice);
    await this.repository.save(invoice);

    loggerUseCases.info(`Invoice ${invoice.name} posted successfully`);
    return invoice;
  }

  async payInvoice(invoiceId: string, payments: Payment[]): Promise<Invoice> {
    loggerUseCases.info(`Paying invoice ${invoiceId}`);
    const activeRouteId = await this.settingsFeature.getOrRaiseErrorIfNotActiveRoute();

    if (payments.some((p) => p.isCreditPayment)) {
      throw new Error(`Cannot pay invoice ${invoiceId} with credit payments`);
    }

    const existingInvoice = await this.repository.findById(invoiceId);
    if (!existingInvoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const invoice = Invoice.fromJSON<Invoice>(existingInvoice);
    invoice.setRoute(activeRouteId);

    invoice.payInvoice(payments);

    await this.repository.save(invoice);
    await invoice.publishAllDomainEventsSync();

    loggerUseCases.info(`Invoice ${invoice.name} paid successfully`);
    return invoice;
  }

  async reconcileInvoiceWithPayments(invoice: Invoice, payments: Payment[]): Promise<void> {
    const syncedPaymentIds = payments.map((p) => p.concretePayment?.remoteId!);
    const invoiceRemoteId = invoice.remoteId;

    if (!invoiceRemoteId) {
      throw new Error(`Invoice ${invoice.uuid} has no remote ID`);
    }

    if (!syncedPaymentIds || syncedPaymentIds.length === 0) {
      throw new Error(
        `Payments have no remote IDs to reconcile with invoice ${invoice.uuid}`,
      );
    }

    await InvoiceAdapter.reconcileInvoiceAndPayments(invoiceRemoteId, syncedPaymentIds);
    await this.fetchAndStoreRemoteInvoiceByRemoteID([invoiceRemoteId]);

    loggerUseCases.info(
      `Reconciled invoice ${invoice.remoteId} with ${syncedPaymentIds.length} payments`,
    );
  }

  async refreshInvoiceFromBackend(id: number | string): Promise<Invoice | null> {
    loggerUseCases.info(`Refreshing invoice ${id} from backend`);

    let localInvoice: Invoice | null;
    if (typeof id === "string") {
      localInvoice = await this.repository.findById(id);
    } else {
      localInvoice = await this.repository.findByRemoteId(id);
    }

    if (!localInvoice) {
      loggerUseCases.warn(`Invoice ${id} not found locally`);
      return null;
    }

    try {
      const identifier = localInvoice.remoteId ?? localInvoice.uuid;
      const remoteInvoice = await InvoiceAdapter.fetchSingleInvoice(identifier);

      if (!remoteInvoice) {
        loggerUseCases.warn(`Invoice ${id} not found in backend`);
        return localInvoice;
      }

      localInvoice.mergeWithRemote(remoteInvoice);
      await this.repository.save(localInvoice);
      await this.addPenalizationInfoToInvoice([localInvoice.remoteId!]);
      loggerUseCases.info(`Invoice ${id} refreshed from backend`);
      return this.getInvoiceByRemoteId(localInvoice.remoteId!);
    } catch (error) {
      loggerUseCases.error(`Failed to refresh invoice ${id}: ${error}`);
      return localInvoice;
    }
  }

  async fetchAndLinkPayment(paymentUUID: string, remoteId: number): Promise<Invoice | null> {
    loggerUseCases.info(`Linking payment ${paymentUUID} to invoice remoteId ${remoteId}`);

    let invoice = await this.repository.findByRemoteId(remoteId);
    const remoteInvoice = await InvoiceAdapter.fetchSingleInvoice(remoteId);

    if (!remoteInvoice) {
      loggerUseCases.warn(`Invoice ${remoteId} not found in backend`);
      return null;
    }

    if (invoice) {
      invoice.mergeWithRemote(remoteInvoice);
    } else {
      invoice = remoteInvoice;
    }

    invoice.addPaymentId(paymentUUID);
    await this.repository.save(invoice);
    loggerUseCases.info(`Payment ${paymentUUID} linked to invoice ${invoice.uuid}`);

    return invoice;
  }
}

export const invoiceService = new InvoiceServiceImpl();
