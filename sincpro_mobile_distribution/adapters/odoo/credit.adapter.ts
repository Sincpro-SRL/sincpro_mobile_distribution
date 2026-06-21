import { EntityCollection } from "@sincpro/mobile/domain/entity";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import { Credit, type IRemoteCreditDTO } from "@sincpro/mobile-distribution/domain/customer";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

const CONST_QUERY_PAYMENT = {
  id: {},
  nro_cuota: {},
  payment_date: {},
  paid_capital: {},
  amount: {},
  state: {},
};

const QUERY_CREDIT_APPLIANCE = {
  id: {},
  name: {},
  partner_id: {
    fields: {
      id: {},
      name: {},
      vat: {},
    },
  },
  payment_amount: {},
  invoice_credit_sum: {},
  invoice_ids: {
    fields: {
      id: {},
      invoice_date: {},
      amount_total: {},
      amount_residual: {},
    },
  },
  payment_ids: {
    fields: CONST_QUERY_PAYMENT,
  },
  credit_authorized_ids: {
    fields: {
      id: {},
      partner_id: {
        fields: {
          id: {},
          name: {},
        },
      },
    },
  },
};

class CreditOdooAdapterImpl {
  async fetchCommercialCredits(customerIds: number[]): Promise<EntityCollection<Credit>> {
    if (customerIds.length === 0) {
      return new EntityCollection([]);
    }

    loggerAdapter.info(
      `Fetching commercial credits for ${customerIds.length} customers from Odoo`,
    );
    const client = getOdooClient();

    const domain = [
      ["partner_id", "in", customerIds],
      ["credit_type", "=", "commercial"],
      ["state", "in", ["payed"]],
    ];

    const result = await client.queryModel<IRemoteCreditDTO>(
      "credit.application",
      domain,
      QUERY_CREDIT_APPLIANCE,
    );

    if (result.records.length === 0) {
      loggerAdapter.warn("No commercial credits found in Odoo");
      return new EntityCollection([]);
    }

    loggerAdapter.info(`Fetched ${result.records.length} commercial credits from Odoo`);
    const credits = result.records.map((record) => Credit.fromRemoteDTO(record));
    return new EntityCollection(credits);
  }
}

export const CreditOdooAdapter = new CreditOdooAdapterImpl();
