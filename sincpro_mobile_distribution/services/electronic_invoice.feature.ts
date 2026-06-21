import { ECommonRepository, repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { DistributorAdapter } from "@sincpro/mobile-distribution/adapters/odoo/distributor.adapter";
import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import { EDocumentType } from "@sincpro/mobile-distribution/domain/electronic_invoice";
import { generateNumericKey } from "@sincpro/mobile-distribution/domain/electronic_invoice/numeric_key";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { EDistributionSetting } from "@sincpro/mobile-distribution/domain/settings";

import { distributionSettingFeature } from "./settings.feature";

type PayableDocument = SaleOrder | Invoice | CreditNote;

class ElectronicInvoiceFeatureImpl {
  private get settingRepository() {
    return repos.get(ECommonRepository.SETTINGS);
  }
  private readonly settingFeature = distributionSettingFeature;

  private async fetchRemoteConsecutive(documentType: EDocumentType) {
    const vehicleId = await this.settingFeature.getAssignedVehicleId();

    if (!vehicleId) {
      throw new Error("No vehicle assigned to the user");
    }
    const full = await DistributorAdapter.getCurrentConsecutive(vehicleId, documentType);
    if (!full) throw new Error("No consecutive number found");
    return this.parseConsecutive(full);
  }

  private parseConsecutive(full: string) {
    const lastTen = full.slice(-10);
    const integerValue = parseInt(lastTen, 10);
    const template = full.slice(0, -10);
    if (isNaN(integerValue)) {
      loggerUseCases.warn(`Invalid consecutive integer part: ${lastTen}`);
      throw new Error("Invalid consecutive number");
    }
    return { integerValue, template };
  }

  async loadInvoiceConsecutive() {
    const { integerValue, template } = await this.fetchRemoteConsecutive(
      EDocumentType.FACTURA_ELECTRONICA,
    );
    await this.settingRepository.saveOneSetting(
      EDistributionSetting.INVOICE_CURRENT_CONSECUTIVE,
      integerValue,
    );
    await this.settingRepository.saveOneSetting(
      EDistributionSetting.INVOICE_TEMPLATE_CONSECUTIVE,
      template,
    );
    return { consecutiveNumber: integerValue, template };
  }

  async incrementInvoiceConsecutive() {
    return this.increment(
      EDistributionSetting.INVOICE_CURRENT_CONSECUTIVE,
      EDistributionSetting.INVOICE_TEMPLATE_CONSECUTIVE,
    );
  }

  async loadTicketConsecutive() {
    const { integerValue, template } = await this.fetchRemoteConsecutive(
      EDocumentType.TIQUETE_ELECTRONICO,
    );
    await this.settingRepository.saveOneSetting(
      EDistributionSetting.TICKET_CURRENT_CONSECUTIVE,
      integerValue,
    );
    await this.settingRepository.saveOneSetting(
      EDistributionSetting.TICKET_TEMPLATE_CONSECUTIVE,
      template,
    );
    return { consecutiveNumber: integerValue, template };
  }

  async incrementTicketConsecutive() {
    return this.increment(
      EDistributionSetting.TICKET_CURRENT_CONSECUTIVE,
      EDistributionSetting.TICKET_TEMPLATE_CONSECUTIVE,
    );
  }

  async syncInvoiceConsecutive(): Promise<number> {
    return this.syncSpecific(
      EDocumentType.FACTURA_ELECTRONICA,
      EDistributionSetting.INVOICE_CURRENT_CONSECUTIVE,
    );
  }

  async syncTicketConsecutive(): Promise<number> {
    return this.syncSpecific(
      EDocumentType.TIQUETE_ELECTRONICO,
      EDistributionSetting.TICKET_CURRENT_CONSECUTIVE,
    );
  }

  private async syncSpecific(
    documentType: EDocumentType,
    currentKey: EDistributionSetting,
  ): Promise<number> {
    const { integerValue: remoteInt } = await this.fetchRemoteConsecutive(documentType);

    const localInt = (await this.settingRepository.getSettingByName(currentKey)) as
      | number
      | null;

    if (localInt == null) {
      await this.settingRepository.saveOneSetting(currentKey, remoteInt);
      return remoteInt;
    }

    if (localInt === remoteInt) {
      return localInt;
    }

    if (localInt > remoteInt) {
      const vehicleId = await this.settingFeature.getAssignedVehicleId();

      if (vehicleId) {
        await DistributorAdapter.updateConsecutiveByDocumentType(
          vehicleId,
          documentType,
          localInt,
        );
        return localInt;
      }
      return localInt;
    }

    await this.settingRepository.saveOneSetting(currentKey, remoteInt);
    return remoteInt;
  }

  private async increment(
    currentKey: EDistributionSetting,
    templateKey: EDistributionSetting,
  ) {
    const current = (await this.settingRepository.getSettingByName(currentKey)) as
      | number
      | null;
    const template = (await this.settingRepository.getSettingByName(templateKey)) as
      | string
      | null;
    if (current == null || !template) return null;
    const next = current + 1;
    await this.settingRepository.saveOneSetting(currentKey, next);
    return `${template}${String(next).padStart(10, "0")}`;
  }

  async addElectronicInvoiceToOrder<T extends PayableDocument>(
    order: T,
    documentType: EDocumentType,
  ): Promise<T> {
    if (order.consecutiveNumber) return order;

    let consecutiveNumber: string | null = null;

    switch (documentType) {
      case EDocumentType.FACTURA_ELECTRONICA:
        consecutiveNumber = await this.incrementInvoiceConsecutive();
        if (!consecutiveNumber) {
          await this.loadInvoiceConsecutive();
          consecutiveNumber = await this.incrementInvoiceConsecutive();
        }
        break;

      case EDocumentType.TIQUETE_ELECTRONICO:
        consecutiveNumber = await this.incrementTicketConsecutive();
        if (!consecutiveNumber) {
          await this.loadTicketConsecutive();
          consecutiveNumber = await this.incrementTicketConsecutive();
        }
        break;

      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }

    if (consecutiveNumber) {
      (order as any).consecutiveNumber = consecutiveNumber;
      loggerUseCases.info(
        `Assigned consecutive number ${consecutiveNumber} to order ${order.uuid}`,
      );
      try {
        const issueDate = this.getDocumentDate(order);
        (order as any).numericKey = generateNumericKey(issueDate, consecutiveNumber);
        loggerUseCases.info(
          `Generated numeric key ${order.numericKey} for order ${order.uuid}`,
        );
      } catch (err) {
        loggerUseCases.warn(
          `No se pudo generar clave numérica para orden ${order.uuid}: ${String(err)}`,
        );
      }
    }
    return order;
  }

  private getDocumentDate(order: PayableDocument): Date | string {
    if (order instanceof Invoice) {
      return order.invoiceDate || new Date();
    }
    return order.doneDate || new Date();
  }
}

export const electronicInvoiceFeature = new ElectronicInvoiceFeatureImpl();
