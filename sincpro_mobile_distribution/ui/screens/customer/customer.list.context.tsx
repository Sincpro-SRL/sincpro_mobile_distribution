import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import {
  CustomerCreatedEvent,
  CustomersFetchedEvent,
} from "@sincpro/mobile-distribution/domain/customer/events";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-native";

export type CustomerCreditFilter = "all" | "with_credit" | "without_credit";

interface ICustomerListContext {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  filterType: CustomerCreditFilter;
  setFilterType: (filter: CustomerCreditFilter) => void;
  loadCustomers: () => Promise<void>;
  searchCustomers: (q: string) => void;
  refreshFromBackend: () => Promise<void>;
  clearSearch: () => Promise<void>;
  reset: () => void;
  handleSelectCustomer: (customer: Customer) => void;
  handleViewDetail: (customer: Customer) => void;
  handleCreateCustomer: () => void;
  handleBack: () => void;
}

const CustomerListContext = createContext<ICustomerListContext | null>(null);

export function CustomerListProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<CustomerCreditFilter>("all");

  const filteredCustomers = useMemo(() => {
    if (filterType === "all") {
      return allCustomers;
    }
    if (filterType === "with_credit") {
      return allCustomers.filter((c) => c.availableCredit > 0);
    }
    return allCustomers.filter((c) => c.availableCredit <= 0);
  }, [allCustomers, filterType]);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await customerService.getAllCustomers();
      setAllCustomers(result.toArray());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchCustomers = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = (q ?? "").trim();
      const result = query
        ? await customerService.searchCustomers(query)
        : await customerService.getAllCustomers();
      setAllCustomers(result.toArray());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFromBackend = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await customerService.pullAndMergeCustomersFromBackend();
      await loadCustomers();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [loadCustomers]);

  const clearSearch = useCallback(async () => {
    await loadCustomers();
  }, [loadCustomers]);

  const reset = useCallback(() => {
    setAllCustomers([]);
    setIsLoading(false);
    setError(null);
    setFilterType("all");
  }, []);

  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      navigate(AppScreen.SALE_ORDER_CREATE, { state: { customer } });
    },
    [navigate],
  );

  const handleViewDetail = useCallback(
    (customer: Customer) => {
      navigate(AppScreen.CUSTOMER_DETAIL, { state: { customer } });
    },
    [navigate],
  );

  const handleCreateCustomer = useCallback(() => {
    navigate(AppScreen.CUSTOMER_CREATE);
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate(AppScreen.MAIN);
  }, [navigate]);

  useEffect(() => {
    const reload = () => void loadCustomers();

    UIEventBus.on(CustomersFetchedEvent.name, reload);
    UIEventBus.on(CustomerCreatedEvent.name, reload);

    return () => {
      UIEventBus.off(CustomersFetchedEvent.name, reload);
      UIEventBus.off(CustomerCreatedEvent.name, reload);
    };
  }, [loadCustomers]);

  const value = useMemo<ICustomerListContext>(
    () => ({
      customers: filteredCustomers,
      isLoading,
      error,
      filterType,
      setFilterType,
      loadCustomers,
      searchCustomers,
      refreshFromBackend,
      clearSearch,
      reset,
      handleSelectCustomer,
      handleViewDetail,
      handleCreateCustomer,
      handleBack,
    }),
    [
      filteredCustomers,
      isLoading,
      error,
      filterType,
      loadCustomers,
      searchCustomers,
      refreshFromBackend,
      clearSearch,
      reset,
      handleSelectCustomer,
      handleViewDetail,
      handleCreateCustomer,
      handleBack,
    ],
  );

  return (
    <CustomerListContext.Provider value={value}>{children}</CustomerListContext.Provider>
  );
}

export function useCustomerList() {
  const ctx = useContext(CustomerListContext);
  if (!ctx) throw new Error("useCustomerList must be used within CustomerListProvider");
  return ctx;
}
