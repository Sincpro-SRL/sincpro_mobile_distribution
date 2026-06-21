import type { IPaymentMethod, Payment } from "@sincpro/mobile-distribution/domain/payment";
import {
  EPaymentTargetType,
  EPaymentType,
} from "@sincpro/mobile-distribution/domain/payment";
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
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-native";

interface IPaymentHistoryContext {
  payments: Payment[];
  isLoading: boolean;
  filterTargetType?: EPaymentTargetType;
  filterPaymentType?: EPaymentType;

  refreshPayments: () => Promise<void>;
  refreshFromBackend: () => Promise<void>;
  filterByPaymentMethod: (paymentMethod: IPaymentMethod) => void;
  clearFilter: () => void;
  handlePaymentPress: (payment: Payment) => void;
  handleBack: () => void;
  formatDate: (date: string) => string;
}

const PaymentHistoryContext = createContext<IPaymentHistoryContext | null>(null);

interface PaymentHistoryProviderProps {
  children: ReactNode;
}

export function PaymentHistoryProvider({ children }: PaymentHistoryProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { formatDate } = useDistributionGlobal();

  const filterTargetType = (location.state?.targetType as EPaymentTargetType) || undefined;
  const filterPaymentType = (location.state?.paymentType as EPaymentType) || undefined;
  const preFilteredPayments = (location.state?.filteredPayments as Payment[]) || undefined;

  const [payments, setPayments] = useState<Payment[]>(preFilteredPayments || []);
  const [isLoading, setIsLoading] = useState(!preFilteredPayments);

  const refreshPayments = useCallback(async () => {
    if (preFilteredPayments && preFilteredPayments.length > 0) {
      setPayments(preFilteredPayments);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let fetchedPayments = await paymentService.getPaymentForActiveRoute();

      if (filterPaymentType) {
        fetchedPayments = fetchedPayments.filter((p) => p.paymentType === filterPaymentType);
      }

      if (filterTargetType) {
        fetchedPayments = fetchedPayments.filter((p) => p.targetType === filterTargetType);
      }

      setPayments(fetchedPayments.toArray());
    } finally {
      setIsLoading(false);
    }
  }, [filterTargetType, filterPaymentType, preFilteredPayments]);

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
    if (!preFilteredPayments || preFilteredPayments.length === 0) {
      refreshPayments();
    }
  }, []);

  const filterByPaymentMethod = useCallback(
    async (paymentMethod: IPaymentMethod) => {
      setIsLoading(true);
      try {
        let result = await paymentService.getPaymentsByMethod(paymentMethod.name);

        if (filterPaymentType) {
          result = result.filter((p) => p.paymentType === filterPaymentType);
        }

        if (filterTargetType) {
          result = result.filter((p) => p.targetType === filterTargetType);
        }

        setPayments(result.toArray());
      } finally {
        setIsLoading(false);
      }
    },
    [filterTargetType, filterPaymentType],
  );

  const clearFilter = useCallback(async () => {
    setIsLoading(true);
    try {
      let fetchedPayments = await paymentService.getPaymentForActiveRoute();

      if (filterPaymentType) {
        fetchedPayments = fetchedPayments.filter((p) => p.paymentType === filterPaymentType);
      }

      if (filterTargetType) {
        fetchedPayments = fetchedPayments.filter((p) => p.targetType === filterTargetType);
      }

      setPayments(fetchedPayments.toArray());
    } finally {
      setIsLoading(false);
    }
  }, [filterTargetType, filterPaymentType]);

  const handlePaymentPress = useCallback(
    async (payment: Payment) => {
      if (!payment.paidEntity) {
        return;
      }
      navigate(AppScreen.ORDER_RECEIPT, { state: { entity: payment.paidEntity } });
    },
    [navigate],
  );

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const value: IPaymentHistoryContext = {
    payments,
    isLoading,
    filterTargetType,
    filterPaymentType,
    refreshPayments,
    refreshFromBackend,
    filterByPaymentMethod,
    clearFilter,
    handlePaymentPress,
    handleBack,
    formatDate,
  };

  return (
    <PaymentHistoryContext.Provider value={value}>{children}</PaymentHistoryContext.Provider>
  );
}

export function usePaymentHistory(): IPaymentHistoryContext {
  const context = useContext(PaymentHistoryContext);
  if (!context) {
    throw new Error("usePaymentHistory must be used within PaymentHistoryProvider");
  }
  return context;
}
