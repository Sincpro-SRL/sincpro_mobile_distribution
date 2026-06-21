import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import { convertToArray } from "@sincpro/mobile/tools/utils/collections";
import {
  Customer,
  CustomerID,
  IdentificationType,
  IRemoteCustomer,
  LegalEntityTypes,
} from "@sincpro/mobile-distribution/domain/customer";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

/**
 * Odoo query specification for partner (customer) fields
 */
export const PARTNER_SPEC_QUERY = {
  id: {},
  external_uuid: {},
  name: {},
  vat: {},
  ref: {},
  max_discount_apk: {},
  identification_type: {},
  default_ae_code: {},
  company_type: {},
  email: {},
  mobile: {},
  street: {},
  zip: {},
  is_exempt_customer: {},
  property_payment_term_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  country_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  state_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  property_product_pricelist: {
    fields: {
      id: {},
      name: {},
    },
  },
};

/**
 * CustomerOdooAdapter - Handles all Odoo backend operations for customers
 * Uses the new Customer entity with uuid as primary key
 */
export const CustomerOdooAdapter = {
  async getCustomerByIds(ids: CustomerID[]): Promise<RemoteEntityCollection<Customer>> {
    loggerAdapter.info(`Fetching customers from Odoo for IDs: ${ids}`);
    const partnerIds = convertToArray(ids);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteCustomer>(
      "res.partner",
      [["id", "in", partnerIds]],
      PARTNER_SPEC_QUERY,
    );

    return RemoteEntityCollection.fromRemoteDTO(result.records, Customer);
  },

  /**
   * Fetches a customer by VAT number
   */
  async getCustomerByVat(vat: string): Promise<Customer | null> {
    loggerAdapter.info(`Fetching customer from Odoo by VAT: ${vat}`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteCustomer>(
      "res.partner",
      [["vat", "=", vat]],
      {
        limit: 1,
        specification: PARTNER_SPEC_QUERY,
      },
    );

    if (result.records.length === 0) {
      loggerAdapter.info(`Customer with VAT ${vat} not found`);
      return null;
    }

    return Customer.fromRemoteDTO(result.records[0]);
  },

  /**
   * Searches customers by string (name or VAT)
   */
  async searchCustomer(
    searchString: string,
    options?: {
      excludeIds?: number[];
      limit?: number;
      extraDomain?: any[];
    },
  ): Promise<RemoteEntityCollection<Customer>> {
    loggerAdapter.info(`Searching customers in Odoo with string: ${searchString}`);
    const odooClient = getOdooClient();

    const baseDomain: any[] = [
      "|",
      ["name", "ilike", searchString],
      ["vat", "ilike", searchString],
    ];

    let domain: any[] = [...baseDomain];

    if (options?.excludeIds && options.excludeIds.length > 0) {
      domain = ["&", ...domain, ["id", "not in", options.excludeIds]];
    }

    if (options?.extraDomain && options.extraDomain.length > 0) {
      for (const cond of options.extraDomain) {
        domain = ["&", ...domain, cond];
      }
    }

    const result = await odooClient.queryModel<IRemoteCustomer>(
      "res.partner",
      domain,
      PARTNER_SPEC_QUERY,
      {
        limit: options?.limit,
      },
    );

    if (result.records.length === 0) {
      loggerAdapter.info(`No customers found in Odoo for search: ${searchString}`);
      return new RemoteEntityCollection([]);
    }

    return RemoteEntityCollection.fromRemoteDTO(result.records, Customer);
  },

  /**
   * Fetches a customer by UUID (stored in Odoo as external_uuid)
   * Used for syncing local customers with backend
   */
  async getCustomerByLocalRef(customerUUID: string): Promise<Customer | null> {
    if (!customerUUID) {
      loggerAdapter.info("Customer UUID is required to fetch customer by local reference");
      return null;
    }

    loggerAdapter.info(`Fetching customer from Odoo by UUID: ${customerUUID}`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteCustomer>(
      "res.partner",
      [["external_uuid", "=", customerUUID]],
      PARTNER_SPEC_QUERY,
    );

    if (result.records.length === 0) {
      loggerAdapter.info(`Customer with UUID ${customerUUID} not found in Odoo`);
      return null;
    }

    return Customer.fromRemoteDTO(result.records[0]);
  },

  /**
   * Creates a new customer in Odoo
   * Returns the customer with remoteId populated
   */
  async createCustomer(customer: Customer): Promise<Customer> {
    loggerAdapter.info(`Creating customer in Odoo: ${customer.name}`);
    const odooClient = getOdooClient();

    if (customer.remoteId) {
      return customer;
    }

    const existingCustomer = await this.getCustomerByLocalRef(customer.uuid);
    if (existingCustomer) {
      loggerAdapter.info(`Customer with UUID ${customer.uuid} already exists in Odoo`);
      return existingCustomer;
    }

    const inferredIdentificationType =
      customer.identificationType ||
      (customer.legalEntityType === LegalEntityTypes.COMPANY
        ? IdentificationType.JURIDICA
        : IdentificationType.FISICA);

    const partnerData = {
      external_uuid: customer.uuid,
      ref: customer.ref || false,
      name: customer.name || "",
      vat: customer.vat || false,
      identification_type: inferredIdentificationType,
      default_ae_code: customer.economicActivityCode || false,
      is_company: customer.legalEntityType === LegalEntityTypes.COMPANY,
      email: customer.email || false,
      mobile: customer.phone || false,
      street: customer.address || false,
      city: customer.city || false,
      zip: customer.zipCode || false,
      property_product_pricelist: customer.priceListId || false,
    };

    const createdRemoteId = await odooClient.callModel<number>("res.partner", "create", [
      partnerData,
    ]);

    loggerAdapter.info(`Customer created in Odoo with remote ID: ${createdRemoteId}`);

    // Return customer with remoteId populated
    return Customer.obj<Customer>({
      ...customer,
      id: createdRemoteId,
      remoteId: createdRemoteId,
      remoteRef: `res.partner,${createdRemoteId}`,
    });
  },

  /**
   * Updates an existing customer in Odoo
   */
  async updateCustomer(customer: Customer): Promise<void> {
    if (!customer.remoteId) {
      throw new Error("Cannot update customer without remoteId");
    }

    loggerAdapter.info(`Updating customer in Odoo with remote ID: ${customer.remoteId}`);
    const odooClient = getOdooClient();

    const inferredIdentificationType =
      customer.identificationType ||
      (customer.legalEntityType === LegalEntityTypes.COMPANY
        ? IdentificationType.JURIDICA
        : IdentificationType.FISICA);

    const partnerData = {
      external_uuid: customer.uuid,
      ref: customer.ref || false,
      name: customer.name || "",
      vat: customer.vat || false,
      identification_type: inferredIdentificationType,
      default_ae_code: customer.economicActivityCode || false,
      is_company: customer.legalEntityType === LegalEntityTypes.COMPANY,
      email: customer.email || false,
      mobile: customer.phone || false,
      street: customer.address || false,
      city: customer.city || false,
      zip: customer.zipCode || false,
      property_product_pricelist: customer.priceListId || false,
    };

    await odooClient.callModel<void>("res.partner", "write", [
      [customer.remoteId],
      partnerData,
    ]);

    loggerAdapter.info(`Customer updated in Odoo with remote ID: ${customer.remoteId}`);
  },

  /**
   * Fetches customers by remote IDs excluding already synced ones
   * Useful for bulk syncing
   */
  async fetchNewCustomers(options?: {
    excludeRemoteIds?: number[];
    limit?: number;
  }): Promise<RemoteEntityCollection<Customer>> {
    loggerAdapter.info("Fetching new customers from Odoo");
    const odooClient = getOdooClient();

    let domain: any[] = [];

    if (options?.excludeRemoteIds && options.excludeRemoteIds.length > 0) {
      domain = [["id", "not in", options.excludeRemoteIds]];
    }

    const result = await odooClient.queryModel<IRemoteCustomer>(
      "res.partner",
      domain,
      PARTNER_SPEC_QUERY,
      {
        limit: options?.limit,
      },
    );

    loggerAdapter.info(`Fetched ${result.records.length} new customers from Odoo`);

    return RemoteEntityCollection.fromRemoteDTO(result.records, Customer);
  },
};
