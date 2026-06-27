import { ESaleOrderType, SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { SaleOrderRow } from "@sincpro/mobile-distribution/ui/components/organisms";
import { AppBar } from "@sincpro/mobile-ui/Navigation/Navigation.AppBar";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { useEffect } from "react";

import {
  SaleOrderFilterType,
  SaleOrderListProvider,
  useSaleOrderList,
} from "./sale_order.list.context";

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
      <ListViewV2.Header
        actions={
          <>
            <AppBar.Action icon="refresh" onDark onPress={refreshFromBackend} />
            {canCreateSaleOrder && (
              <AppBar.Action
                icon="add"
                onDark
                onPress={handleCreateSaleOrder}
                tone="tinted"
              />
            )}
          </>
        }
        background={{
          colors: ["#1D4ED8", "#2563EB", "#3B82F6"] as const,
          pattern: "grid",
          patternOpacity: 0.08,
        }}
        variant="large"
      >
        <ListViewV2.Header.Search />
        <ListViewV2.Header.Segmented
          onChange={setFilterType}
          options={filterOptions}
          value={filterType}
        />
      </ListViewV2.Header>

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
