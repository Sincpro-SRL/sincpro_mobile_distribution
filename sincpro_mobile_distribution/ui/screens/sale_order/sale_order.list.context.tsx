import { useNavigation } from "@react-navigation/native";
import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { InvoiceReadyToReconcileEvent } from "@sincpro/mobile-distribution/domain/invoice/events";
import { RouteOrderCreatedFromRemoteEvent } from "@sincpro/mobile-distribution/domain/route/events";
import { ESaleOrderType, SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import {
  SaleOrderCreatedEvent,
  SaleOrderUpdatedEvent,
} from "@sincpro/mobile-distribution/domain/sale_order/events";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";
import { distributionWorkflows } from "@sincpro/mobile-distribution/services/workflows";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type SaleOrderFilterType =
  | "all"
  | ESaleOrderType.QUOTATION
  | ESaleOrderType.SALE_ORDER;

interface ISaleOrderListContext {
  saleOrders: SaleOrder[];
  isLoading: boolean;
  error: string | null;
  activeRouteId: number | null;
  filterType: SaleOrderFilterType;
  canCreateSaleOrder: boolean;
  setFilterType: (filter: SaleOrderFilterType) => void;
  loadSaleOrders: () => Promise<void>;
  searchSaleOrders: (query: string) => Promise<void>;
  refreshFromBackend: () => Promise<void>;
  clearSearch: () => Promise<void>;
  reset: () => void;
  handleSelectSaleOrder: (saleOrder: SaleOrder) => void;
  handleBack: () => void;
  handleCreateSaleOrder: () => void;
}

const SaleOrderListContext = createContext<ISaleOrderListContext | null>(null);

interface SaleOrderListProviderProps {
  children: React.ReactNode;
  orderType?: ESaleOrderType;
  onSelectSaleOrder?: (saleOrder: SaleOrder) => void;
  onBack?: () => void;
  onCreateSaleOrder?: () => void;
}

export function SaleOrderListProvider({
  children,
  orderType = ESaleOrderType.SALE_ORDER,
  onSelectSaleOrder,
  onBack,
  onCreateSaleOrder,
}: SaleOrderListProviderProps) {
  const navigation = useNavigation();
  const { activeRoute: activeRouteId } = useDistributionGlobal();
  const [allSaleOrders, setAllSaleOrders] = useState<SaleOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<SaleOrderFilterType>("all");

  const canCreateSaleOrder = activeRouteId != null;

  const filteredSaleOrders = useMemo(() => {
    if (filterType === "all") {
      return allSaleOrders;
    }
    return allSaleOrders.filter((order) => order.orderType === filterType);
  }, [allSaleOrders, filterType]);

  const loadSaleOrders = useCallback(async () => {
    if (!activeRouteId) {
      setAllSaleOrders([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await saleOrderService.getOrdersByRouteId(activeRouteId);
      setAllSaleOrders(result.toArray());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [activeRouteId]);

  const searchSaleOrders = useCallback(
    async (query: string) => {
      if (!activeRouteId) {
        setAllSaleOrders([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const searchQuery = (query ?? "").trim();
        const result = await saleOrderService.getOrdersByRouteId(activeRouteId, searchQuery);
        setAllSaleOrders(result.toArray());
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [activeRouteId],
  );

  const refreshFromBackend = useCallback(async () => {
    if (!activeRouteId) {
      setAllSaleOrders([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await distributionWorkflows.pullAndMergeRemoteOrdersWorkflow(activeRouteId);
      const result = await saleOrderService.getOrdersByRouteId(activeRouteId);
      setAllSaleOrders(result.toArray());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [activeRouteId]);

  const clearSearch = useCallback(async () => {
    await loadSaleOrders();
  }, [loadSaleOrders]);

  const reset = useCallback(() => {
    setAllSaleOrders([]);
    setIsLoading(false);
    setError(null);
    setFilterType("all");
  }, []);

  const handleSelectSaleOrder = useCallback(
    (saleOrder: SaleOrder) => {
      if (onSelectSaleOrder) {
        onSelectSaleOrder(saleOrder);
      } else {
        (navigation as any).navigate(AppScreen.SALE_ORDER_DETAIL, { saleOrder });
      }
    },
    [navigation, onSelectSaleOrder],
  );

  const handleCreateSaleOrder = useCallback(() => {
    if (onCreateSaleOrder) {
      onCreateSaleOrder();
    } else {
      navigation.navigate(AppScreen.SALE_ORDER_CREATE as never);
    }
  }, [navigation, onCreateSaleOrder]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  }, [navigation, onBack]);

  useEffect(() => {
    const reload = () => void loadSaleOrders();

    UIEventBus.on(RouteOrderCreatedFromRemoteEvent.name, reload);
    UIEventBus.on(SaleOrderCreatedEvent.name, reload);
    UIEventBus.on(InvoiceReadyToReconcileEvent.name, reload);
    UIEventBus.on(SaleOrderUpdatedEvent.name, reload);

    return () => {
      UIEventBus.off(RouteOrderCreatedFromRemoteEvent.name, reload);
      UIEventBus.off(SaleOrderCreatedEvent.name, reload);
      UIEventBus.off(InvoiceReadyToReconcileEvent.name, reload);
      UIEventBus.off(SaleOrderUpdatedEvent.name, reload);
    };
  }, [loadSaleOrders]);

  const value = useMemo<ISaleOrderListContext>(
    () => ({
      saleOrders: filteredSaleOrders,
      isLoading,
      error,
      activeRouteId,
      filterType,
      canCreateSaleOrder,
      setFilterType,
      loadSaleOrders,
      searchSaleOrders,
      refreshFromBackend,
      clearSearch,
      reset,
      handleSelectSaleOrder,
      handleBack,
      handleCreateSaleOrder,
    }),
    [
      filteredSaleOrders,
      isLoading,
      error,
      activeRouteId,
      filterType,
      canCreateSaleOrder,
      loadSaleOrders,
      searchSaleOrders,
      refreshFromBackend,
      clearSearch,
      reset,
      handleSelectSaleOrder,
      handleBack,
      handleCreateSaleOrder,
    ],
  );

  return (
    <SaleOrderListContext.Provider value={value}>{children}</SaleOrderListContext.Provider>
  );
}

export function useSaleOrderList() {
  const ctx = useContext(SaleOrderListContext);
  if (!ctx) throw new Error("useSaleOrderList must be used within SaleOrderListProvider");
  return ctx;
}
