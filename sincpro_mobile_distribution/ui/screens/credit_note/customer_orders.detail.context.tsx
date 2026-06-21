import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import {
  CreditNoteCreatedEvent,
  CreditNotePostedEvent,
} from "@sincpro/mobile-distribution/domain/credit_note/events";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-native";

interface ICustomerOrdersDetailContext {
  customer: Customer;
  saleOrders: SaleOrder[];
  creditNotes: CreditNote[];
  selectedOrder: SaleOrder | null;
  isLoading: boolean;
  loadCustomerData: () => Promise<void>;
  refreshFromBackend: () => Promise<void>;
  fetchMoreCreditNotes: (limit?: number) => Promise<void>;
  fetchMoreSaleOrders: (limit?: number) => Promise<void>;
  reset: () => void;
  handleSelectOrder: (order: SaleOrder) => void;
  handleSelectCreditNote: (creditNote: CreditNote) => void;
  handleCreateCreditNote: () => void;
  handleBack: () => void;
}

const CustomerOrdersDetailContext = createContext<ICustomerOrdersDetailContext | null>(null);

interface CustomerOrdersDetailProviderProps {
  children: ReactNode;
  customer: Customer;
}

export function CustomerOrdersDetailProvider({
  children,
  customer,
}: CustomerOrdersDetailProviderProps) {
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const loadCustomerData = useCallback(async () => {
    if (!customer?.remoteId) {
      setSaleOrders([]);
      setCreditNotes([]);
      return;
    }

    setIsLoading(true);
    try {
      const [orders, notes] = await Promise.all([
        saleOrderService.getSaleOrdersByCustomerId(customer.remoteId),
        creditNoteService.getCreditNotesByCustomerId(customer.remoteId),
      ]);

      const paidOrdersWithInvoices = orders.filter(
        (order: SaleOrder) => order.invoiceIds && order.invoiceIds.length > 0,
      );

      setSaleOrders(paidOrdersWithInvoices.toArray());
      setCreditNotes(notes.toArray());
    } finally {
      setIsLoading(false);
    }
  }, [customer?.remoteId]);

  const refreshFromBackend = useCallback(async () => {
    if (!customer?.remoteId) return;

    setIsLoading(true);
    try {
      await Promise.all([
        saleOrderService.fetchSaleOrdersByCustomer([customer.remoteId]),
        creditNoteService.fetchCreditNotesByCustomer([customer.remoteId]),
      ]);
      await loadCustomerData();
    } finally {
      setIsLoading(false);
    }
  }, [customer?.remoteId, loadCustomerData]);

  const fetchMoreCreditNotes = useCallback(
    async (limit: number = 20) => {
      if (!customer?.remoteId) return;

      setIsLoading(true);
      try {
        await creditNoteService.fetchMoreCreditNotesByCustomer([customer.remoteId], limit);
        await loadCustomerData();
      } finally {
        setIsLoading(false);
      }
    },
    [customer?.remoteId, loadCustomerData],
  );

  const fetchMoreSaleOrders = useCallback(
    async (limit: number = 20) => {
      if (!customer?.remoteId) return;

      setIsLoading(true);
      try {
        await saleOrderService.fetchMoreSaleOrdersByCustomer([customer.remoteId], limit);
        await loadCustomerData();
      } finally {
        setIsLoading(false);
      }
    },
    [customer?.remoteId, loadCustomerData],
  );

  const reset = useCallback(() => {
    setSaleOrders([]);
    setCreditNotes([]);
    setSelectedOrder(null);
    setIsLoading(false);
  }, []);

  const handleSelectOrder = useCallback((order: SaleOrder) => {
    setSelectedOrder((prev) => (prev?.uuid === order.uuid ? null : order));
  }, []);

  const handleSelectCreditNote = useCallback(
    (creditNote: CreditNote) => {
      navigate(AppScreen.CREDIT_NOTE_DETAIL, { state: { creditNote, customer } });
    },
    [navigate, customer],
  );

  const handleCreateCreditNote = useCallback(() => {
    if (!selectedOrder || !customer) return;
    navigate(AppScreen.CREDIT_NOTE_CREATE, {
      state: { originalOrder: selectedOrder, customer },
    });
  }, [navigate, selectedOrder, customer]);

  const handleBack = useCallback(() => {
    navigate(AppScreen.CUSTOMER_ORDERS_LIST);
  }, [navigate]);

  useEffect(() => {
    const reload = () => void loadCustomerData();

    UIEventBus.on(CreditNoteCreatedEvent.name, reload);
    UIEventBus.on(CreditNotePostedEvent.name, reload);

    return () => {
      UIEventBus.off(CreditNoteCreatedEvent.name, reload);
      UIEventBus.off(CreditNotePostedEvent.name, reload);
    };
  }, [loadCustomerData]);

  const value = useMemo<ICustomerOrdersDetailContext>(
    () => ({
      customer,
      saleOrders,
      creditNotes,
      selectedOrder,
      isLoading,
      loadCustomerData,
      refreshFromBackend,
      fetchMoreCreditNotes,
      fetchMoreSaleOrders,
      reset,
      handleSelectOrder,
      handleSelectCreditNote,
      handleCreateCreditNote,
      handleBack,
    }),
    [
      customer,
      saleOrders,
      creditNotes,
      selectedOrder,
      isLoading,
      loadCustomerData,
      refreshFromBackend,
      fetchMoreCreditNotes,
      fetchMoreSaleOrders,
      reset,
      handleSelectOrder,
      handleSelectCreditNote,
      handleCreateCreditNote,
      handleBack,
    ],
  );

  return (
    <CustomerOrdersDetailContext.Provider value={value}>
      {children}
    </CustomerOrdersDetailContext.Provider>
  );
}

export function useCustomerOrdersDetail(): ICustomerOrdersDetailContext {
  const context = useContext(CustomerOrdersDetailContext);
  if (!context) {
    throw new Error(
      "useCustomerOrdersDetail must be used within CustomerOrdersDetailProvider",
    );
  }
  return context;
}
