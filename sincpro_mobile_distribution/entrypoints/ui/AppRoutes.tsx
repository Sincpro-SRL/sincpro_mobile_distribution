import { PlainLayout, TabNavigatorLayout } from "@sincpro/mobile";
import DatabaseListScreen from "@sincpro/mobile/ui/screens/database/database.list";
import DeadLetterQueueList from "@sincpro/mobile/ui/screens/dead_letter_queue/dead_letter_queue.list";
import EventsScreen from "@sincpro/mobile/ui/screens/events/events.list";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { CashierScreen } from "@sincpro/mobile-distribution/ui/screens/cashier";
import {
  CreateCreditNoteWizard,
  CreditNoteDetailScreen,
  CustomerOrdersDetailScreen,
  CustomerOrdersListScreen,
  PayCreditNoteWizard,
} from "@sincpro/mobile-distribution/ui/screens/credit_note";
import {
  CustomerDetailScreen,
  CustomerFormScreen,
  CustomerListScreen,
} from "@sincpro/mobile-distribution/ui/screens/customer";
import { HomeScreen } from "@sincpro/mobile-distribution/ui/screens/home";
import {
  InvoiceCustomerListScreen,
  InvoiceSelectionScreen,
  PayInvoiceWizardScreen,
} from "@sincpro/mobile-distribution/ui/screens/invoice";
import {
  PaymentDetailScreen,
  PaymentHistoryScreen,
} from "@sincpro/mobile-distribution/ui/screens/payment";
import {
  ProductDetailScreen,
  ProductListScreen,
} from "@sincpro/mobile-distribution/ui/screens/product";
import { OrderReceiptScreen } from "@sincpro/mobile-distribution/ui/screens/receipt";
import { RouteScreen } from "@sincpro/mobile-distribution/ui/screens/route";
import {
  SaleOrderCreateOrderWizard,
  SaleOrderDetailScreen,
  SaleOrderListScreen,
  SaleOrderPaymentWizard,
  SaleOrderUpdateWizard,
} from "@sincpro/mobile-distribution/ui/screens/sale_order";
import { ScannerScreen } from "@sincpro/mobile-distribution/ui/screens/scanner";
import {
  LoginScreen,
  OdooPortalScreen,
  ProfileScreen,
  ResetAccountScreen,
  ServerScreen,
  SettingsScreen,
} from "@sincpro/mobile-odoo/ui/screens";
import BoxTimeIcon from "@sincpro/mobile-ui/icons/BoxTimeIcon";
import CashierIcon from "@sincpro/mobile-ui/icons/CashierIcon";
import HomeIcon from "@sincpro/mobile-ui/icons/HomeIcon";
import PinIcon from "@sincpro/mobile-ui/icons/PinIcon";
import ProfileIcon from "@sincpro/mobile-ui/icons/ProfileIcon";
import React, { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-native";

const DistributionRoutes = () => {
  const navigate = useNavigate();
  const { session, authIsLoading, serverParams } = useDistributionGlobal();

  useEffect(() => {
    if (authIsLoading) return;
    if (!serverParams || !session) {
      navigate(AppScreen.LOGIN, { replace: true });
    } else {
      navigate(AppScreen.MAIN, { replace: true });
    }
  }, [session, authIsLoading, serverParams]);

  return (
    <Routes>
      <Route
        element={
          <TabNavigatorLayout>
            <TabNavigatorLayout.Tabs>
              <TabNavigatorLayout.Tab Icon={PinIcon} label="Ruta" path={AppScreen.ROUTES} />
              <TabNavigatorLayout.Tab
                Icon={BoxTimeIcon}
                label="Órdenes"
                path={AppScreen.SALE_ORDER_LIST}
              />
              <TabNavigatorLayout.Tab
                Icon={HomeIcon}
                label="Principal"
                path={AppScreen.MAIN}
              />
              <TabNavigatorLayout.Tab
                Icon={CashierIcon}
                label="Caja"
                path={AppScreen.CASHIER}
              />
              <TabNavigatorLayout.Tab
                Icon={ProfileIcon}
                label="Perfil"
                path={AppScreen.PROFILE}
              />
            </TabNavigatorLayout.Tabs>
          </TabNavigatorLayout>
        }
      >
        <Route element={<HomeScreen />} path={AppScreen.MAIN} />
        <Route element={<RouteScreen />} path={AppScreen.ROUTES} />
        <Route element={<SaleOrderListScreen />} path={AppScreen.SALE_ORDER_LIST} />
        <Route
          element={
            <ProfileScreen
              logoSource={require("../../../assets/DISTRIBUTION/logo.png")}
              mainRoute={AppScreen.MAIN}
            />
          }
          path={AppScreen.PROFILE}
        />
        <Route element={<CashierScreen />} path={AppScreen.CASHIER} />
        <Route element={<OdooPortalScreen />} path={AppScreen.ODOO_PORTAL} />
      </Route>
      <Route element={<PlainLayout />}>
        <Route
          element={
            <LoginScreen logoSource={require("../../../assets/DISTRIBUTION/logo.png")} />
          }
          path={AppScreen.LOGIN}
        />
        <Route element={<ResetAccountScreen />} path={AppScreen.RESET_ACCOUNT} />
        <Route element={<ProductListScreen />} path={AppScreen.PRODUCT_LIST} />
        <Route element={<ProductDetailScreen />} path={AppScreen.PRODUCT_DETAIL} />
        <Route element={<CustomerListScreen />} path={AppScreen.CUSTOMER_LIST} />
        <Route element={<CustomerDetailScreen />} path={AppScreen.CUSTOMER_DETAIL} />
        <Route element={<CustomerFormScreen />} path={AppScreen.CUSTOMER_CREATE} />
        <Route element={<CustomerOrdersListScreen />} path={AppScreen.CUSTOMER_ORDERS_LIST} />
        <Route
          element={<CustomerOrdersDetailScreen />}
          path={AppScreen.CUSTOMER_ORDERS_DETAIL}
        />
        <Route element={<RouteScreen />} path={AppScreen.ROUTES} />
        <Route element={<SaleOrderDetailScreen />} path={AppScreen.SALE_ORDER_DETAIL} />
        <Route element={<SaleOrderCreateOrderWizard />} path={AppScreen.SALE_ORDER_CREATE} />
        <Route element={<SaleOrderUpdateWizard />} path={AppScreen.SALE_ORDER_UPDATE} />
        <Route element={<SaleOrderPaymentWizard />} path={AppScreen.SALE_ORDER_PAYMENT} />
        <Route element={<OrderReceiptScreen />} path={AppScreen.ORDER_RECEIPT} />
        <Route element={<CreditNoteDetailScreen />} path={AppScreen.CREDIT_NOTE_DETAIL} />
        <Route element={<CreateCreditNoteWizard />} path={AppScreen.CREDIT_NOTE_CREATE} />
        <Route element={<PayCreditNoteWizard />} path={AppScreen.CREDIT_NOTE_PAYMENT} />
        <Route element={<InvoiceSelectionScreen />} path={AppScreen.INVOICE_DETAIL} />
        <Route element={<InvoiceCustomerListScreen />} path={AppScreen.INVOICE_LIST} />
        <Route element={<PayInvoiceWizardScreen />} path={AppScreen.INVOICE_PAYMENT} />
        <Route element={<PaymentHistoryScreen />} path={AppScreen.PAYMENT_HISTORY} />
        <Route element={<PaymentDetailScreen />} path={AppScreen.PAYMENT_DETAIL} />
        <Route element={<PaymentHistoryScreen />} path={AppScreen.CASHIER_HISTORY} />
        <Route element={<ScannerScreen />} path={AppScreen.SCANNER} />
        <Route element={<ServerScreen />} path={AppScreen.SERVER} />
        <Route element={<SettingsScreen />} path={AppScreen.SETTINGS} />
        <Route element={<DatabaseListScreen />} path={AppScreen.DATABASE_LIST} />
        <Route element={<DeadLetterQueueList />} path={AppScreen.DEAD_LETTER_QUEUE} />
        <Route element={<EventsScreen />} path={AppScreen.EVENTS} />
      </Route>
    </Routes>
  );
};

export default DistributionRoutes;
