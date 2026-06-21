import { IMigration } from "@sincpro/mobile/domain/database";
import { DBCursor } from "@sincpro/mobile/infrastructure/database";

export enum DATABASE_TABLES {
  CUSTOMERS = "distribution_customers",
  ROUTE_PLANS = "distribution_route_plans",
  ROUTE_ORDERS = "distribution_route_orders",
  PRICE_LISTS = "distribution_price_lists",
  PRODUCTS = "distribution_products",
  SALE_ORDERS = "distribution_sale_orders",
  INVOICES = "distribution_invoices",
  CREDIT_NOTES = "distribution_credit_notes",
  PAYMENTS = "distribution_payments",
  PAYMENT_CREDITS = "distribution_payment_credits",
  PAYMENT_ODOO = "distribution_payment_odoo",
  AUTH = "distribution_auth",
}

async function createAuthTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.AUTH}(
      id INTEGER PRIMARY KEY NOT NULL,
      uid INTEGER,
      db TEXT,
      user TEXT,
      password TEXT,
      name TEXT,
      email TEXT,
      vat TEXT,
      type TEXT,
      name_vehicle TEXT,
      company_id INTEGER,
      company_ids TEXT,
      id_vehicle INTEGER
    );
  `);
}

async function createCustomersTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.CUSTOMERS}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      name TEXT,
      remote_id INTEGER,
      remote_state TEXT DEFAULT 'PENDING'
    )
  `);
}

async function createRoutePlansTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.ROUTE_PLANS}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      remote_id INTEGER,
      hash TEXT,
      state TEXT,
      name TEXT,
      active INTEGER DEFAULT 0,
      remote_state TEXT DEFAULT 'PENDING'
    )
  `);
}

async function createRouteOrdersTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.ROUTE_ORDERS}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      name TEXT,
      remote_id INTEGER,
      remote_state TEXT DEFAULT 'SYNCED'
    )
  `);
}

async function createPriceListsTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.PRICE_LISTS}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      remote_id INTEGER UNIQUE,
      name TEXT,
      remote_state TEXT DEFAULT 'SYNCED'
    )
  `);
}

async function createProductsTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.PRODUCTS}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      remote_id INTEGER UNIQUE,
      name TEXT,
      remote_state TEXT DEFAULT 'SYNCED'
    )
  `);
}

async function createSaleOrdersTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.SALE_ORDERS}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      name TEXT,
      remote_id INTEGER,
      route_id INTEGER,
      remote_state TEXT DEFAULT 'PENDING'
    )
  `);
}

async function createInvoicesTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.INVOICES}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      name TEXT,
      remote_id INTEGER,
      customer_id INTEGER,
      remote_state TEXT DEFAULT 'PENDING'
    )
  `);
}

async function createCreditNotesTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.CREDIT_NOTES}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      name TEXT,
      remote_id INTEGER,
      customer_id INTEGER,
      remote_state TEXT DEFAULT 'PENDING'
    )
  `);
}

async function createPaymentsTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.PAYMENTS}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      name TEXT
    )
  `);
}

async function createPaymentCreditsTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.PAYMENT_CREDITS}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      name TEXT,
      remote_id INTEGER,
      customer_id INTEGER,
      remote_state TEXT DEFAULT 'PENDING'
    )
  `);
}

async function createPaymentOdooTable(): Promise<void> {
  await DBCursor.execAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.PAYMENT_ODOO}(
      uuid TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      name TEXT,
      remote_id INTEGER,
      payment_method_id INTEGER,
      source_model TEXT,
      remote_state TEXT DEFAULT 'PENDING'
    )
  `);
}

const MIGRATIONS: IMigration[] = [
  { name: DATABASE_TABLES.AUTH, migrationFn: createAuthTable },
  { name: DATABASE_TABLES.CUSTOMERS, migrationFn: createCustomersTable },
  { name: DATABASE_TABLES.ROUTE_PLANS, migrationFn: createRoutePlansTable },
  { name: DATABASE_TABLES.ROUTE_ORDERS, migrationFn: createRouteOrdersTable },
  { name: DATABASE_TABLES.PRICE_LISTS, migrationFn: createPriceListsTable },
  { name: DATABASE_TABLES.PRODUCTS, migrationFn: createProductsTable },
  { name: DATABASE_TABLES.SALE_ORDERS, migrationFn: createSaleOrdersTable },
  { name: DATABASE_TABLES.INVOICES, migrationFn: createInvoicesTable },
  { name: DATABASE_TABLES.CREDIT_NOTES, migrationFn: createCreditNotesTable },
  { name: DATABASE_TABLES.PAYMENTS, migrationFn: createPaymentsTable },
  { name: DATABASE_TABLES.PAYMENT_CREDITS, migrationFn: createPaymentCreditsTable },
  { name: DATABASE_TABLES.PAYMENT_ODOO, migrationFn: createPaymentOdooTable },
];

export default MIGRATIONS;
