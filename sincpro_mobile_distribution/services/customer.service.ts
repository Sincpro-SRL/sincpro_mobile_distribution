import { ERemoteState, RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { repos } from "@sincpro/mobile/entrypoints/db";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { LatestDebounced } from "@sincpro/mobile/tools/utils/searchTools";
import { CreditOdooAdapter } from "@sincpro/mobile-distribution/adapters/odoo/credit.adapter";
import { CustomerOdooAdapter } from "@sincpro/mobile-distribution/adapters/odoo/customer.adapter";
import { Customer, ECustomerRouteStatus } from "@sincpro/mobile-distribution/domain/customer";
import { CustomersFetchedEvent } from "@sincpro/mobile-distribution/domain/customer/events";
import { EDistributionDomainRepository } from "@sincpro/mobile-distribution/domain/repository";

class CustomerService {
  private readonly searchGate = new LatestDebounced(1300);
  private get repository() {
    return repos.get(EDistributionDomainRepository.CUSTOMER);
  }

  async getAllCustomers(): Promise<RemoteEntityCollection<Customer>> {
    loggerUseCases.info("Getting all customers from local database");

    const customers = await this.repository.findAll();

    loggerUseCases.info(`Found ${customers.length} customers`);
    return new RemoteEntityCollection(customers.toArray());
  }

  async getCustomerByUuid(uuid: string): Promise<Customer | null> {
    loggerUseCases.info(`Getting customer by UUID: ${uuid}`);

    const customer = await this.repository.findById(uuid);

    if (customer) {
      loggerUseCases.info(`Customer with UUID ${uuid} found in local database`);
      return customer;
    }

    loggerUseCases.warn(`Customer with UUID ${uuid} not found`);
    return null;
  }

  async getCustomerByRemoteId(remoteId: number): Promise<Customer | null> {
    loggerUseCases.info(`Getting customer by remote ID: ${remoteId}`);

    const customers = await this.repository.findByRemoteIds([remoteId]);

    if (customers.isNotEmpty) {
      loggerUseCases.info(`Customer with remote ID ${remoteId} found in local database`);
      return customers.first() ?? null;
    }

    loggerUseCases.warn(`Customer with remote ID ${remoteId} not found`);
    return null;
  }

  async fetchMissingCustomersByRemoteIds(
    remoteIds: number[],
  ): Promise<RemoteEntityCollection<Customer>> {
    const localCustomers = await this.repository.findAll();
    const mapLocalCustomers = localCustomers.toMap((c: Customer) => c.remoteId!);
    const customerToFetch = remoteIds.filter((id) => !mapLocalCustomers.has(id));

    if (customerToFetch.length === 0) {
      return new RemoteEntityCollection([]);
    }

    loggerUseCases.info(`Fetching ${customerToFetch.length} missing customers from backend`);
    return await CustomerOdooAdapter.getCustomerByIds(customerToFetch);
  }

  async fetchAndStoreMissingCustomersByRemoteIds(
    remoteIds: number[],
  ): Promise<RemoteEntityCollection<Customer>> {
    const missingCustomers = await this.fetchMissingCustomersByRemoteIds(remoteIds);

    if (missingCustomers.isEmpty) {
      return missingCustomers;
    }
    await missingCustomers.publishDomainEvent<CustomersFetchedEvent>(CustomersFetchedEvent, {
      customerIds: missingCustomers.mapToArray((c) => c.remoteId!),
    });

    await this.repository.save(missingCustomers);
    loggerUseCases.info(
      `New customer [${missingCustomers.length}] records saved to local database`,
    );

    return missingCustomers;
  }

  async createNewCustomer(customer: Customer): Promise<Customer> {
    loggerUseCases.info(`Creating new customer: ${customer.name}`);

    customer.create(ECustomerRouteStatus.CREATED_IN_ROUTE);
    await this.repository.save(customer);

    loggerUseCases.info(
      `Created new customer: ${customer.name} with UUID [${customer.uuid}]`,
    );

    return customer;
  }

  async createCustomer(
    customer: Customer,
    routeStatus: ECustomerRouteStatus = ECustomerRouteStatus.FETCHED,
  ): Promise<Customer> {
    if (customer.remoteId) {
      const existingCustomers = await this.repository.findByCriteria([
        { field: "remoteId", operator: "=", value: customer.remoteId },
      ]);

      if (existingCustomers.isNotEmpty) {
        loggerUseCases.warn(
          `Customer with remoteId ${customer.remoteId} already exists, skipping creation`,
        );
        return existingCustomers.first()!;
      }
    }

    loggerUseCases.info(`Store existing customer locally: ${customer.name}`);

    customer.create(routeStatus);
    await this.repository.save(customer);

    loggerUseCases.info(
      `Created existing customer: ${customer.name} with UUID [${customer.uuid}]`,
    );

    return customer;
  }

  async searchCustomers(searchString: string): Promise<RemoteEntityCollection<Customer>> {
    return this.searchGate.run(
      async () => {
        loggerUseCases.info(`Searching customers with string: "${searchString}"`);

        const localMatches = await this.repository.findByString(searchString);

        if (!searchString || searchString.trim() === "" || localMatches.isNotEmpty) {
          loggerUseCases.info(`Found ${localMatches.length} customers locally`);
          return new RemoteEntityCollection(localMatches.toArray());
        }

        loggerUseCases.info(`Searching remote customers with string: "${searchString}"`);

        const allLocalCustomers = await this.repository.findAll();
        const excludeRemoteIds = allLocalCustomers
          .mapToArray((c: Customer) => c.remoteId)
          .filter((id: number | undefined): id is number => id !== undefined && id > 0);

        const remoteCustomers = await CustomerOdooAdapter.searchCustomer(searchString, {
          excludeIds: excludeRemoteIds,
          limit: 80,
        });

        if (remoteCustomers.isEmpty) {
          loggerUseCases.warn(`No customers found remotely for: "${searchString}"`);
          return remoteCustomers;
        }

        await this.mergeRemoteCustomers(remoteCustomers);

        loggerUseCases.info(
          `Found and saved ${remoteCustomers.length} customers from remote search`,
        );

        await remoteCustomers.publishDomainEvent<CustomersFetchedEvent>(
          CustomersFetchedEvent,
          {
            customerIds: remoteCustomers
              .mapToArray((c) => c.remoteId)
              .filter((id): id is number => !!id),
          },
        );

        return remoteCustomers;
      },
      async () => {
        const results = await this.repository.findByString(searchString);
        return new RemoteEntityCollection(results.toArray());
      },
    );
  }

  async aggregateCreditToCustomers(
    customerIds: number[],
  ): Promise<RemoteEntityCollection<Customer>> {
    if (customerIds.length === 0) {
      return new RemoteEntityCollection([]);
    }

    loggerUseCases.info(
      `Aggregating credit info to ${customerIds.length} customers [${customerIds.join(", ")}] from backend`,
    );

    const credits = await CreditOdooAdapter.fetchCommercialCredits(customerIds);

    if (credits.isEmpty) {
      loggerUseCases.warn("No credits found from backend");
      return new RemoteEntityCollection([]);
    }

    const creditsByPartnerId = credits.groupBy((credit) => credit.partnerId);

    const customers = await this.repository.findByRemoteIds(customerIds);

    for (const customer of customers) {
      if (customer.remoteId) {
        const customerCredits = creditsByPartnerId.get(customer.remoteId);
        if (customerCredits) {
          customer.applyCreditInfo(customerCredits);
        }
      }
    }

    if (customers.isNotEmpty) {
      await this.repository.save(customers);
      loggerUseCases.info(`Aggregated credit info to ${customers.length} customers`);
    }

    return await this.pullExemptCustomersFromBackend(customerIds);
  }

  async pullExemptCustomersFromBackend(
    remoteIds: number[],
  ): Promise<RemoteEntityCollection<Customer>> {
    loggerUseCases.info(
      `Pulling ${remoteIds.length} exempt customers from backend (no event)`,
    );

    const remoteCustomers = await CustomerOdooAdapter.getCustomerByIds(remoteIds);
    if (remoteCustomers.isEmpty) {
      loggerUseCases.info("No remote customers found");
      return remoteCustomers;
    }

    await this.mergeRemoteCustomers(remoteCustomers);

    return await this.repository.findByRemoteIds(
      remoteCustomers.mapToArray((c) => c.remoteId!),
    );
  }

  async pushCustomerToBackend(customer: Customer): Promise<Customer> {
    if (customer.remoteState === ERemoteState.SYNCED) {
      loggerUseCases.info(`Customer ${customer.name} already synced, skipping`);
      return customer;
    }

    loggerUseCases.info(`Pushing customer [${customer.name}] to backend`);

    const remoteCustomer = await CustomerOdooAdapter.createCustomer(customer);

    loggerUseCases.info(
      `Customer ${customer.name} synced: remote ID [${remoteCustomer.remoteId}]`,
    );

    const localUuid = customer.uuid;
    customer.mergeWithRemote(remoteCustomer);
    customer.uuid = localUuid;
    await this.repository.save(customer);

    if (customer.remoteId) {
      const enrichedCustomers = await this.aggregateCreditToCustomers([customer.remoteId]);
      const enrichedCustomer = enrichedCustomers.first();
      this.mergeRemoteCustomers(
        new RemoteEntityCollection(enrichedCustomer ? [enrichedCustomer] : []),
      );

      return enrichedCustomer || customer;
    }

    return customer;
  }

  async pushCustomersToBackend(): Promise<void> {
    loggerUseCases.info("Pushing pending customers to backend");

    const customersToPush = await this.repository.findByRemoteState(ERemoteState.PENDING);

    loggerUseCases.info(`Found ${customersToPush.length} customers to push`);

    for (const customer of customersToPush) {
      try {
        await this.pushCustomerToBackend(customer);
      } catch (error) {
        loggerUseCases.error(`Failed to push customer ${customer.name} to backend: ${error}`);
      }
    }

    loggerUseCases.info(`Finished pushing customers to backend`);
  }

  async pullAndStoreCustomersFromBackend(
    remoteIds: number[],
  ): Promise<RemoteEntityCollection<Customer>> {
    loggerUseCases.info(`Pulling ${remoteIds.length} customers from backend`);

    const remoteCustomers = await CustomerOdooAdapter.getCustomerByIds(remoteIds);
    if (remoteCustomers.isEmpty) {
      loggerUseCases.info("No remote customers found");
      return remoteCustomers;
    }

    await this.mergeRemoteCustomers(remoteCustomers);

    const enrichedCustomers = await this.aggregateCreditToCustomers(remoteIds);

    loggerUseCases.info(
      `Pulled and enriched ${enrichedCustomers.length} customers from backend`,
    );

    return enrichedCustomers;
  }

  async mergeRemoteCustomers(
    remoteCustomers: RemoteEntityCollection<Customer>,
  ): Promise<void> {
    const remoteIds = remoteCustomers.mapToArray((c) => c.remoteId!).filter((id) => id > 0);
    const localCustomers = await this.repository.findByRemoteIds(remoteIds);
    const localCustomerMap = localCustomers.toMap((c: Customer) => c.remoteId);
    const [existingRemote, missingRemote] = remoteCustomers.partition((c) =>
      localCustomerMap.has(c.remoteId),
    );

    if (missingRemote.isNotEmpty) {
      await this.repository.save(missingRemote);
      loggerUseCases.info(`Saved ${missingRemote.length} new customers from remote`);
    }

    if (existingRemote.isNotEmpty) {
      loggerUseCases.info(
        `Merging ${existingRemote.length} existing customers with remote data`,
      );
      for (const remoteCustomer of existingRemote) {
        const localCustomer = localCustomerMap.get(remoteCustomer.remoteId);
        if (!localCustomer) continue;
        const localUuid = localCustomer.uuid;

        localCustomer.mergeWithRemote(remoteCustomer);
        localCustomer.uuid = localUuid;
        await this.repository.save(localCustomer);
      }
    }
  }

  async pullAndMergeCustomerFromBackend(remoteId: number): Promise<Customer | null> {
    if (remoteId <= 0) {
      loggerUseCases.info(`Customer remote ID ${remoteId} is not valid, skipping`);
      return null;
    }

    loggerUseCases.info(`Pulling customer [${remoteId}] from backend`);

    const customers = await this.pullAndStoreCustomersFromBackend([remoteId]);
    if (customers.isEmpty) {
      loggerUseCases.info(`No remote customer found for ID: ${remoteId}`);
      return null;
    }

    loggerUseCases.info(`Successfully pulled customer [${remoteId}] from backend`);
    return customers.first() || null;
  }

  async pullAndMergeCustomersFromBackend(): Promise<void> {
    loggerUseCases.info("Pulling and merging all customers from backend");

    const localCustomers: RemoteEntityCollection<Customer> = await this.repository.findAll();

    if (localCustomers.isEmpty) {
      loggerUseCases.info("No local customers found, skipping merge");
      return;
    }

    const remoteIds = localCustomers
      .filter((c: Customer) => !!c.remoteId && c.remoteId > 0)
      .mapToArray((c: Customer) => c.remoteId!);

    if (remoteIds.length === 0) {
      loggerUseCases.info("No local customers with valid remote IDs, skipping merge");
      return;
    }

    await this.pullAndStoreCustomersFromBackend(remoteIds);

    await localCustomers.publishDomainEvent<CustomersFetchedEvent>(CustomersFetchedEvent, {
      customerIds: remoteIds,
    });
    loggerUseCases.info(`Successfully synced ${remoteIds.length} customers from backend`);
  }

  async refreshCustomerFromBackend(id: number | string): Promise<Customer | null> {
    loggerUseCases.info(`Refreshing customer ${id} from backend`);

    let localCustomer: Customer | null;
    if (typeof id === "string") {
      localCustomer = await this.repository.findById(id);
    } else {
      localCustomer = await this.getCustomerByRemoteId(id);
    }

    if (!localCustomer) {
      loggerUseCases.warn(`Customer ${id} not found locally`);
      return null;
    }

    try {
      let remoteCustomer: Customer | null;

      if (localCustomer.remoteId && localCustomer.remoteId > 0) {
        const customers = await CustomerOdooAdapter.getCustomerByIds([
          localCustomer.remoteId,
        ]);
        remoteCustomer = customers.first() ?? null;
      } else {
        remoteCustomer = await CustomerOdooAdapter.getCustomerByLocalRef(localCustomer.uuid);
      }

      if (!remoteCustomer) {
        loggerUseCases.warn(`Customer ${id} not found in backend`);
        return localCustomer;
      }

      localCustomer.mergeWithRemote(remoteCustomer);
      await this.repository.save(localCustomer);
      loggerUseCases.info(`Customer ${id} refreshed from backend`);
      return localCustomer;
    } catch (error) {
      loggerUseCases.error(`Failed to refresh customer ${id}: ${error}`);
      return localCustomer;
    }
  }
}

export const customerService = new CustomerService();
