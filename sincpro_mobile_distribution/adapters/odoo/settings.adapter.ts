import { IDistributionSetting } from "@sincpro/mobile-distribution/domain/settings";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

const SETTINGS_SPEC_QUERY = {
  id: {},
  name: {},
  distribution_payment_method_ids: {
    fields: {
      id: {},
      name: {},
      code: {},
      inbound_payment_method_line_ids: {
        fields: {
          id: {},
          name: {},
          payment_type: {},
          code: {},
        },
      },
      outbound_payment_method_line_ids: {
        fields: {
          id: {},
          name: {},
          payment_type: {},
          code: {},
        },
      },
    },
  },
  distribution_invoice_journal_id: {
    fields: {
      id: {},
      name: {},
      code: {},
    },
  },
  company_ids: {},
  allowed_product_category_ids: {},
};

class DistributionSettingsAdapterImpl {
  async getSettings(): Promise<IDistributionSetting | undefined> {
    const odooClient = getOdooClient();
    try {
      const response = await odooClient.queryModel(
        "distribution.settings",
        [],
        SETTINGS_SPEC_QUERY,
      );
      if (!response || !response.records) {
        throw new Error("No distribution settings found");
      }
      const fistSetting: any = response.records[0];

      return {
        name: fistSetting.name,
        paymentMethods:
          fistSetting.distribution_payment_method_ids?.map((paymentMethod: any) => {
            return {
              id: paymentMethod.id,
              name: paymentMethod.name,
              code: paymentMethod.code,
              outbound_payment_method_line_ids:
                paymentMethod.outbound_payment_method_line_ids,
              inbound_payment_method_line_ids: paymentMethod.inbound_payment_method_line_ids,
            };
          }) || [],
        invoiceJournal: {
          id: fistSetting.distribution_invoice_journal_id.id,
          name: fistSetting.distribution_invoice_journal_id.name,
          code: fistSetting.distribution_invoice_journal_id.code,
        },
        companies: fistSetting.company_ids || [],
        productCategories: fistSetting.allowed_product_category_ids || [],
      };
    } catch (error) {
      throw new Error(`Failed to fetch distribution settings ${error}`);
    }
  }
}

export const DistributionSettingsAdapter = new DistributionSettingsAdapterImpl();
