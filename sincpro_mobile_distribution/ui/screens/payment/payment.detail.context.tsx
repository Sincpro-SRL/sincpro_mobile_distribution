import { useRoute } from "@react-navigation/native";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface IPaymentDetailContext {
  payment: Payment | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  onBack?: () => void;
}

const PaymentDetailContext = createContext<IPaymentDetailContext | null>(null);

interface PaymentDetailProviderProps {
  children: React.ReactNode;
  paymentId?: string;
  initialPayment?: Payment;
  onBack?: () => void;
}

export function PaymentDetailProvider({
  children,
  paymentId,
  initialPayment,
  onBack,
}: PaymentDetailProviderProps) {
  const route = useRoute();
  const navigationPayment = (route.params as any)?.payment as Payment | undefined;
  const navigationPaymentId = (route.params as any)?.paymentId as string | undefined;
  const rawPayment = initialPayment ?? navigationPayment;
  const rawPaymentId = paymentId ?? navigationPaymentId;

  const [payment, setPayment] = useState<Payment | null>(rawPayment ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayment = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await paymentService.getPaymentById(id);
      setPayment(loaded);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!payment?.uuid) return;
    await loadPayment(payment.uuid);
  }, [payment, loadPayment]);

  useEffect(() => {
    if (!payment && rawPaymentId) {
      void loadPayment(rawPaymentId);
    }
  }, [payment, rawPaymentId, loadPayment]);

  const value = useMemo<IPaymentDetailContext>(
    () => ({
      payment,
      isLoading,
      error,
      refresh,
      onBack,
    }),
    [payment, isLoading, error, refresh, onBack],
  );

  return (
    <PaymentDetailContext.Provider value={value}>{children}</PaymentDetailContext.Provider>
  );
}

export function usePaymentDetail(): IPaymentDetailContext {
  const context = useContext(PaymentDetailContext);
  if (!context) {
    throw new Error("usePaymentDetail must be used within PaymentDetailProvider");
  }
  return context;
}
