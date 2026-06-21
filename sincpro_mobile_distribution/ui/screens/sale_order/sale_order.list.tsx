import { ESaleOrderType, SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { SaleOrderRow } from "@sincpro/mobile-distribution/ui/components/organisms";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { theme } from "@sincpro/mobile-ui/theme";
import { tv } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useEffect } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

import {
  SaleOrderFilterType,
  SaleOrderListProvider,
  useSaleOrderList,
} from "./sale_order.list.context";

const filterChip = tv({
  base: "px-4 py-2 rounded-full border",
  variants: {
    active: {
      true: "bg-primary border-primary",
      false: "bg-bg-muted border-border-default",
    },
  },
  defaultVariants: { active: false },
});

const filterChipText = tv({
  base: "text-sm",
  variants: {
    active: {
      true: "text-text-inverse font-semibold",
      false: "text-text-tertiary",
    },
  },
  defaultVariants: { active: false },
});

interface SaleOrderListScreenProps {
  orderType?: ESaleOrderType;
  onSelectSaleOrder?: (saleOrder: SaleOrder) => void;
  onBack?: () => void;
  onCreateSaleOrder?: () => void;
}

function SaleOrderListScreenComponent() {
  const {
    saleOrders,
    isLoading,
    filterType,
    canCreateSaleOrder,
    setFilterType,
    loadSaleOrders,
    searchSaleOrders,
    refreshFromBackend,
    reset,
    handleSelectSaleOrder,
    handleBack,
    handleCreateSaleOrder,
  } = useSaleOrderList();

  useEffect(() => {
    loadSaleOrders();
    return () => reset();
  }, [loadSaleOrders, reset]);

  const filterOptions: { label: string; value: SaleOrderFilterType }[] = [
    { label: "Todos", value: "all" },
    { label: "Cotizaciones", value: ESaleOrderType.QUOTATION },
    { label: "Órdenes", value: ESaleOrderType.SALE_ORDER },
  ];

  return (
    <ListViewV2.Root
      description="Seleccione una orden de la lista"
      isLoading={isLoading}
      items={saleOrders}
      name="Órdenes"
      onBack={handleBack}
      onRefresh={refreshFromBackend}
      onSearch={searchSaleOrders}
      withContainer={false}
    >
      <ListViewV2.Header variant={EVariantScreenHeader.ROUNDED_HEADER}>
        <ListViewV2.Header.Search />
        <ListViewV2.Header.Actions>
          <View className="flex-row gap-2 mt-3">
            <Form.Button
              className="flex-1 h-9"
              icon={
                <Display.Icon
                  color={theme.text.inverse}
                  name="refresh"
                  size={16}
                  type="simplelineicons"
                />
              }
              onPress={refreshFromBackend}
              size="small"
              title="Actualizar"
              variant="transparent"
            />
            <Form.Button
              className="flex-1 h-9"
              disabled={!canCreateSaleOrder}
              icon={
                <Display.Icon
                  color={theme.text.inverse}
                  name="plus"
                  size={16}
                  type="antdesign"
                />
              }
              onPress={handleCreateSaleOrder}
              size="small"
              title="Crear orden"
              variant="transparent"
            />
          </View>
        </ListViewV2.Header.Actions>
      </ListViewV2.Header>

      <View className="bg-bg-card py-3 border-b border-border-default">
        <ScrollView
          contentContainerClassName="px-4 gap-2 flex-row"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {filterOptions.map((option) => {
            const isActive = filterType === option.value;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                className={filterChip({ active: isActive })}
                key={option.value}
                onPress={() => setFilterType(option.value)}
              >
                <Typography.Text className={filterChipText({ active: isActive })}>
                  {isActive ? "• " : ""}
                  {option.label}
                </Typography.Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ListViewV2.Content withMargin={false}>
        {(saleOrder: SaleOrder) => (
          <SaleOrderRow
            onPress={() => handleSelectSaleOrder(saleOrder)}
            readonly={!canCreateSaleOrder}
            saleOrder={saleOrder}
          />
        )}
      </ListViewV2.Content>
    </ListViewV2.Root>
  );
}

export function SaleOrderListScreen(props: SaleOrderListScreenProps) {
  return (
    <SaleOrderListProvider {...props}>
      <SaleOrderListScreenComponent />
    </SaleOrderListProvider>
  );
}
