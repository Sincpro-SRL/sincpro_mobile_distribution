import { DomainNetworkError } from "@sincpro/mobile/exceptions";
import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-native";

export enum EPayCreditNoteStep {
  PAYMENT_SETUP = "PAYMENT_SETUP",
  MULTIPLE_PAYMENTS = "MULTIPLE_PAYMENTS",
}

export enum EPaymentMode {
  SINGLE = "SINGLE",
  MULTIPLE = "MULTIPLE",
}

interface IPayCreditNoteWizardContext {
  creditNote: CreditNote;
  customer: Customer | null;
  payments: Payment[];
  paymentMode: EPaymentMode;
  isLoading: boolean;
  currencySymbol: string;
  totalToPay: number;
  totalPaid: number;
  remainingToPay: number;

  setPayments: (payments: Payment[]) => void;
  setPaymentMode: (mode: EPaymentMode) => void;
  addPayment: (payment: Payment) => void;
  removePayment: (paymentId: string) => void;
  handleConfirmPayment: () => Promise<void>;
  handleBackToOverview: () => void;
  goToMultiplePayments: (wizard: { goToStep: (step: EPayCreditNoteStep) => void }) => void;
  goBackToOverview: (wizard: { goToStep: (step: EPayCreditNoteStep) => void }) => void;
}

const PayCreditNoteWizardContext = createContext<IPayCreditNoteWizardContext | null>(null);

interface PayCreditNoteWizardProviderProps {
  children: ReactNode;
  creditNote: CreditNote;
  customer: Customer | null;
  initialPayments?: Payment[];
}

export function PayCreditNoteWizardProvider({
  children,
  creditNote,
  customer,
  initialPayments = [],
}: PayCreditNoteWizardProviderProps) {
  const navigate = useNavigate();
  const { show, hide } = useConfirmationContext();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [paymentMode, setPaymentMode] = useState<EPaymentMode>(EPaymentMode.SINGLE);
  const [isLoading, setIsLoading] = useState(false);

  const currencySymbol = creditNote.currencySymbol || "₡";
  const totalToPay = creditNote.amountResidual || 0;

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.total, 0);
  }, [payments]);

  const remainingToPay = totalToPay - totalPaid;

  const addPayment = useCallback((payment: Payment) => {
    setPayments((prev) => [...prev, payment]);
  }, []);

  const removePayment = useCallback((paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.uuid !== paymentId));
  }, []);

  const handleConfirmPayment = useCallback(async (): Promise<void> => {
    if (!payments || payments.length === 0 || !creditNote.uuid) {
      return;
    }

    setIsLoading(true);
    try {
      await creditNoteService.payCreditNote(creditNote.uuid, payments);
      navigate(AppScreen.PAYMENT_HISTORY, { replace: true });
    } catch (error) {
      console.error("Error processing credit note payment:", error);

      const isNetworkError = error instanceof DomainNetworkError;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (isNetworkError) {
        show({
          title: "Sin conexión",
          message: `No se pudo sincronizar con el servidor.\n\n${errorMessage}\n\n¿Desea continuar en modo offline?`,
          confirmText: "Continuar Offline",
          cancelText: "Cancelar",
          onConfirm: () => {
            hide();
            navigate(AppScreen.PAYMENT_HISTORY, { replace: true });
          },
          onCancel: () => hide(),
        });
      } else {
        show({
          title: "Error",
          message: `${errorMessage}\n\n¿Desea continuar de todas formas?`,
          confirmText: "Continuar",
          cancelText: "Cancelar",
          onConfirm: () => {
            hide();
            navigate(AppScreen.PAYMENT_HISTORY, { replace: true });
          },
          onCancel: () => hide(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [creditNote.uuid, payments, navigate, show, hide]);

  const handleBackToOverview = useCallback((): void => {
    navigate(-1);
  }, [navigate]);

  const goToMultiplePayments = useCallback(
    (wizard: { goToStep: (step: EPayCreditNoteStep) => void }): void => {
      setPaymentMode(EPaymentMode.MULTIPLE);
      wizard.goToStep(EPayCreditNoteStep.MULTIPLE_PAYMENTS);
    },
    [],
  );

  const goBackToOverview = useCallback(
    (wizard: { goToStep: (step: EPayCreditNoteStep) => void }): void => {
      wizard.goToStep(EPayCreditNoteStep.PAYMENT_SETUP);
    },
    [],
  );

  const value = useMemo<IPayCreditNoteWizardContext>(
    () => ({
      creditNote,
      customer,
      payments,
      paymentMode,
      isLoading,
      currencySymbol,
      totalToPay,
      totalPaid,
      remainingToPay,
      setPayments,
      setPaymentMode,
      addPayment,
      removePayment,
      handleConfirmPayment,
      handleBackToOverview,
      goToMultiplePayments,
      goBackToOverview,
    }),
    [
      creditNote,
      customer,
      payments,
      paymentMode,
      isLoading,
      currencySymbol,
      totalToPay,
      totalPaid,
      remainingToPay,
      addPayment,
      removePayment,
      handleConfirmPayment,
      handleBackToOverview,
      goToMultiplePayments,
      goBackToOverview,
    ],
  );

  return (
    <PayCreditNoteWizardContext.Provider value={value}>
      {children}
    </PayCreditNoteWizardContext.Provider>
  );
}

export function usePayCreditNoteWizard(): IPayCreditNoteWizardContext {
  const context = useContext(PayCreditNoteWizardContext);
  if (!context) {
    throw new Error("usePayCreditNoteWizard must be used within PayCreditNoteWizardProvider");
  }
  return context;
}
