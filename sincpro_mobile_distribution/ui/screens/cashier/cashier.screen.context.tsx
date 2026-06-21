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
import { useNavigate } from "react-router-native";

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
  const navigate = useNavigate();
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
      navigate(AppScreen.ORDER_RECEIPT, { state: { entity: report } });
    } catch (error) {
      console.error("Error generating cash closure report:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, startDateRoute, endDateRoute]);

  const handleViewHistory = useCallback(() => {
    navigate(AppScreen.CASHIER_HISTORY);
  }, [navigate]);

  const handlePaymentPress = useCallback(
    async (payment: Payment) => {
      if (!payment.paidEntity) {
        return;
      }
      navigate(AppScreen.ORDER_RECEIPT, { state: { entity: payment.paidEntity } });
    },
    [navigate],
  );

  const handleFilterByPaymentMethod = useCallback(
    (methodName: string) => {
      const filteredByMethod = payments.filter((p) => p.paymentMethod?.name === methodName);

      navigate(AppScreen.CASHIER_HISTORY, {
        state: {
          filteredPayments: filteredByMethod,
        },
      });
    },
    [navigate, payments],
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
