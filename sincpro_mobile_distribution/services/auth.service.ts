import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { DistributorAdapter } from "@sincpro/mobile-distribution/adapters/odoo/distributor.adapter";

import { distributionSettingFeature } from "./settings.feature";

class AuthService {
  private readonly settingFeature = distributionSettingFeature;

  async loadDistributorData(profileData: {
    uid: number;
    user: string;
    password: string;
    db: string;
    name: string;
    email: string;
    companyId: number;
    companyIds: number[];
  }): Promise<void> {
    loggerUseCases.info("Loading distributor data", { uid: profileData.uid });

    const distributor = await DistributorAdapter.getMyAssignments();

    if (distributor) {
      await this.settingFeature.setAssignedVehicle(distributor.id, distributor.name);
      loggerUseCases.info("Distributor data loaded and saved", {
        distributor: distributor.name,
        vehicleId: distributor.id,
      });
    } else {
      loggerUseCases.warn("No distributor/vehicle assigned to user");
    }
  }
}

export const authService = new AuthService();
