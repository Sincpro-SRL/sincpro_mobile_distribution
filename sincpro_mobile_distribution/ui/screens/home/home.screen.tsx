import { useNavigation } from "@react-navigation/native";
import { IconType } from "@sincpro/mobile/domain/icon";
import { useCommon } from "@sincpro/mobile/entrypoints/ui/common_provider";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { MenuGrid } from "@sincpro/mobile-distribution/ui/components/organisms";
import {
  HomeProvider,
  useHome,
} from "@sincpro/mobile-distribution/ui/screens/home/home.context";
import ArrowDownIcon from "@sincpro/mobile-ui/icons/ArrowDownIcon";
import ArrowUpIcon from "@sincpro/mobile-ui/icons/ArrowUpIcon";
import BoxIcon from "@sincpro/mobile-ui/icons/BoxIcon";
import BoxTimeIcon from "@sincpro/mobile-ui/icons/BoxTimeIcon";
import CardIcon from "@sincpro/mobile-ui/icons/CardIcon";
import DuoIcon from "@sincpro/mobile-ui/icons/DuoIcon";
import OdooIcon from "@sincpro/mobile-ui/icons/OdooIcon";
import { AppBar } from "@sincpro/mobile-ui/Navigation/Navigation.AppBar";
import { useTheme } from "@sincpro/mobile-ui/theme";
import { ComponentType } from "react";
import { ScrollView, View } from "react-native";

function HomeScreenComponent() {
  const navigation = useNavigation();
  const { debugMode } = useCommon();
  const theme = useTheme();
  const isDark = theme.name.includes("dark");
  useHome();
  const handleMenuPress = (route: AppScreen) => navigation.navigate(route as never);

  const menuItems: {
    id: string;
    title: string;
    iconType?: IconType;
    onPress: () => void;
    customIcon?: ComponentType<{ size?: number; color?: string }>;
  }[] = [
    {
      id: "1",
      title: "Entregar orden",
      iconType: "custom",
      onPress: () => handleMenuPress(AppScreen.SALE_ORDER_LIST),
      customIcon: ArrowUpIcon,
    },
    {
      id: "4",
      title: "Pagar facturas",
      iconType: "custom",
      onPress: () => handleMenuPress(AppScreen.INVOICE_LIST),
      customIcon: CardIcon,
    },
    {
      id: "5",
      title: "Notas de crédito",
      iconType: "custom",
      onPress: () => handleMenuPress(AppScreen.CUSTOMER_ORDERS_LIST),
      customIcon: ArrowDownIcon,
    },
    {
      id: "6",
      title: "Productos",
      iconType: "custom",
      onPress: () => handleMenuPress(AppScreen.PRODUCT_LIST),
      customIcon: BoxIcon,
    },
    {
      id: "7",
      title: "Clientes",
      iconType: "custom",
      onPress: () => handleMenuPress(AppScreen.CUSTOMER_LIST),
      customIcon: DuoIcon,
    },
    {
      id: "8",
      title: "Eventos fallidos",
      iconType: "custom",
      onPress: () => handleMenuPress(AppScreen.DEAD_LETTER_QUEUE),
      customIcon: BoxTimeIcon,
    },
    ...(debugMode
      ? [
          {
            id: "9",
            title: "Portal Odoo",
            iconType: "custom" as IconType,
            onPress: () => handleMenuPress(AppScreen.ODOO_PORTAL),
            customIcon: OdooIcon,
          },
          {
            id: "10",
            title: "Eventos",
            iconType: "custom" as IconType,
            onPress: () => handleMenuPress(AppScreen.EVENTS),
            customIcon: BoxTimeIcon,
          },
        ]
      : []),
  ];

  return (
    <View className="flex-1">
      <AppBar
        background={
          isDark
            ? {
                colors: ["#1E3A5F", "#1D4ED8", "#2563EB"] as const,
                pattern: "grid",
                patternOpacity: 0.12,
              }
            : {
                colors: ["#1D4ED8", "#2563EB", "#3B82F6"] as const,
                pattern: "grid",
                patternOpacity: 0.08,
              }
        }
        bottomDivider="wave"
        safeArea={false}
        title="Distribución"
        topSpacing={40}
        variant="large"
      />
      <View className="flex-1">
        <ScrollView contentContainerClassName="flex-grow">
          <MenuGrid items={menuItems} />
        </ScrollView>
      </View>
    </View>
  );
}

function HomeScreen(props: any) {
  return (
    <HomeProvider {...props}>
      <HomeScreenComponent />
    </HomeProvider>
  );
}
export { HomeScreen };
