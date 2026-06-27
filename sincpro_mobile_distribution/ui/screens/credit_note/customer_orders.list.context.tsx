import { StackActions, useNavigation } from "@react-navigation/native";
import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { CreditNoteCreatedEvent } from "@sincpro/mobile-distribution/domain/credit_note/events";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { CustomerCreatedEvent } from "@sincpro/mobile-distribution/domain/customer/events";
import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
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

interface ICustomerOrdersListContext {
  customers: Customer[];
  isLoading: boolean;
  loadCustomers: () => Promise<void>;
  searchCustomers: (query: string) => void;
  refreshFromBackend: () => Promise<void>;
  reset: () => void;
  handleSelectCustomer: (customer: Customer) => void;
  handleBack: () => void;
}

const CustomerOrdersListContext = createContext<ICustomerOrdersListContext | null>(null);

interface CustomerOrdersListProviderProps {
  children: ReactNode;
}

export function CustomerOrdersListProvider({ children }: CustomerOrdersListProviderProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const allOrders = await saleOrderService.getAllSaleOrders();
      const orderWithValidInvoices = allOrders.filter(
        (order: SaleOrder) =>
          order.invoiceIds && order.invoiceIds.length > 0 && order.hasDisplayPostedInvoices,
      );

      if (orderWithValidInvoices.isEmpty) {
        setCustomers([]);
        return;
      }

      const customerIds = [
        ...new Set(orderWithValidInvoices.mapToArray((order: SaleOrder) => order.customerId)),
      ];
      const allCustomers = await customerService.getAllCustomers();
      const customersWithOrders = allCustomers.filter((c) =>
        customerIds.includes(c.remoteId!),
      );
      setCustomers(customersWithOrders.toArray());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const q = (query ?? "").trim();
      const allOrders = await saleOrderService.getAllSaleOrders();
      const paidOrders = allOrders.filter(
        (order: SaleOrder) =>
          order.invoiceIds && order.invoiceIds.length > 0 && order.paymentState === "paid",
      );

      if (paidOrders.isEmpty) {
        setCustomers([]);
        return;
      }

      const customerIds = [
        ...new Set(paidOrders.mapToArray((order: SaleOrder) => order.customerId)),
      ];
      const result = q
        ? await customerService.searchCustomers(q)
        : await customerService.getAllCustomers();

      const customersWithOrders = result.filter((c) => customerIds.includes(c.remoteId!));
      setCustomers(customersWithOrders.toArray());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      await customerService.pullAndMergeCustomersFromBackend();
      await loadCustomers();
    } finally {
      setIsLoading(false);
    }
  }, [loadCustomers]);

  const reset = useCallback(() => {
    setCustomers([]);
    setIsLoading(false);
  }, []);

  const navigation = useNavigation();

  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      (navigation as any).navigate(AppScreen.CUSTOMER_ORDERS_DETAIL, { customer });
    },
    [navigation],
  );

  const handleBack = useCallback(() => {
    navigation.dispatch(StackActions.popToTop());
  }, [navigation]);

  useEffect(() => {
    const reload = () => void loadCustomers();

    UIEventBus.on(CustomerCreatedEvent.name, reload);
    UIEventBus.on(CreditNoteCreatedEvent.name, reload);

    return () => {
      UIEventBus.off(CustomerCreatedEvent.name, reload);
      UIEventBus.off(CreditNoteCreatedEvent.name, reload);
    };
  }, [loadCustomers]);

  const value = useMemo<ICustomerOrdersListContext>(
    () => ({
      customers,
      isLoading,
      loadCustomers,
      searchCustomers,
      refreshFromBackend,
      reset,
      handleSelectCustomer,
      handleBack,
    }),
    [
      customers,
      isLoading,
      loadCustomers,
      searchCustomers,
      refreshFromBackend,
      reset,
      handleSelectCustomer,
      handleBack,
    ],
  );

  return (
    <CustomerOrdersListContext.Provider value={value}>
      {children}
    </CustomerOrdersListContext.Provider>
  );
}

export function useCustomerOrdersList(): ICustomerOrdersListContext {
  const context = useContext(CustomerOrdersListContext);
  if (!context) {
    throw new Error("useCustomerOrdersList must be used within CustomerOrdersListProvider");
  }
  return context;
}
