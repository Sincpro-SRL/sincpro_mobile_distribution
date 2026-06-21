import { EDocumentType } from "@sincpro/mobile-distribution/domain/electronic_invoice";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

interface IDistributor {
  id: number;
  name: string;
  distributor_type: string;
  license_plate: string;
  capacity: number;
  capacity_uom_id: boolean;
}

interface DistributorResponse {
  length: number;
  records: IDistributor[];
}

interface IConsecutiveResponse {
  data: {
    company_code: string;
    cash_register_code: string;
    invoice_type: string;
    consecutive_number: string;
    full_consecutive: string;
  };
  helper: {
    company_code: string;
    cash_register_code: string;
    invoice_type: string;
    consecutive_number: string;
    full_consecutive: string;
  };
}

export const DistributorAdapter = {
  async getMyAssignments(): Promise<IDistributor> {
    const odooClient = getOdooClient();
    const response: DistributorResponse = await odooClient.callModel<any>(
      "distribution.distributor",
      "api_my_distributors",
      [],
      {},
    );

    if (Array.isArray(response?.records)) {
      return response.records[0];
    }
    return {} as IDistributor;
  },

  async sendLocation(latitude: number, longitude: number): Promise<void> {
    const odooClient = getOdooClient();
    await odooClient.callModel<any>(
      "distribution.distributor",
      "api_sync_location",
      [latitude, longitude],
      {},
    );
  },

  async getCurrentConsecutive(
    distributorId: number,
    documentType: EDocumentType,
  ): Promise<string> {
    const odooClient = getOdooClient();
    const response = await odooClient.callModel<IConsecutiveResponse>(
      "distribution.distributor",
      "api_get_consecutive_by_document_type_v2",
      [distributorId, documentType],
      {},
    );
    return response.data.full_consecutive;
  },

  /**
   * Update the consecutive number for a specific document type.
   */
  async updateConsecutiveByDocumentType(
    distributorId: number,
    documentType: EDocumentType,
    consecutiveNumber: number,
  ): Promise<boolean> {
    const odooClient = getOdooClient();
    try {
      await odooClient.callModel<any>(
        "distribution.distributor",
        "set_consecutive_by_document_type_v2",
        [distributorId, documentType, consecutiveNumber],
        {},
      );
      return true;
    } catch {
      return false;
    }
  },
};
