import { CreditNoteCreatedSubscriber } from "./creditNoteCreated.handler";
import { CreditNotePostedSubscriber } from "./creditNotePosted.handler";
import { CreditNoteReadyToReconcileSubscriber } from "./creditNoteReadyToReconcile.handler";
import { CreditNoteStockReturnRequestedSubscriber } from "./creditNoteStockReturnRequested.handler";
import { CustomerCreatedSubscriber } from "./customerCreated.handler";
import { CustomersFetchedSubscriber } from "./customerFetched.handler";
import { InvoiceCreatedFromSaleOrderSubscriber } from "./invoiceCreatedFromSaleOrder.handler";
import { InvoicePenalizationInfoSubscriber } from "./invoicePenalizationInfo.suscriber";
import { InvoiceReadyToReconcileSubscriber } from "./invoiceReadyToReconcile.handler";
import { LoggedSuccessfullySubscriber } from "./loggedSuccessfully.handler";
import { PaymentConfirmedForCreditNoteSubscriber } from "./paymentConfirmedForCreditNote.handler";
import { PaymentConfirmedForInvoiceSubscriber } from "./paymentConfirmedForInvoice.handler";
import { PaymentCreditConfirmedForInvoiceSubscriber } from "./paymentCreditConfirmedForInvoice.handler";
import { PaymentLinkToCreditNoteSubscriber } from "./paymentLinkToCreditNote.handler";
import { PaymentLinkToInvoiceSubscriber } from "./paymentLinkToInvoice.handler";
import { PaymentReconciledSubscriber } from "./paymentReconciled.handler";
import { ProductFetchedSubscriber } from "./productFetched.handler";
import { ProductStockUpdatedSubscriber } from "./productStockUpdated.handler";
import { RouteOrderCreatedFromRemoteSubscriber } from "./routeCreatedFromRemote.handler";
import { RoutePlanFetchedSubscriber } from "./routeFetched.handler";
import { RemoteRouteChangedSubscriber } from "./routeRemoteChanged.handler";
import { SaleOrderConfirmedSubscriber } from "./saleOrderConfirmed.handler";
import { SaleOrderCreatedSubscriber } from "./saleOrderCreated.handler";
import { SaleOrderDeliveredSubscriber } from "./saleOrderDelivered.handler";
import { SaleOrderNewInvoicesDetectedSubscriber } from "./saleOrderNewInvoicesDetected.handler";
import { SaleOrderQuotationCreatedSubscriber } from "./saleOrderQuotationCreated.handler";
import { SaleOrderUpdatedSubscriber } from "./saleOrderUpdated.handler";
import { SettingsFetchedSubscriber } from "./settingFetched.handler";

export const DistributionSubscribers = [
  new LoggedSuccessfullySubscriber(),
  new SettingsFetchedSubscriber(),
  new RoutePlanFetchedSubscriber(),
  new RouteOrderCreatedFromRemoteSubscriber(),
  new RemoteRouteChangedSubscriber(),
  new CustomerCreatedSubscriber(),
  new CustomersFetchedSubscriber(),
  new ProductFetchedSubscriber(),
  new ProductStockUpdatedSubscriber(),
  new SaleOrderQuotationCreatedSubscriber(),
  new SaleOrderCreatedSubscriber(),
  new SaleOrderConfirmedSubscriber(),
  new SaleOrderDeliveredSubscriber(),
  new SaleOrderUpdatedSubscriber(),
  new SaleOrderNewInvoicesDetectedSubscriber(),
  new PaymentConfirmedForInvoiceSubscriber(),
  new PaymentCreditConfirmedForInvoiceSubscriber(),
  new PaymentConfirmedForCreditNoteSubscriber(),
  new PaymentReconciledSubscriber(),
  new PaymentLinkToInvoiceSubscriber(),
  new PaymentLinkToCreditNoteSubscriber(),
  new InvoiceCreatedFromSaleOrderSubscriber(),
  new InvoiceReadyToReconcileSubscriber(),
  new InvoicePenalizationInfoSubscriber(),
  new CreditNoteCreatedSubscriber(),
  new CreditNotePostedSubscriber(),
  new CreditNoteReadyToReconcileSubscriber(),
  new CreditNoteStockReturnRequestedSubscriber(),
];
