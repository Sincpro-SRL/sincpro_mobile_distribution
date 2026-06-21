import { GeoAdapter } from "@sincpro/mobile/adapters/Geo.adapter";
import { Coordinates } from "@sincpro/mobile/domain/connectivity";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { DistributorAdapter } from "@sincpro/mobile-distribution/adapters/odoo/distributor.adapter";

class GeoService {
  async ensurePermission(): Promise<boolean> {
    loggerUseCases.info("Ensure location permission");
    const granted = await GeoAdapter.requestPermission();
    return granted;
  }

  async checkPermission(): Promise<boolean> {
    loggerUseCases.info("Check location permission without requesting");
    const granted = await GeoAdapter.hasPermission();
    return granted;
  }

  async getLocation(): Promise<Coordinates> {
    loggerUseCases.info("Get location");
    await this.ensurePermission();
    return await GeoAdapter.getCurrentLocation();
  }

  async sendLocation(): Promise<void> {
    loggerUseCases.info("Send current location to server");
    const coords = await GeoAdapter.getCurrentLocation();
    if (!coords) {
      loggerUseCases.error("Failed to get current location");
    }
    await DistributorAdapter.sendLocation(coords.latitude, coords.longitude);
  }

  async subscribeToLocationUpdates(onUpdate: (coords: Coordinates) => void) {
    await this.ensurePermission();
    return await GeoAdapter.watchLocation(onUpdate);
  }
}

export const geoService = new GeoService();
