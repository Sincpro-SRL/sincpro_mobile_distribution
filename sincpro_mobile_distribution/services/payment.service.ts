import { EntityCollection, RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { EventBus } from "@sincpro/mobile/infrastructure/workers";
import { CreditNoteAdapter } from "@sincpro/mobile-distribution/adapters/odoo/credit_note.adapter";
import {
  EInvoiceConditionPayment,
  InvoiceAdapter,
} from "@sincpro/mobile-distribution/adapters/odoo/invoice.adapter";
import { PaymentAdapter } from "@sincpro/mobile-distribution/adapters/odoo/payment.adapter";
import {
  CashClosureReport,
  EPaymentState,
  EPaymentTargetType,
  Payment,
  PaymentCredit,
  PaymentOdoo,
} from "@sincpro/mobile-distribution/domain/payment";
import {
  PaymentLinkToCreditNoteEvent,
  PaymentLinkToInvoiceEvent,
  PaymentReconciledEvent,
} from "@sincpro/mobile-distribution/domain/payment/events";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";
import { distributionSettingFeature } from "@sincpro/mobile-distribution/services/settings.feature";

import { CustomersFetchedEvent } from "../domain/customer";

class PaymentServiceImpl {
  private get repository() {
    return repos.get(EDistributionRepository.PAYMENT);
  }
  private get regularPaymentRepository() {
    return repos.get(EDistributionRepository.PAYMENT_ODOO);
  }
  private get creditPaymentRepository() {
    return repos.get(EDistributionRepository.PAYMENT_CREDIT);
  }
  private get invoiceRepository() {
    return repos.get(EDistributionRepository.INVOICE);
  }
  private get creditNoteRepository() {
    return repos.get(EDistributionRepository.CREDIT_NOTE);
  }

  private distributionSettings = distributionSettingFeature;

  async getPaymentsByMethod(paymentMethod: string): Promise<EntityCollection<Payment>> {
    loggerUseCases.info(`Getting payments by method: ${paymentMethod}`);

    const allPayments = await this.repository.findAll();
    const filtered = allPayments.filter(
      (p: Payment) => p.paymentMethod?.name === paymentMethod,
    );

    loggerUseCases.info(`Found ${filtered.length} payments for method ${paymentMethod}`);
    return new EntityCollection(filtered.toArray());
  }

  async getPaymentById(uuid: string): Promise<Payment | null> {
    const payment = await this.repository.findById(uuid);
    if (payment) {
      loggerUseCases.info(`Payment ${uuid} found`);
      return payment;
    }
    return null;
  }

  async getPaymentByIds(uuids: string[]): Promise<EntityCollection<Payment>> {
    loggerUseCases.info(`Getting payments by IDs: ${uuids.length}`);
    const payments = await this.repository.findByIds(uuids);
    loggerUseCases.info(`Found ${payments.length} payments`);
    return payments;
  }

  async getPaymentForActiveRoute(): Promise<EntityCollection<Payment>> {
    const activeRouteId = await this.distributionSettings.getActiveRoute();
    loggerUseCases.info(`Getting payments for active route: ${activeRouteId}`);
    if (!activeRouteId) {
      return new EntityCollection<Payment>([]);
    }
    return await this.repository.findByCriteria([
      {
        field: "routeId",
        operator: "=",
        value: activeRouteId,
      },
    ]);
  }

  async getAllPayments(): Promise<EntityCollection<Payment>> {
    loggerUseCases.info("Getting all payments");
    const payments = await this.repository.findAll();
    loggerUseCases.info(`Found ${payments.length} payments`);
    return payments;
  }

  async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    loggerUseCases.info("Creating new payment");
    const payment = Payment.obj<Payment>(paymentData);
    await this.repository.save(payment);
    loggerUseCases.info(`Payment ${payment.uuid} created successfully`);
    return payment;
  }

  async findOrCreatePayment(paymentData: Partial<Payment>): Promise<Payment> {
    let payment = await this.getPaymentById(paymentData.uuid!);
    if (!payment) {
      loggerUseCases.info(`Payment ${paymentData.uuid} not found, creating a new one.`);
      payment = await this.createPayment(paymentData);
    }
    return payment;
  }

  async pushInvoicePaymentToBackend(payment: Payment): Promise<Payment> {
    loggerUseCases.info(`Pushing invoice payment ${payment.uuid} to backend`);

    if (!payment.targetUUID) {
      throw new Error("Payment TargetUUID (invoiceId) is required");
    }

    const invoice = await this.invoiceRepository.findById(payment.targetUUID);
    if (invoice && invoice.remoteId && !invoice.externalUuidSynced) {
      loggerUseCases.info(`Syncing invoice UUID ${invoice.uuid} to Odoo`);
      await InvoiceAdapter.syncExternalUUID(invoice.remoteId, invoice.uuid);
      invoice.externalUuidSynced = true;
      await this.invoiceRepository.save(invoice);
    }

    const odooPayment = PaymentOdoo.fromPayment(payment);
    const pushedPayment = await PaymentAdapter.createPayment(odooPayment);
    await this.regularPaymentRepository.save(pushedPayment);
    const updatedPayment = Payment.fromOdooPayment(pushedPayment);
    await this.repository.save(updatedPayment);
    loggerUseCases.info(
      `Invoice payment ${updatedPayment.uuid} - ${updatedPayment.name} pushed successfully`,
    );
    await InvoiceAdapter.defineConditionPayment(
      invoice!.remoteId!,
      EInvoiceConditionPayment.CASH,
    );
    return payment;
  }

  async pushInvoicePaymentCreditToBackend(payment: Payment): Promise<Payment> {
    loggerUseCases.info(`Pushing invoice credit payment ${payment.uuid} to backend`);
    if (!payment.targetUUID) {
      throw new Error("Payment targetUUID is required");
    }

    if (!payment.paidEntity || !payment.paidEntity.remoteId) {
      throw new Error("Payment paid entity is not synced");
    }

    if (!payment.isCreditPayment || !payment.creditApplicationId) {
      throw new Error("Payment is not a credit payment");
    }

    const creditPayment = PaymentCredit.fromPayment(payment);
    await InvoiceAdapter.postInvoiceAsCreditPayment(
      payment.paidEntity.remoteId!,
      creditPayment,
    );
    creditPayment.remoteId = payment.targetRemoteId;
    creditPayment.remoteRef = `account.move,${payment.targetRemoteId}`;

    await this.creditPaymentRepository.save(creditPayment);
    payment.customer?.refreshCustomer();
    return payment;
  }

  async pushCreditNotePaymentToBackend(payment: Payment): Promise<Payment> {
    loggerUseCases.info(`Pushing credit note payment ${payment.uuid} to backend`);

    if (!payment.targetUUID) {
      throw new Error("Payment targetUUID is required");
    }

    const creditNote = await this.creditNoteRepository.findById(payment.targetUUID);
    if (creditNote && creditNote.remoteId && !creditNote.externalUuidSynced) {
      loggerUseCases.info(`Syncing credit note UUID ${creditNote.uuid} to Odoo`);
      await CreditNoteAdapter.syncExternalUUID(creditNote.remoteId, creditNote.uuid);
      creditNote.externalUuidSynced = true;
      await this.creditNoteRepository.save(creditNote);
    }

    const odooPayment = PaymentOdoo.fromPayment(payment);
    const pushedPayment = await PaymentAdapter.createPayment(odooPayment);
    await this.regularPaymentRepository.save(pushedPayment);

    loggerUseCases.info(`Credit note payment ${payment.uuid} pushed successfully`);
    return payment;
  }

  async pullOdooPaymentsByRouteRemoteID(
    routeId: number,
  ): Promise<[RemoteEntityCollection<PaymentOdoo>, RemoteEntityCollection<PaymentOdoo>]> {
    loggerUseCases.info(`Pulling Odoo payments for route ID ${routeId}`);
    const remotePayments = await PaymentAdapter.fetchPaymentsByRoute(routeId);
    const localPayments = await this.repository.findByIds(
      remotePayments.mapToArray((p) => p.uuid),
    );
    const mapLocalByUUID = localPayments.toMapByUuid();
    return remotePayments.partition((remotePayment) =>
      mapLocalByUUID.has(remotePayment.uuid),
    );
  }

  async pullAndMergeOdooPaymentsByRouteID(
    routeId: number,
  ): Promise<EntityCollection<Payment>> {
    const [existingPayments, newPayments] =
      await this.pullOdooPaymentsByRouteRemoteID(routeId);

    loggerUseCases.info(
      `New payments: ${newPayments.length}, Existing payments: ${existingPayments.length}`,
    );

    const proceedPayments = new EntityCollection<Payment>([]);

    for (const newOdooPayment of newPayments) {
      const payment = Payment.fromOdooPayment(newOdooPayment);
      await this.repository.save(payment);
      await this.regularPaymentRepository.save(newOdooPayment);
      proceedPayments.add(payment);
    }

    for (const existingOdooPayment of existingPayments) {
      const localRegularPayment = await this.regularPaymentRepository.findById(
        existingOdooPayment.uuid,
      );

      if (!localRegularPayment) {
        loggerUseCases.warn(
          `Local payment not found for UUID ${existingOdooPayment.uuid}, treating as new`,
        );
        const payment = Payment.fromOdooPayment(existingOdooPayment);
        await this.repository.save(payment);
        await this.regularPaymentRepository.save(existingOdooPayment);
        proceedPayments.add(payment);
        continue;
      }

      localRegularPayment.mergeWithRemote(existingOdooPayment);
      await this.regularPaymentRepository.save(localRegularPayment);
      const payment = Payment.fromOdooPayment(localRegularPayment);
      await this.repository.save(payment);
      proceedPayments.add(payment);
    }

    if (proceedPayments.isNotEmpty) {
      await proceedPayments.publishDomainEvent<PaymentReconciledEvent>(
        PaymentReconciledEvent,
        { paymentUUIDs: proceedPayments.mapToArray((p) => p.uuid) },
      );
    }

    return proceedPayments;
  }

  async pullCreditPayments(
    routeId: number,
  ): Promise<[EntityCollection<PaymentCredit>, RemoteEntityCollection<PaymentCredit>]> {
    loggerUseCases.info(`Pulling credit payments for route ID ${routeId}`);
    const remotePaymentCredits = await InvoiceAdapter.fetchInvoiceAsCreditPayment(routeId);
    const localPaymentCredits = await this.creditPaymentRepository.findAll();
    const mapLocalByUUID = localPaymentCredits.toMapByUuid();
    return remotePaymentCredits.partition((remoteCreditPayment) =>
      mapLocalByUUID.has(remoteCreditPayment.uuid),
    );
  }

  async pullAndMergeCreditPaymentsByRouteID(
    routeId: number,
  ): Promise<EntityCollection<Payment>> {
    const [existingCredits, newCredits] = await this.pullCreditPayments(routeId);

    loggerUseCases.info(
      `New credit payments: ${newCredits.length}, Existing credit payments: ${existingCredits.length}`,
    );

    const proceedCredits = new EntityCollection<Payment>([]);

    for (const newCreditPayment of newCredits) {
      const payment = Payment.fromPaymentCredit(newCreditPayment);
      await this.creditPaymentRepository.save(newCreditPayment);
      await this.repository.save(payment);
      proceedCredits.add(payment);
    }

    for (const existingCreditPayment of existingCredits) {
      const localPaymentCredit = await this.creditPaymentRepository.findById(
        existingCreditPayment.uuid,
      );

      if (!localPaymentCredit) {
        loggerUseCases.warn(
          `Local credit payment not found for UUID ${existingCreditPayment.uuid}, treating as new`,
        );
        const payment = Payment.fromPaymentCredit(existingCreditPayment);
        await this.creditPaymentRepository.save(existingCreditPayment);
        await this.repository.save(payment);
        proceedCredits.add(payment);
        continue;
      }

      localPaymentCredit.mergeWithRemote(existingCreditPayment);
      await this.creditPaymentRepository.save(localPaymentCredit);
      const payment = Payment.fromPaymentCredit(localPaymentCredit);
      await this.repository.save(payment);
      proceedCredits.add(payment);
    }

    if (proceedCredits.isNotEmpty) {
      await proceedCredits.publishDomainEvent<PaymentReconciledEvent>(
        PaymentReconciledEvent,
        { paymentUUIDs: proceedCredits.mapToArray((p) => p.uuid) },
      );
    }

    return proceedCredits;
  }

  async linkPaymentsToEntity(payments: EntityCollection<Payment>) {
    for (const payment of payments) {
      if (!payment.targetUUID || !payment.targetType) {
        continue;
      }

      if (payment.paidEntity) {
        loggerUseCases.info(`Payment ${payment.uuid} already has paidEntity, skipping`);
        continue;
      }

      switch (payment.targetType) {
        case EPaymentTargetType.INVOICE:
          loggerUseCases.info(
            `Requesting link for payment ${payment.uuid} to invoice ${payment.targetUUID}`,
          );
          await payment.publishDomainEvent<PaymentLinkToInvoiceEvent>(
            PaymentLinkToInvoiceEvent,
            { record: payment },
          );
          break;

        case EPaymentTargetType.CREDIT_NOTE:
          loggerUseCases.info(
            `Requesting link for payment ${payment.uuid} to credit note ${payment.targetUUID}`,
          );
          await payment.publishDomainEvent<PaymentLinkToCreditNoteEvent>(
            PaymentLinkToCreditNoteEvent,
            { record: payment },
          );
          break;
      }

      await this.repository.save(payment);
    }
  }

  async generateCashClosureReport(
    startDate?: string,
    endDate?: string,
  ): Promise<CashClosureReport> {
    loggerUseCases.info("Generating cash closure report");

    const allPayments = await this.getPaymentForActiveRoute();
    const postedPayments = allPayments.filter((p) => p.state === EPaymentState.POSTED);

    const activeRouteId = await this.distributionSettings.getActiveRoute();

    loggerUseCases.info(
      `Generated cash closure report with ${postedPayments.length} payments`,
    );

    return CashClosureReport.fromPayments(
      postedPayments.toArray(),
      startDate,
      endDate,
      activeRouteId ?? undefined,
    );
  }

  async refreshPaymentFromBackend(id: number | string): Promise<Payment | null> {
    loggerUseCases.info(`Refreshing payment ${id} from backend`);

    let localPayment: Payment | null;
    if (typeof id === "string") {
      localPayment = await this.repository.findById(id);
    } else {
      const allPayments = await this.repository.findAll();
      localPayment =
        allPayments.find((p: Payment) => p.concretePayment?.remoteId === id) ?? null;
    }

    if (!localPayment) {
      loggerUseCases.warn(`Payment ${id} not found locally`);
      return null;
    }

    try {
      const identifier = localPayment.concretePayment?.remoteId ?? localPayment.uuid;
      const remotePayment = await PaymentAdapter.fetchSinglePayment(identifier);

      if (!remotePayment) {
        loggerUseCases.warn(`Payment ${id} not found in backend`);
        return localPayment;
      }

      if (localPayment.concretePayment instanceof PaymentOdoo) {
        localPayment.concretePayment.mergeWithRemote(remotePayment);
      }

      await this.repository.save(localPayment);
      loggerUseCases.info(`Payment ${id} refreshed from backend`);
      return localPayment;
    } catch (error) {
      loggerUseCases.error(`Failed to refresh payment ${id}: ${error}`);
      return localPayment;
    }
  }

  async payPenalization(payment: Payment): Promise<void> {
    if (!payment.targetRemoteId) {
      throw new Error("Payment targetRemoteId is required");
    }

    if (!payment.paymentMethod?.id) {
      throw new Error("Payment method is required");
    }

    payment.targetType = EPaymentTargetType.INVOICE;
    payment.setRoute(await this.distributionSettings.getOrRaiseErrorIfNotActiveRoute());
    payment.setCustomer(payment.paidEntity!.customerId!);

    loggerUseCases.info(
      `Processing penalization payment for invoice ${payment.targetRemoteId!}`,
    );

    const invoice = await this.invoiceRepository.findById(payment.targetUUID!);
    if (!invoice) {
      throw new Error(`Invoice ${payment.targetUUID} not found`);
    }

    const createResult = await InvoiceAdapter.createPenalization([payment.targetRemoteId]);
    const penalizationIds = createResult[0].penalization_ids;

    const penalizedPayments: PaymentOdoo[] = [];
    for (const penalizationId of penalizationIds) {
      const odooPayment = await PaymentAdapter.fetchSinglePayment(penalizationId);
      if (odooPayment) {
        penalizedPayments.push(odooPayment);
      }
    }
    loggerUseCases.info(`Fetched ${penalizedPayments.length} penalization payments`);

    for (const odooPayment of penalizedPayments) {
      odooPayment.targetUUID = payment.targetUUID;
      odooPayment.targetRemoteId = payment.targetRemoteId;
      odooPayment.targetType = payment.targetType;
      odooPayment.paymentMethod = payment.paymentMethod;

      await PaymentAdapter.updatePenalizationMetadata(odooPayment);
    }

    loggerUseCases.info(
      `Penalization payments prepared for invoice ${payment.targetRemoteId}`,
    );

    await InvoiceAdapter.payPenalization(payment.targetRemoteId, invoice.amountTotal);

    for (const odooPayment of penalizedPayments) {
      await this.regularPaymentRepository.save(odooPayment);
      const savedPayment = Payment.fromOdooPayment(odooPayment);
      await this.repository.save(savedPayment);
    }
    loggerUseCases.info(`Penalization paid for invoice ${payment.targetRemoteId}`);
    await EventBus.publish(
      CustomersFetchedEvent.create({ customerIds: [payment.customerId!] }),
    );
  }
}

export const paymentService = new PaymentServiceImpl();
