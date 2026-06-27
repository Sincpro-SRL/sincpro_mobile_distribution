import { useNavigation } from "@react-navigation/native";
import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { InvoiceReadyToReconcileEvent } from "@sincpro/mobile-distribution/domain/invoice/events";
import { SaleOrder, SaleOrderInvoice } from "@sincpro/mobile-distribution/domain/sale_order";
import {
  SaleOrderConfirmedEvent,
  SaleOrderCreatedEvent,
  SaleOrderDeliveredEvent,
  SaleOrderUpdatedEvent,
} from "@sincpro/mobile-distribution/domain/sale_order/events";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ISaleOrderDetailContext {
  selectedSaleOrder: SaleOrder | null;
  isLoading: boolean;
  error: string | null;
  canEditSaleOrder: boolean;
  loadSaleOrder: (id: string | number) => Promise<void>;
  refreshSaleOrder: () => Promise<void>;
  reset: () => void;
  handleBack: () => void;
  handlePay: () => void;
  handleSelectInvoice: () => void;
  handleViewReceipt: () => void;
  handleViewInvoice: (invoice: SaleOrderInvoice) => Promise<void>;
  handleViewReceiptFromInvoice: (invoice: SaleOrderInvoice) => Promise<void>;
  handleDeliver: () => Promise<void>;
  handleEdit: () => void;
  handleConfirmQuotation: () => Promise<void>;
}

const SaleOrderDetailContext = createContext<ISaleOrderDetailContext | null>(null);

interface SaleOrderDetailProviderProps {
  children: React.ReactNode;
  saleOrderId?: string | number;
  initialSaleOrder?: SaleOrder;
  onBack?: () => void;
}

