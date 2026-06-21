import { OdooScreen } from "@sincpro/mobile-odoo/entrypoints/ui/AppScreen";

/**
 * App Screen Routes - Mobile-First Navigation
 *
 * IMPORTANT: No URL parameters (:id) in paths
 * - Navigation uses state objects with full entities + IDs for recovery
 * - Paths are simple, descriptive, context-based
 * - No web-style routing patterns
 */
export enum AppScreen {
  // Auth & Setup (from OdooScreen)
  LOGIN = OdooScreen.LOGIN,
  RESET_ACCOUNT = OdooScreen.RESET_ACCOUNT,
  PROFILE = OdooScreen.PROFILE,
  SETTINGS = OdooScreen.SETTINGS,
  SERVER = OdooScreen.SERVER,

  // Debug/Admin (from CommonScreen)
  DATABASE_LIST = OdooScreen.DATABASE_LIST,
  DEAD_LETTER_QUEUE = "/common/dead-letter-queue",
  EVENTS = "/common/events",

  // Odoo Portal (from OdooScreen)
  ODOO_PORTAL = OdooScreen.ODOO_PORTAL,

  // Main Flow
  MAIN = "/",
  ROUTES = "/routes",
  SCANNER = "/scanner",

  // Product Catalog
  PRODUCT_LIST = "/products/catalog",
  PRODUCT_DETAIL = "/products/detail",

  // Customer Management
  CUSTOMER_LIST = "/customers/list",
  CUSTOMER_DETAIL = "/customers/detail",
  CUSTOMER_CREATE = "/customers/create",
  CUSTOMER_ORDERS_LIST = "/customers/orders/list",
  CUSTOMER_ORDERS_DETAIL = "/customers/orders/detail",

  // Sale Orders
  SALE_ORDER_LIST = "/orders/list",
  SALE_ORDER_DETAIL = "/orders/detail",
  SALE_ORDER_CREATE = "/orders/create",
  SALE_ORDER_UPDATE = "/orders/update",
  SALE_ORDER_PAYMENT = "/orders/payment",
  ORDER_RECEIPT = "/orders/receipt",

  // Credit Notes
  CREDIT_NOTE_LIST = "/credit-notes/list",
  CREDIT_NOTE_DETAIL = "/credit-notes/detail",
  CREDIT_NOTE_CREATE = "/credit-notes/create",
  CREDIT_NOTE_PAYMENT = "/credit-notes/payment",

  // Invoices
  INVOICE_LIST = "/invoices/list",
  INVOICE_DETAIL = "/invoices/detail",
  INVOICE_PAYMENT = "/invoices/payment",

  // Payments & Cashier
  CASHIER = "/cashier",
  CASHIER_HISTORY = "/cashier/history",
  PAYMENT_HISTORY = "/payments/history",
  PAYMENT_DETAIL = "/payments/detail",

  // Fallback
  ANY = "*",
}
