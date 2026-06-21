import { ECommonRepository, repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { EventBus } from "@sincpro/mobile/infrastructure/workers";
import { DistributionSettingsAdapter } from "@sincpro/mobile-distribution/adapters/odoo/settings.adapter";
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  EDistributionSetting,
  IDistributionSetting,
  SettingsFetchedEvent,
} from "@sincpro/mobile-distribution/domain/settings";

import { ERouteStatusType } from "../domain/route";

class DistributionSettingFeature {
  private get settingRepository() {
    return repos.get(ECommonRepository.SETTINGS);
  }

  async fetchRemoteSettings(): Promise<IDistributionSetting | null> {
    loggerUseCases.info("Remote fetch application settings");
    const settings = await DistributionSettingsAdapter.getSettings();
    if (settings) {
      await this.settingRepository.saveOneSetting(
        EDistributionSetting.PAYMENT_METHODS,
        settings.paymentMethods,
      );
      await this.settingRepository.saveOneSetting(
        EDistributionSetting.INVOICE_JOURNAL,
        settings.invoiceJournal,
      );
      await this.settingRepository.saveOneSetting(
        EDistributionSetting.COMPANIES,
        settings.companies,
      );
      await this.settingRepository.saveOneSetting(
        EDistributionSetting.PRODUCT_CATEGORIES,
        settings.productCategories,
      );
      await this.settingRepository.saveOneSetting(
        EDistributionSetting.TIMEZONE,
        DEFAULT_TIMEZONE,
      );
      await this.settingRepository.saveOneSetting(
        EDistributionSetting.LOCALE,
        DEFAULT_LOCALE,
      );
    }

    await EventBus.publish(SettingsFetchedEvent.create());
    return settings || null;
  }

  async getSetting(name: EDistributionSetting | string): Promise<any | null> {
    loggerUseCases.debug("Get setting by name:", name);
    const setting = await this.settingRepository.getSettingByName(name);
    if (setting === null) {
      loggerUseCases.warn(`Setting not found: ${name}`);
      return null;
    }
    return setting;
  }

  async setSetting(name: EDistributionSetting | string, value: string): Promise<void> {
    loggerUseCases.info(`Update setting by {${name}: ${value}`, name);
    await this.settingRepository.saveOneSetting(name, value);
  }

  async getActiveRoute(): Promise<number | null> {
    const routeId = await this.getSetting(EDistributionSetting.ACTIVE_ROUTE);
    return routeId ? Number(routeId) : null;
  }

  async getOrRaiseErrorIfNotActiveRoute(): Promise<number> {
    const routeId = await this.getActiveRoute();
    if (!routeId) {
      throw new Error("No active route set.");
    }
    const routeState = await this.getSetting(EDistributionSetting.ACTIVE_ROUTE_STATE);

    if ([ERouteStatusType.DISTRIBUTED, ERouteStatusType.DONE].includes(routeState)) {
      throw new Error("The active route is already distributed.");
    }

    return routeId;
  }

  async getAssignedVehicleId(): Promise<number | null> {
    const vehicleId = await this.getSetting(EDistributionSetting.ASSIGNED_VEHICLE_ID);
    return vehicleId ? Number(vehicleId) : null;
  }

  async getAssignedVehicleName(): Promise<string | null> {
    const vehicleName = await this.getSetting(EDistributionSetting.ASSIGNED_VEHICLE_NAME);
    return vehicleName ? String(vehicleName) : null;
  }

  async setAssignedVehicle(vehicleId: number, vehicleName: string): Promise<void> {
    loggerUseCases.info("Setting assigned vehicle", { vehicleId, vehicleName });
    await this.settingRepository.saveOneSetting(
      EDistributionSetting.ASSIGNED_VEHICLE_ID,
      vehicleId,
    );
    await this.settingRepository.saveOneSetting(
      EDistributionSetting.ASSIGNED_VEHICLE_NAME,
      vehicleName,
    );
  }

  async clearAssignedVehicle(): Promise<void> {
    loggerUseCases.info("Clearing assigned vehicle");
    await this.settingRepository.saveOneSetting(
      EDistributionSetting.ASSIGNED_VEHICLE_ID,
      null,
    );
    await this.settingRepository.saveOneSetting(
      EDistributionSetting.ASSIGNED_VEHICLE_NAME,
      null,
    );
  }
}

export const distributionSettingFeature = new DistributionSettingFeature();