export function SaleOrderDetailProvider({
  children,
  saleOrderId,
  initialSaleOrder,
  onBack,
}: SaleOrderDetailProviderProps) {
  const navigation = useNavigation();
  const [selectedSaleOrder, setSelectedSaleOrder] = useState<SaleOrder | null>(
    initialSaleOrder ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEditSaleOrder = useMemo(() => {
    if (!selectedSaleOrder) return false;
    return selectedSaleOrder.canBeUpdated();
  }, [selectedSaleOrder]);

  const loadSaleOrder = useCallback(async (id: string | number) => {
    setIsLoading(true);
    setError(null);
    try {
      const saleOrder = await saleOrderService.getOrderById(id);
      setSelectedSaleOrder(saleOrder);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSaleOrder = useCallback(async () => {
    if (!selectedSaleOrder) return;

    setIsLoading(true);
    setError(null);
    try {
      const identifier = selectedSaleOrder.remoteId ?? selectedSaleOrder.uuid;
      const refreshedSaleOrder =
        await saleOrderService.refreshSaleOrderFromBackend(identifier);
      if (refreshedSaleOrder) {
        setSelectedSaleOrder(refreshedSaleOrder);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSaleOrder]);

  const reset = useCallback(() => {
    setSelectedSaleOrder(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  }, [navigation, onBack]);

  const handlePay = useCallback(() => {
    if (!selectedSaleOrder) return;
    (navigation as any).navigate(AppScreen.SALE_ORDER_PAYMENT, { order: selectedSaleOrder });
  }, [navigation, selectedSaleOrder]);

  const handleSelectInvoice = useCallback(() => {
    if (!selectedSaleOrder) return;
    (navigation as any).navigate(AppScreen.SALE_ORDER_PAYMENT, {
      order: selectedSaleOrder,
      selectInvoice: true,
    });
  }, [navigation, selectedSaleOrder]);

  const handleViewReceipt = useCallback(async () => {
    if (!selectedSaleOrder) return;
    const saleOrderInvoice = selectedSaleOrder.displayValidInvoices[0];
    if (!saleOrderInvoice?.remoteId) return;

    const invoice = await invoiceService.getInvoiceByRemoteId(saleOrderInvoice.remoteId);
    if (!invoice) return;

    (navigation as any).navigate(AppScreen.ORDER_RECEIPT, { entity: invoice });
  }, [navigation, selectedSaleOrder]);

  const handleViewInvoice = useCallback(
    async (saleOrderInvoice: SaleOrderInvoice): Promise<void> => {
      const invoice = await invoiceService.getInvoiceByRemoteId(saleOrderInvoice.remoteId!);
      if (!invoice) return;

      (navigation as any).navigate(AppScreen.INVOICE_PAYMENT, { invoice: invoice.asJSON() });
    },
    [navigation],
  );

  const handleViewReceiptFromInvoice = useCallback(
    async (saleOrderInvoice: SaleOrderInvoice): Promise<void> => {
      const invoice = await invoiceService.getInvoiceByRemoteId(saleOrderInvoice.remoteId!);
      if (!invoice) return;

      (navigation as any).navigate(AppScreen.ORDER_RECEIPT, { entity: invoice });
    },
    [navigation],
  );

  const handleDeliver = useCallback(async () => {
    if (!selectedSaleOrder) return;
    const deliveredSaleOrder = await saleOrderService.markAsDelivered(selectedSaleOrder.uuid);
    if (deliveredSaleOrder) {
      const saleOrderInvoice = selectedSaleOrder.displayValidInvoices[0];
      if (saleOrderInvoice?.remoteId) {
        const invoice = await invoiceService.getInvoiceByRemoteId(saleOrderInvoice.remoteId);
        if (invoice) {
          (navigation as any).navigate(AppScreen.ORDER_RECEIPT, { entity: invoice });
        }
      }
    }
  }, [navigation, selectedSaleOrder]);

  const handleEdit = useCallback(() => {
    if (!selectedSaleOrder) return;
    (navigation as any).navigate(AppScreen.SALE_ORDER_UPDATE, { order: selectedSaleOrder });
  }, [navigation, selectedSaleOrder]);

  const handleConfirmQuotation = useCallback(async () => {
    if (!selectedSaleOrder) return;
    setIsLoading(true);
    setError(null);
    try {
      const confirmedOrder = await saleOrderService.confirmQuotationToSaleOrder(
        selectedSaleOrder.uuid,
      );
      setSelectedSaleOrder(confirmedOrder);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSaleOrder]);

  useEffect(() => {
    if (saleOrderId && !initialSaleOrder) {
      void loadSaleOrder(saleOrderId);
    }
  }, [saleOrderId, initialSaleOrder, loadSaleOrder]);

  useEffect(() => {
    if (!selectedSaleOrder) return;

    const reloadSaleOrder = () => {
      const id = selectedSaleOrder.uuid || selectedSaleOrder.remoteId;
      if (id) {
        void loadSaleOrder(id);
      }
    };

    UIEventBus.on(InvoiceReadyToReconcileEvent.name, reloadSaleOrder);
    UIEventBus.on(SaleOrderUpdatedEvent.name, reloadSaleOrder);
    UIEventBus.on(SaleOrderDeliveredEvent.name, reloadSaleOrder);
    UIEventBus.on(SaleOrderCreatedEvent.name, reloadSaleOrder);
    UIEventBus.on(SaleOrderConfirmedEvent.name, reloadSaleOrder);

    return () => {
      UIEventBus.off(InvoiceReadyToReconcileEvent.name, reloadSaleOrder);
      UIEventBus.off(SaleOrderUpdatedEvent.name, reloadSaleOrder);
      UIEventBus.off(SaleOrderDeliveredEvent.name, reloadSaleOrder);
      UIEventBus.off(SaleOrderCreatedEvent.name, reloadSaleOrder);
      UIEventBus.off(SaleOrderConfirmedEvent.name, reloadSaleOrder);
    };
  }, [selectedSaleOrder, loadSaleOrder]);

  const value = useMemo<ISaleOrderDetailContext>(
    () => ({
      selectedSaleOrder,
      isLoading,
      error,
      canEditSaleOrder,
      loadSaleOrder,
      refreshSaleOrder,
      reset,
      handleBack,
      handlePay,
      handleSelectInvoice,
      handleViewReceipt,
      handleViewInvoice,
      handleViewReceiptFromInvoice,
      handleDeliver,
      handleEdit,
      handleConfirmQuotation,
    }),
    [
      selectedSaleOrder,
      isLoading,
      error,
      canEditSaleOrder,
      loadSaleOrder,
      refreshSaleOrder,
      reset,
      handleBack,
      handlePay,
      handleSelectInvoice,
      handleViewReceipt,
      handleViewInvoice,
      handleViewReceiptFromInvoice,
      handleDeliver,
      handleEdit,
      handleConfirmQuotation,
    ],
  );

  return (
    <SaleOrderDetailContext.Provider value={value}>
      {children}
    </SaleOrderDetailContext.Provider>
  );
}

export function useSaleOrderDetail(): ISaleOrderDetailContext {
  const context = useContext(SaleOrderDetailContext);
  if (!context) {
    throw new Error("useSaleOrderDetail must be used within SaleOrderDetailProvider");
  }
  return context;
}
