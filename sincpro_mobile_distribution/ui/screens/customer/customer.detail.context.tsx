import { useNavigation } from "@react-navigation/native";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
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

interface ICustomerDetailContext {
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
  loadCustomer: (uuid: string) => Promise<void>;
  handleBack: () => void;
  handleCreateOrder: () => void;
}

const CustomerDetailContext = createContext<ICustomerDetailContext | null>(null);

interface CustomerDetailProviderProps {
  children: React.ReactNode;
  customerUuid: string;
}

export function CustomerDetailProvider({
  children,
  customerUuid,
}: CustomerDetailProviderProps) {
  const navigation = useNavigation();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async (uuid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await customerService.getCustomerByUuid(uuid);
      setCustomer(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCreateOrder = useCallback(() => {
    if (!customer) return;
    (navigation as any).navigate(AppScreen.SALE_ORDER_CREATE, { customer });
  }, [navigation, customer]);

  useEffect(() => {
    if (customerUuid) {
      loadCustomer(customerUuid);
    }
  }, [customerUuid, loadCustomer]);

  const value = useMemo<ICustomerDetailContext>(
    () => ({
      customer,
      isLoading,
      error,
      loadCustomer,
      handleBack,
      handleCreateOrder,
    }),
    [customer, isLoading, error, loadCustomer, handleBack, handleCreateOrder],
  );

  return (
    <CustomerDetailContext.Provider value={value}>{children}</CustomerDetailContext.Provider>
  );
}

export function useCustomerDetail(): ICustomerDetailContext {
  const context = useContext(CustomerDetailContext);
  if (!context) {
    throw new Error("useCustomerDetail must be used within CustomerDetailProvider");
  }
  return context;
}
