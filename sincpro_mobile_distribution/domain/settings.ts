import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";

import type { IPaymentMethod } from "./payment";

export const DEFAULT_TIMEZONE = "America/Costa_Rica";
export const DEFAULT_LOCALE = "es-CR";

export interface IInvoiceJournal {
  id: number;
  name: string;
  code: string;
}

export const CREDIT_PAYMENT_METHOD: IPaymentMethod = {
  id: -1,
  name: "Pago a Crédito",
  code: "CREDIT",
};

export enum EDistributionSetting {
  PAYMENT_METHODS = "distribution.payment_methods",
  INVOICE_JOURNAL = "distribution.invoice_journal",
  COMPANIES = "distribution.companies",
  PRODUCT_CATEGORIES = "distribution.product_categories",
  ACTIVE_ROUTE = "distribution.active_route",
  ACTIVE_ROUTE_STATE = "distribution.active_route_state",
  START_DATE_ROUTE = "distribution.start_date_route",
  END_DATE_ROUTE = "distribution.end_date_route",
  TIMEZONE = "distribution.timezone",
  LOCALE = "distribution.locale",
  CURRENT_CONSECUTIVE = "distribution.current_consecutive",
  TEMPLATE_CONSECUTIVE_NUMBER = "distribution.template_consecutive_number",
  INVOICE_CURRENT_CONSECUTIVE = "distribution.invoice_current_consecutive",
  INVOICE_TEMPLATE_CONSECUTIVE = "distribution.invoice_template_consecutive",
  TICKET_CURRENT_CONSECUTIVE = "distribution.ticket_current_consecutive",
  TICKET_TEMPLATE_CONSECUTIVE = "distribution.ticket_template_consecutive",
  ASSIGNED_VEHICLE_ID = "distribution.assigned_vehicle_id",
  ASSIGNED_VEHICLE_NAME = "distribution.assigned_vehicle_name",
}

export interface TimezoneLocale {
  timezone: string;
  locale: string;
}

export interface IDistributionSetting {
  name: string;
  paymentMethods: IPaymentMethod[];
  invoiceJournal: IInvoiceJournal;
  companies: number[];
  productCategories: number[];
}

export class SettingsFetchedEvent extends DomainEvent {
  static readonly name = "distribution.settings.v2.fetched";
  static readonly label = "Configuraciones sincronizadas";
  static readonly requiresNetwork = true;

  public readonly name = SettingsFetchedEvent.name;
  public readonly label = SettingsFetchedEvent.label;
  public readonly requiresNetwork = SettingsFetchedEvent.requiresNetwork;
}
