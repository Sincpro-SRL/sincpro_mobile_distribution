import type { EntityCollection } from "@sincpro/mobile/domain/entity";
import { ERemoteState, RemoteEntity } from "@sincpro/mobile/domain/entity";
import { generateUUID } from "@sincpro/mobile/infrastructure/database/utils";

import { EDistributionRepository } from "../repository";
import type { Credit, IAuthorizedPerson } from "./credit";
import { CustomerCreatedEvent, CustomersFetchedEvent } from "./events";

export type CustomerID = number;

export enum LegalEntityTypes {
  INDIVIDUAL = "individual",
  COMPANY = "company",
}

export enum ECustomerRouteStatus {
  PLANNED = "planned",
  FETCHED = "fetched",
  CREATED_IN_ROUTE = "created_in_route",
}

export enum IdentificationType {
  FISICA = "01",
  JURIDICA = "02",
  DIMEX = "03",
  NITE = "04",
}

export const IDENTIFICATION_TYPE_LABEL: Record<IdentificationType, string> = {
  [IdentificationType.FISICA]: "Física",
  [IdentificationType.JURIDICA]: "Jurídica",
  [IdentificationType.DIMEX]: "DIMEX",
  [IdentificationType.NITE]: "NITE",
};

export type CustomerFormValues = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
};

/**
 * Raw data structure from API/Backend
 */
export interface IRemoteCustomer {
  id: number;
  name?: string;
  vat?: string;
  ref?: string;
  max_discount_apk?: number;
  identification_type?: IdentificationType;
  company_type?: LegalEntityTypes;
  email?: string;
  mobile?: string;
  street?: string;
  country_id?: { id: number; name: string };
  state_id?: { id: number; name: string };
  zip?: string;
  default_ae_code?: string;
  is_exempt_customer?: boolean;
  property_product_pricelist?: {
    id?: number;
    name?: string;
  };
  property_payment_term_id?: {
    id?: number;
    name?: string;
  };
  external_uuid?: string;
}

export class Customer extends RemoteEntity {
  protected readonly REPOSITORY = EDistributionRepository.CUSTOMER;

  public id?: CustomerID;
  public legalEntityType: LegalEntityTypes = LegalEntityTypes.INDIVIDUAL;
  public vat: string = "";
  public ref: string = "";
  public identificationType?: IdentificationType;
  public email: string = "";
  public phone: string = "";
  public address?: string;
  public city?: string;
  public state?: string;
  public zipCode?: string;
  public economicActivityCode?: string;
  public priceListId?: number;
  public priceListName?: string;
  public routeStatus?: ECustomerRouteStatus;
  public maxDiscountApk: number = 0;
  public creditLimit: number = 0;
  public availableCredit: number = 0;
  public creditApplicationIds: number[] = [];
  public paymentTermDisplay?: string;
  public authorizedPersons: IAuthorizedPerson[] = [];
  public isExemptCustomer?: boolean;

  static override fromRemoteDTO(record: IRemoteCustomer): Customer {
    const identificationType = record.identification_type
      ? record.identification_type
      : record.company_type === LegalEntityTypes.COMPANY
        ? IdentificationType.JURIDICA
        : IdentificationType.FISICA;

    const legalEntityType =
      identificationType === IdentificationType.JURIDICA
        ? LegalEntityTypes.COMPANY
        : LegalEntityTypes.INDIVIDUAL;

    let normalizedMaxDiscount: number | undefined = undefined;
    if (typeof record.max_discount_apk === "number") {
      const raw = record.max_discount_apk;
      const percent = raw <= 1 ? raw * 100 : raw;
      const clamped = Math.max(0, Math.min(100, percent));
      normalizedMaxDiscount = Number(clamped.toFixed(2));
    }

    const customerData: Partial<Customer> = {
      id: record.id,
      uuid: record.external_uuid || generateUUID(),
      remoteId: record.id,
      remoteRef: `res.partner,${record.id}`,
      vat: record.vat || "",
      ref: record.ref || "",
      identificationType,
      legalEntityType,
      name: record.name || "",
      email: record.email || "",
      phone: record.mobile || "",
      address: record.street || "",
      state: record.state_id?.name || "",
      zipCode: record.zip || "",
      economicActivityCode: record.default_ae_code || "",
      priceListId: record.property_product_pricelist?.id,
      priceListName: record.property_product_pricelist?.name,
      maxDiscountApk: normalizedMaxDiscount || 0,
      creditLimit: 0,
      availableCredit: 0,
      creditApplicationIds: [],
      paymentTermDisplay: record.property_payment_term_id?.name || undefined,
      authorizedPersons: [],
      isExemptCustomer: record.is_exempt_customer,
      remoteState: ERemoteState.SYNCED,
    };

    const customer = Customer.obj(customerData);
    return customer;
  }

  applyCreditInfo(credits: EntityCollection<Credit>): void {
    if (credits.isEmpty) return;

    const credit = credits.first()!;
    this.creditLimit = credit.creditLimit;
    this.availableCredit = credit.availableCredit;
    this.creditApplicationIds = credits.mapToArray((c) => c.id);
    this.authorizedPersons = credit.authorizedPersons || [];
  }

  create(routeStatus: ECustomerRouteStatus = ECustomerRouteStatus.FETCHED): Customer {
    this.routeStatus = routeStatus;
    this.remoteState = ERemoteState.PENDING;
    if (routeStatus === ECustomerRouteStatus.CREATED_IN_ROUTE) {
      this.publishDomainEvent<CustomerCreatedEvent>(CustomerCreatedEvent, {
        customer: this,
      });
    }
    return this;
  }

  async refreshCustomer(): Promise<void> {
    await this.publishDomainEvent<CustomersFetchedEvent>(CustomersFetchedEvent, {
      customerIds: [this.remoteId!],
    });
  }

  public mergeWithRemote(data: this): void {
    const creditLimit = this.creditLimit;
    const availableCredit = this.availableCredit;
    const creditApplicationIds = this.creditApplicationIds;
    const authorizedPersons = this.authorizedPersons;

    super.mergeWithRemote(data);

    this.creditLimit = creditLimit;
    this.availableCredit = availableCredit;
    this.creditApplicationIds = creditApplicationIds;
    this.authorizedPersons = authorizedPersons;
  }
}
