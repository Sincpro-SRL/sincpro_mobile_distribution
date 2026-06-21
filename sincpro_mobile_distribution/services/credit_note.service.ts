import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { CreditNoteAdapter } from "@sincpro/mobile-distribution/adapters/odoo/credit_note.adapter";
import { CreditNote, CreditNoteLine } from "@sincpro/mobile-distribution/domain/credit_note";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";
import { SaleOrder, SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";
import { distributionSettingFeature } from "@sincpro/mobile-distribution/services/settings.feature";

class CreditNoteServiceImpl {
  private get repository() {
    return repos.get(EDistributionDomainRepository.CREDIT_NOTE);
  }
  private get saleOrderRepository() {
    return repos.get(EDistributionDomainRepository.SALE_ORDER);
  }

  private readonly settingsFetuare = distributionSettingFeature;

  static createFromOriginalOrder(
    originalOrder: SaleOrder,
    selectedLines: SaleOrderLine[],
  ): CreditNote {
    return CreditNote.createFromOriginalOrder(originalOrder, selectedLines);
  }

  async createLocalCreditNote(
    creditNotes: RemoteEntityCollection<CreditNote>,
  ): Promise<RemoteEntityCollection<CreditNote>> {
    await distributionSettingFeature.getOrRaiseErrorIfNotActiveRoute();
    for (const creditNote of creditNotes) {
      creditNote.markAsCreated();
    }

    await this.repository.save(creditNotes);
    for (const creditNote of creditNotes) {
      await creditNote.publishAllDomainEventsSync();
    }
    return creditNotes;
  }

  async findOrCreateCreditNote(creditNoteData: Partial<CreditNote>): Promise<CreditNote> {
    const creditNote = await this.repository.findById(creditNoteData.uuid!);
    if (creditNote) {
      return creditNote;
    }

    const creditNotes = await this.createLocalCreditNote(
      new RemoteEntityCollection<CreditNote>([CreditNote.fromJSON(creditNoteData)]),
    );

    return creditNotes.first()!;
  }

  async postCreditNote(creditNoteUUID: string): Promise<CreditNote> {
    loggerUseCases.info(`Posting credit note ${creditNoteUUID} (local)`);
    await distributionSettingFeature.getOrRaiseErrorIfNotActiveRoute();

    const existingCreditNote = await this.repository.findById(creditNoteUUID);
    if (!existingCreditNote) {
      throw new Error(`Credit note ${creditNoteUUID} not found`);
    }

    if (!existingCreditNote.remoteId || existingCreditNote.remoteId <= 0) {
      throw new Error(`Cannot post credit note without remoteId. Push to backend first.`);
    }

    const creditNote = CreditNote.fromJSON<CreditNote>(existingCreditNote);

    if (creditNote.state === "posted") {
      loggerUseCases.info(`Credit note ${creditNote.name} already posted locally`);
      return creditNote;
    }

    creditNote.markAsPosted();
    await this.repository.save(creditNote);
    await creditNote.publishAllDomainEventsSync();

    loggerUseCases.info(`Credit note ${creditNote.name} marked as posted (local)`);
    return creditNote;
  }

  async payCreditNote(creditNoteUUID: string, payments: Payment[]): Promise<CreditNote> {
    loggerUseCases.info(`Paying credit note ${creditNoteUUID} (local)`);
    await distributionSettingFeature.getOrRaiseErrorIfNotActiveRoute();
    const existingCreditNote = await this.repository.findById(creditNoteUUID);
    if (!existingCreditNote) {
      throw new Error(`Credit note ${creditNoteUUID} not found`);
    }

    const creditNote = CreditNote.fromJSON<CreditNote>(existingCreditNote);

    if (creditNote.state !== "posted") {
      loggerUseCases.info(
        `Credit note ${creditNote.name} is not posted, posting before payment`,
      );
      creditNote.markAsPosted();
      await this.repository.save(creditNote);
      loggerUseCases.info(`Credit note ${creditNote.name} marked as posted`);
    }

    creditNote.payOrder(payments, 0);

    await this.repository.save(creditNote);
    await creditNote.publishAllDomainEventsSync();

    loggerUseCases.info(`Credit note ${creditNote.name} paid successfully (local)`);
    return creditNote;
  }

  async updateCreditNoteLines(
    creditNoteUUID: string,
    newLines: CreditNoteLine[],
  ): Promise<CreditNote> {
    loggerUseCases.info(`Updating lines for credit note ${creditNoteUUID}`);

    const existingCreditNote = await this.repository.findById(creditNoteUUID);
    if (!existingCreditNote) {
      throw new Error(`Credit note ${creditNoteUUID} not found`);
    }

    const creditNote = CreditNote.fromJSON<CreditNote>(existingCreditNote);
    creditNote.creditNoteLines = newLines;
    creditNote.computeAmounts();

    await this.repository.save(creditNote);
    loggerUseCases.info(`Credit note ${creditNote.name} lines updated`);
    return creditNote;
  }

  async pushCreditNoteToBackend(creditNote: CreditNote): Promise<CreditNote> {
    loggerUseCases.info(`Pushing credit note ${creditNote.uuid} to backend`);

    const existingRemote = await CreditNoteAdapter.findByUUID(creditNote.uuid);
    if (existingRemote) {
      loggerUseCases.info(
        `Credit note ${creditNote.uuid} already exists in backend as ${existingRemote.name}`,
      );
      creditNote.mergeWithRemote(existingRemote);
      await this.repository.save(creditNote);
      return creditNote;
    }

    if (!creditNote.originalOrderUUID) {
      throw new Error(`Credit note ${creditNote.uuid} has no originalOrderUUID`);
    }

    const saleOrder = await this.saleOrderRepository.findById(creditNote.originalOrderUUID);
    if (!saleOrder) {
      throw new Error(`Sale order ${creditNote.originalOrderUUID} not found`);
    }

    const created = await CreditNoteAdapter.createCreditNoteForSaleOrder(
      creditNote,
      saleOrder,
    );

    creditNote.mergeWithRemote(created);
    await this.repository.save(creditNote);

    loggerUseCases.info(
      `Credit note pushed to backend: ${creditNote.name} (remoteId: ${creditNote.remoteId})`,
    );
    return creditNote;
  }

  async postRemoteCreditNote(creditNote: CreditNote): Promise<CreditNote> {
    loggerUseCases.info(`Posting credit note ${creditNote.name} in backend (remote)`);

    const activeRoute = await this.settingsFetuare.getActiveRoute();
    if (!activeRoute) {
      throw new Error("No active route set in settings");
    }

    if (!creditNote.remoteId || creditNote.remoteId <= 0) {
      throw new Error(`Cannot post credit note without remoteId. Push to backend first.`);
    }

    creditNote.setRoute(activeRoute);

    const remoteData = await CreditNoteAdapter.refreshCreditNoteFromBackend(
      creditNote.remoteId,
    );
    if (remoteData && remoteData.state === "posted") {
      loggerUseCases.info(`Credit note ${creditNote.name} already posted in backend`);
      creditNote.mergeWithRemote(remoteData);
      await this.repository.save(creditNote);
      return creditNote;
    }

    await CreditNoteAdapter.postCreditNote(creditNote.remoteId, activeRoute, creditNote.uuid);

    const refreshed = await CreditNoteAdapter.refreshCreditNoteFromBackend(
      creditNote.remoteId,
    );
    if (refreshed) {
      creditNote.mergeWithRemote(refreshed);
    }

    await this.repository.save(creditNote);
    loggerUseCases.info(`Credit note ${creditNote.name} posted in backend successfully`);

    return creditNote;
  }

  async reconcileCreditNoteWithPayments(
    creditNote: CreditNote,
    payments: Payment[],
  ): Promise<void> {
    loggerUseCases.info(`Reconciling credit note ${creditNote.name} with payments`);

    const syncedPaymentIds = payments
      .map((p) => p.concretePayment?.remoteId)
      .filter((id): id is number => id != null && id > 0);

    if (!creditNote.remoteId) {
      throw new Error(`Credit note ${creditNote.uuid} has no remote ID`);
    }

    if (syncedPaymentIds.length === 0) {
      throw new Error(
        `Payments have no remote IDs to reconcile with credit note ${creditNote.uuid}`,
      );
    }

    await CreditNoteAdapter.reconcileCreditNoteAndPayments(
      creditNote.remoteId,
      syncedPaymentIds,
    );

    loggerUseCases.info(
      `Reconciled credit note ${creditNote.remoteId} with ${syncedPaymentIds.length} payments`,
    );
  }

  async mergeRemoteCreditNotes(
    remoteCreditNotes: RemoteEntityCollection<CreditNote>,
  ): Promise<void> {
    const localCreditNotes = await this.repository.findAll();
    const localMap = localCreditNotes.toMap((cn: CreditNote) => cn.remoteId);

    const [existing, missing] = remoteCreditNotes.partition((cn) =>
      localMap.has(cn.remoteId),
    );

    if (missing.isNotEmpty) {
      await this.repository.save(missing);
      loggerUseCases.info(`Saved ${missing.length} new credit notes from remote`);
    }

    for (const remoteCreditNote of existing) {
      const localCreditNote = localMap.get(remoteCreditNote.remoteId);
      if (!localCreditNote) continue;
      localCreditNote.mergeWithRemote(remoteCreditNote);
      await this.repository.save(localCreditNote);
    }

    if (existing.isNotEmpty) {
      loggerUseCases.info(`Merged ${existing.length} existing credit notes with remote data`);
    }
  }

  async getCreditNoteById(id: number | string): Promise<CreditNote | null> {
    loggerUseCases.info(`Getting credit note by ID: ${id}`);

    if (typeof id === "string") {
      return await this.repository.findById(id);
    }
    return await this.repository.findByRemoteId(id);
  }

  async getCreditNotesByCustomerId(
    customerId: number,
  ): Promise<RemoteEntityCollection<CreditNote>> {
    loggerUseCases.info(`Getting credit notes for customer ${customerId}`);
    const creditNotes = await this.repository.findByCustomerId(customerId);

    const sorted = creditNotes.toArray().sort((a: CreditNote, b: CreditNote) => {
      const dateA = new Date(a.scheduledDate || 0).getTime();
      const dateB = new Date(b.scheduledDate || 0).getTime();
      return dateB - dateA;
    });

    return new RemoteEntityCollection(sorted);
  }

  async getAllCreditNotes(): Promise<RemoteEntityCollection<CreditNote>> {
    loggerUseCases.info("Getting all credit notes");
    const creditNotes = await this.repository.findAll();

    const sorted = creditNotes.toArray().sort((a: CreditNote, b: CreditNote) => {
      const dateA = new Date(a.scheduledDate || 0).getTime();
      const dateB = new Date(b.scheduledDate || 0).getTime();
      return dateB - dateA;
    });

    return new RemoteEntityCollection(sorted);
  }

  async refreshCreditNoteFromBackend(id: number | string): Promise<CreditNote | null> {
    loggerUseCases.info(`Refreshing credit note ${id} from backend`);

    let localCreditNote: CreditNote | null;
    if (typeof id === "string") {
      localCreditNote = await this.repository.findById(id);
    } else {
      localCreditNote = await this.repository.findByRemoteId(id);
    }

    if (!localCreditNote) {
      loggerUseCases.warn(`Credit note ${id} not found locally`);
      return null;
    }

    try {
      let remoteData: CreditNote | null;
      if (typeof id === "string") {
        remoteData = await CreditNoteAdapter.findByUUID(id);
      } else {
        remoteData = await CreditNoteAdapter.refreshCreditNoteFromBackend(id);
      }

      if (!remoteData) {
        loggerUseCases.warn(`Credit note ${id} not found in backend`);
        return localCreditNote;
      }

      const creditNote = CreditNote.fromJSON<CreditNote>(localCreditNote);
      creditNote.mergeWithRemote(remoteData);

      await this.repository.save(creditNote);
      loggerUseCases.info(`Credit note ${id} refreshed from backend`);
      return creditNote;
    } catch (error) {
      loggerUseCases.error(`Failed to refresh credit note ${id}: ${error}`);
      return localCreditNote;
    }
  }

  async fetchCreditNotesByCustomer(
    customerIds: number[],
  ): Promise<RemoteEntityCollection<CreditNote>> {
    loggerUseCases.info(`Fetching credit notes for customers ${customerIds}`);
    const creditNotes = await CreditNoteAdapter.fetchCreditNotesByCustomer(customerIds);

    if (creditNotes.isEmpty) {
      return creditNotes;
    }

    await this.mergeRemoteCreditNotes(creditNotes);
    loggerUseCases.info(`Fetched ${creditNotes.length} credit notes`);
    return creditNotes;
  }

  async fetchMoreCreditNotesByCustomer(
    customerIds: number[],
    limit: number = 20,
  ): Promise<RemoteEntityCollection<CreditNote>> {
    loggerUseCases.info(`Fetching ${limit} more credit notes for customers ${customerIds}`);

    const localCreditNotes = await this.repository.findByCriteria([
      {
        field: "customerId",
        operator: "in",
        value: customerIds,
      },
    ]);

    const existingRemoteIds = localCreditNotes
      .mapToArray((cn: CreditNote) => cn.remoteId!)
      .filter((id: number) => id != null);

    loggerUseCases.info(
      `Found ${existingRemoteIds.length} existing credit notes, excluding them from fetch`,
    );

    const creditNotes = await CreditNoteAdapter.fetchMoreCreditNotesByCustomer(
      customerIds,
      limit,
      existingRemoteIds,
    );

    if (creditNotes.isEmpty) {
      loggerUseCases.info(`No more credit notes found for customers ${customerIds}`);
      return creditNotes;
    }

    await this.mergeRemoteCreditNotes(creditNotes);
    loggerUseCases.info(`Fetched ${creditNotes.length} more credit notes`);
    return creditNotes;
  }

  async fetchCreditNotesByRouteId(
    routeId: number,
  ): Promise<RemoteEntityCollection<CreditNote>> {
    loggerUseCases.info(`Fetching credit notes for route ${routeId}`);
    const creditNotes = await CreditNoteAdapter.fetchCreditNotesByRouteId(routeId);

    if (creditNotes.isEmpty) {
      return creditNotes;
    }

    await this.mergeRemoteCreditNotes(creditNotes);
    loggerUseCases.info(`Fetched ${creditNotes.length} credit notes for route`);
    return creditNotes;
  }

  async fetchAndLinkPayment(
    paymentUUID: string,
    remoteId: number,
  ): Promise<CreditNote | null> {
    loggerUseCases.info(
      `Fetching and linking payment ${paymentUUID} to credit note by remoteId ${remoteId}`,
    );

    let creditNote = await this.repository.findByRemoteId(remoteId);
    const remoteCreditNote = await CreditNoteAdapter.refreshCreditNoteFromBackend(remoteId);

    if (!remoteCreditNote) {
      loggerUseCases.warn(`CreditNote ${remoteId} not found in backend`);
      return null;
    }

    if (creditNote) {
      creditNote.mergeWithRemote(remoteCreditNote);
    } else {
      creditNote = remoteCreditNote;
    }

    creditNote.addPaymentId(paymentUUID);
    await this.repository.save(creditNote);
    loggerUseCases.info(`Payment ${paymentUUID} linked to credit note ${creditNote.uuid}`);

    return creditNote;
  }
}

export const creditNoteService = new CreditNoteServiceImpl();
