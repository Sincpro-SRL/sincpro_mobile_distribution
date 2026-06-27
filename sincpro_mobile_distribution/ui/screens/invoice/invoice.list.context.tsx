import { StackActions, useNavigation } from "@react-navigation/native";
import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { CustomerCreatedEvent } from "@sincpro/mobile-distribution/domain/customer/events";
import type { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { InvoiceReadyToReconcileEvent } from "@sincpro/mobile-distribution/domain/invoice/events";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface IInvoiceCustomerListContext {
  customers: Customer[];
  isLoading: boolean;
  loadCustomers: () => Promise<void>;
  searchCustomers: (query: string) => void;
  refreshFromBackend: () => Promise<void>;
  reset: () => void;
  handleSelectCustomer: (customer: Customer) => void;
  handleBack: () => void;
}

const InvoiceCustomerListContext = createContext<IInvoiceCustomerListContext | null>(null);

interface InvoiceCustomerListProviderProps {
  children: ReactNode;
}

export function InvoiceCustomerListProvider({ children }: InvoiceCustomerListProviderProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const allInvoices = await invoiceService.getAllInvoices();

      if (allInvoices.isEmpty) {
        setCustomers([]);
        return;
      }

      const customerIds = [
        ...new Set(allInvoices.mapToArray((inv: Invoice) => inv.customerId)),
      ];
      const allCustomers = await customerService.getAllCustomers();
      const customersWithInvoices = allCustomers.filter((c) =>
        customerIds.includes(c.remoteId!),
      );
      setCustomers(customersWithInvoices.toArray());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const q = (query ?? "").trim();
      const allInvoices = await invoiceService.getAllInvoices();

      if (allInvoices.isEmpty) {
        setCustomers([]);
        return;
      }

      const customerIds = [
        ...new Set(allInvoices.mapToArray((inv: Invoice) => inv.customerId)),
      ];
      const result = q
        ? await customerService.searchCustomers(q)
        : await customerService.getAllCustomers();

      const customersWithInvoices = result.filter((c) => customerIds.includes(c.remoteId!));
      setCustomers(customersWithInvoices.toArray());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const allCustomers = await customerService.getAllCustomers();
      const customerIds = allCustomers
        .filter((c) => c.remoteId != null)
        .mapToArray((c) => c.remoteId!);

      if (customerIds.length > 0) {
        await invoiceService.fetchNotPaidInvoicesByCustomer(customerIds);
      }

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
      (navigation as any).navigate(AppScreen.INVOICE_DETAIL, { customer });
    },
    [navigation],
  );

  const handleBack = useCallback(() => {
    navigation.dispatch(StackActions.popToTop());
  }, [navigation]);

  useEffect(() => {
    const reload = () => void loadCustomers();

    UIEventBus.on(CustomerCreatedEvent.name, reload);
    UIEventBus.on(InvoiceReadyToReconcileEvent.name, reload);

    return () => {
      UIEventBus.off(CustomerCreatedEvent.name, reload);
      UIEventBus.off(InvoiceReadyToReconcileEvent.name, reload);
    };
  }, [loadCustomers]);

  const value = useMemo<IInvoiceCustomerListContext>(
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
    <InvoiceCustomerListContext.Provider value={value}>
      {children}
    </InvoiceCustomerListContext.Provider>
  );
}

export function useInvoiceCustomerList(): IInvoiceCustomerListContext {
  const context = useContext(InvoiceCustomerListContext);
  if (!context) {
    throw new Error("useInvoiceCustomerList must be used within InvoiceCustomerListProvider");
  }
  return context;
}
