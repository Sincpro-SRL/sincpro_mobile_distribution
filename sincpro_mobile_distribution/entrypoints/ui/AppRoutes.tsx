import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DatabaseList, DeadLetterQueueList, EventsScreen } from "@sincpro/mobile/ui/screens";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
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
import { BottomInsetContext } from "@sincpro/mobile-ui";
import BoxTimeIcon from "@sincpro/mobile-ui/icons/BoxTimeIcon";
import CashierIcon from "@sincpro/mobile-ui/icons/CashierIcon";
import HomeIcon from "@sincpro/mobile-ui/icons/HomeIcon";
import PinIcon from "@sincpro/mobile-ui/icons/PinIcon";
import ProfileIcon from "@sincpro/mobile-ui/icons/ProfileIcon";
import {
  BottomNav,
  type BottomNavItem,
} from "@sincpro/mobile-ui/Navigation/Navigation.BottomNav";
import { useTheme } from "@sincpro/mobile-ui/theme";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDistributionGlobal } from "./context";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const LOGO = require("../../../assets/DISTRIBUTION/logo.png");

const AUTH_BACKGROUND = {
  colors: ["#1D4ED8", "#2563EB", "#3B82F6"] as const,
  pattern: "grid" as const,
  patternOpacity: 0.08,
};

const TAB_ITEMS: BottomNavItem[] = [
  { key: AppScreen.ROUTES, customIcon: PinIcon, label: "Ruta" },
  { key: AppScreen.SALE_ORDER_LIST, customIcon: BoxTimeIcon, label: "Órdenes" },
  { key: AppScreen.MAIN, customIcon: HomeIcon, label: "Principal" },
  { key: AppScreen.CASHIER, customIcon: CashierIcon, label: "Caja" },
  { key: AppScreen.PROFILE, customIcon: ProfileIcon, label: "Perfil" },
];

const FLOATING_TAB_INSET = 72;

function LoginWithLogo() {
  return <LoginScreen background={AUTH_BACKGROUND} logoSource={LOGO} />;
}

function ServerWithLogo() {
  return <ServerScreen background={AUTH_BACKGROUND} logoSource={LOGO} />;
}

function ResetAccountWithLogo() {
  return <ResetAccountScreen background={AUTH_BACKGROUND} logoSource={LOGO} />;
}

function ProfileTab() {
  return <ProfileScreen mainRoute={AppScreen.MAIN} />;
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <BottomInsetContext.Provider value={FLOATING_TAB_INSET}>
      <Tabs.Navigator
        initialRouteName={AppScreen.MAIN}
        screenOptions={{ headerShown: false }}
        tabBar={(props) => {
          const activeKey = props.state.routes[props.state.index].name;
          return (
            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: insets.bottom + 12,
              }}
            >
              <BottomNav
                activeColor="accent"
                indicator="pill-text"
                items={TAB_ITEMS}
                onChange={(key) => {
                  props.navigation.navigate(key as never);
                }}
                shape="floating"
                showLabels
                value={activeKey}
              />
            </View>
          );
        }}
      >
        <Tabs.Screen component={RouteScreen} name={AppScreen.ROUTES} />
        <Tabs.Screen component={SaleOrderListScreen} name={AppScreen.SALE_ORDER_LIST} />
        <Tabs.Screen component={HomeScreen} name={AppScreen.MAIN} />
        <Tabs.Screen component={CashierScreen} name={AppScreen.CASHIER} />
        <Tabs.Screen component={ProfileTab} name={AppScreen.PROFILE} />
      </Tabs.Navigator>
    </BottomInsetContext.Provider>
  );
}

function DistributionRoutes() {
  const { session, serverParams } = useDistributionGlobal();
  const isAuthenticated = !!session && !!serverParams;
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg.page } }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen component={MainTabs} name="DistributionTabs" />
          <Stack.Screen component={OdooPortalScreen} name={AppScreen.ODOO_PORTAL} />
          <Stack.Screen component={ProductListScreen} name={AppScreen.PRODUCT_LIST} />
          <Stack.Screen component={ProductDetailScreen} name={AppScreen.PRODUCT_DETAIL} />
          <Stack.Screen component={CustomerListScreen} name={AppScreen.CUSTOMER_LIST} />
          <Stack.Screen component={CustomerDetailScreen} name={AppScreen.CUSTOMER_DETAIL} />
          <Stack.Screen component={CustomerFormScreen} name={AppScreen.CUSTOMER_CREATE} />
          <Stack.Screen
            component={CustomerOrdersListScreen}
            name={AppScreen.CUSTOMER_ORDERS_LIST}
          />
          <Stack.Screen
            component={CustomerOrdersDetailScreen}
            name={AppScreen.CUSTOMER_ORDERS_DETAIL}
          />
          <Stack.Screen
            component={SaleOrderDetailScreen}
            name={AppScreen.SALE_ORDER_DETAIL}
          />
          <Stack.Screen
            component={SaleOrderCreateOrderWizard}
            name={AppScreen.SALE_ORDER_CREATE}
          />
          <Stack.Screen
            component={SaleOrderUpdateWizard}
            name={AppScreen.SALE_ORDER_UPDATE}
          />
          <Stack.Screen
            component={SaleOrderPaymentWizard}
            name={AppScreen.SALE_ORDER_PAYMENT}
          />
          <Stack.Screen component={OrderReceiptScreen} name={AppScreen.ORDER_RECEIPT} />
          <Stack.Screen
            component={CreditNoteDetailScreen}
            name={AppScreen.CREDIT_NOTE_DETAIL}
          />
          <Stack.Screen
            component={CreateCreditNoteWizard}
            name={AppScreen.CREDIT_NOTE_CREATE}
          />
          <Stack.Screen
            component={PayCreditNoteWizard}
            name={AppScreen.CREDIT_NOTE_PAYMENT}
          />
          <Stack.Screen component={InvoiceSelectionScreen} name={AppScreen.INVOICE_DETAIL} />
          <Stack.Screen component={InvoiceCustomerListScreen} name={AppScreen.INVOICE_LIST} />
          <Stack.Screen component={PayInvoiceWizardScreen} name={AppScreen.INVOICE_PAYMENT} />
          <Stack.Screen component={PaymentHistoryScreen} name={AppScreen.PAYMENT_HISTORY} />
          <Stack.Screen component={PaymentDetailScreen} name={AppScreen.PAYMENT_DETAIL} />
          <Stack.Screen component={PaymentHistoryScreen} name={AppScreen.CASHIER_HISTORY} />
          <Stack.Screen component={ScannerScreen} name={AppScreen.SCANNER} />
          <Stack.Screen component={SettingsScreen} name={AppScreen.SETTINGS} />
          <Stack.Screen component={DatabaseList} name={AppScreen.DATABASE_LIST} />
          <Stack.Screen component={DeadLetterQueueList} name={AppScreen.DEAD_LETTER_QUEUE} />
          <Stack.Screen component={EventsScreen} name={AppScreen.EVENTS} />
        </>
      ) : (
        <>
          <Stack.Screen component={LoginWithLogo} name={AppScreen.LOGIN} />
          <Stack.Screen component={ServerWithLogo} name={AppScreen.SERVER} />
          <Stack.Screen component={ResetAccountWithLogo} name={AppScreen.RESET_ACCOUNT} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default DistributionRoutes;
