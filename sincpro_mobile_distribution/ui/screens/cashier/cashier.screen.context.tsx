import { useNavigation } from "@react-navigation/native";
import { groupBy } from "@sincpro/mobile/tools/utils/collections";
import type { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";
import { distributionSettingFeature } from "@sincpro/mobile-distribution/services/settings.feature";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ICashierScreenContext {
  payments: Payment[];
  groupedPayments: Record<string, Payment[]>;
  totalAmount: number;
  isLoading: boolean;
  openedAt?: string;
  closedAt?: string;

  refreshPayments: () => Promise<void>;
  refreshFromBackend: () => Promise<void>;
  handleCloseCashRegister: () => Promise<void>;
  handleGenerateReport: () => Promise<void>;
  handleViewHistory: () => void;
  handlePaymentPress: (payment: Payment) => void;
  handleFilterByPaymentMethod: (methodName: string) => void;
  formatDate: (date: string, options?: { showTime?: boolean }) => string;
}

const CashierScreenContext = createContext<ICashierScreenContext | null>(null);

interface CashierScreenProviderProps {
  children: ReactNode;
}

export function CashierScreenProvider({ children }: CashierScreenProviderProps) {
  const { startDateRoute, endDateRoute, loadSettings, formatDate } = useDistributionGlobal();
  const navigation = useNavigation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPayments = await paymentService.getPaymentForActiveRoute();
      setPayments(fetchedPayments.toArray());
      await loadSettings();
    } finally {
      setIsLoading(false);
    }
  }, [loadSettings]);

  const refreshFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const routeId = await distributionSettingFeature.getActiveRoute();
      if (routeId) {
        await paymentService.pullAndMergeOdooPaymentsByRouteID(routeId);
        await paymentService.pullAndMergeCreditPaymentsByRouteID(routeId);
      }
      await refreshPayments();
    } finally {
      setIsLoading(false);
    }
  }, [refreshPayments]);

  useEffect(() => {
    refreshPayments();
  }, []);

  const groupedPayments = useMemo(() => {
    return groupBy(payments, (payment) => payment.paymentMethod?.name || "Sin método");
  }, [payments]);

  const totalAmount = useMemo(() => {
    return payments.reduce((acc, payment) => acc + payment.value, 0);
  }, [payments]);

  const handleCloseCashRegister = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement closePayments in new service
      await refreshPayments();
    } finally {
      setIsLoading(false);
    }
  }, [refreshPayments]);

  const handleGenerateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const report = await paymentService.generateCashClosureReport(
        startDateRoute ?? undefined,
        endDateRoute ?? undefined,
      );
      (navigation as any).navigate(AppScreen.ORDER_RECEIPT as never, { entity: report });
    } catch (error) {
      console.error("Error generating cash closure report:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigation, startDateRoute, endDateRoute]);

  const handleViewHistory = useCallback(() => {
    (navigation as any).navigate(AppScreen.CASHIER_HISTORY as never);
  }, [navigation]);

  const handlePaymentPress = useCallback(
    async (payment: Payment) => {
      if (!payment.paidEntity) {
        return;
      }
      (navigation as any).navigate(AppScreen.ORDER_RECEIPT as never, {
        entity: payment.paidEntity,
      });
    },
    [navigation],
  );

  const handleFilterByPaymentMethod = useCallback(
    (methodName: string) => {
      const filteredByMethod = payments.filter((p) => p.paymentMethod?.name === methodName);

      (navigation as any).navigate(AppScreen.CASHIER_HISTORY as never, {
        filteredPayments: filteredByMethod,
      });
    },
    [navigation, payments],
  );

  const value: ICashierScreenContext = {
    payments,
    groupedPayments,
    totalAmount,
    isLoading,
    openedAt: startDateRoute ?? undefined,
    closedAt: endDateRoute ?? undefined,
    refreshPayments,
    refreshFromBackend,
    handleCloseCashRegister,
    handleGenerateReport,
    handleViewHistory,
    handlePaymentPress,
    handleFilterByPaymentMethod,
    formatDate,
  };

  return (
    <CashierScreenContext.Provider value={value}>{children}</CashierScreenContext.Provider>
  );
}

export function useCashierScreen(): ICashierScreenContext {
  const context = useContext(CashierScreenContext);
  if (!context) {
    throw new Error("useCashierScreen must be used within CashierScreenProvider");
  }
  return context;
}
