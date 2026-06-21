import { DomainNetworkError } from "@sincpro/mobile/exceptions";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";
import { paymentService } from "@sincpro/mobile-distribution/services/payment.service";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-native";

export enum EPayInvoiceStep {
  PAYMENT_SETUP = "PAYMENT_SETUP",
  MULTIPLE_PAYMENTS = "MULTIPLE_PAYMENTS",
}

export enum EPaymentMode {
  SINGLE = "SINGLE",
  MULTIPLE = "MULTIPLE",
}

interface IPayInvoiceWizardContext {
  invoice: Invoice | null;
  payments: Payment[];
  paymentMode: EPaymentMode;
  isLoading: boolean;
  currencySymbol: string;
  isDraft: boolean;
  isPosted: boolean;
  hasCredit: boolean;
  hasPenalization: boolean;
  isPenalizationMode: boolean;

  setPayments: (payments: Payment[]) => void;
  setPaymentMode: (mode: EPaymentMode) => void;
  addPayment: (payment: Payment) => void;
  removePayment: (paymentId: string) => void;
  refreshInvoice: () => Promise<void>;
  handleConfirmPayment: () => Promise<void>;
  handlePayPenalization: () => Promise<void>;
  handlePostInvoice: () => Promise<void>;
  handleConfirmAndPostInvoice: () => void;
  handleBackToOverview: () => void;
  handleViewReceipt: () => void;
  handleViewPaymentHistory: () => void;
  goToMultiplePayments: (wizard: { goToStep: (step: EPayInvoiceStep) => void }) => void;
  goBackToOverview: (wizard: { goToStep: (step: EPayInvoiceStep) => void }) => void;
}

const PayInvoiceWizardContext = createContext<IPayInvoiceWizardContext | null>(null);

interface PayInvoiceWizardProviderProps {
  children: ReactNode;
}

export function PayInvoiceWizardProvider({ children }: PayInvoiceWizardProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { show, hide } = useConfirmationContext();
  const locationState = location.state as { invoice?: Invoice } | undefined;

  const [invoice, setInvoice] = useState<Invoice | null>(
    locationState?.invoice ? Invoice.fromJSON(locationState.invoice) : null,
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMode, setPaymentMode] = useState<EPaymentMode>(EPaymentMode.SINGLE);
  const [isLoading, setIsLoading] = useState(false);

  const currencySymbol = useMemo(() => {
    return invoice?.currencySymbol || "₡";
  }, [invoice]);

  const isDraft = useMemo(() => {
    return invoice?.isDraft() ?? false;
  }, [invoice]);

  const isPosted = useMemo(() => {
    return invoice?.isPosted() ?? false;
  }, [invoice]);

  const hasCredit = useMemo(() => {
    return invoice?.hasCredit ?? false;
  }, [invoice]);

  const hasPenalization = useMemo(() => {
    return (invoice?.penalizationAmount ?? 0) > 0;
  }, [invoice]);

  const isPenalizationMode = useMemo(() => {
    return hasPenalization && !isLoading;
  }, [hasPenalization, isLoading]);

  const addPayment = useCallback((payment: Payment) => {
    setPayments((prev) => [...prev, payment]);
  }, []);

  const removePayment = useCallback((paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.uuid !== paymentId));
  }, []);

  const refreshInvoice = useCallback(async () => {
    if (!invoice?.remoteId) return;

    setIsLoading(true);
    try {
      await invoiceService.refreshInvoicesFromBackend([invoice.remoteId]);
      const updated = await invoiceService.getInvoiceByRemoteId(invoice.remoteId);
      if (updated) {
        setInvoice(updated);
      }
    } finally {
      setIsLoading(false);
    }
  }, [invoice?.remoteId]);

  const handlePostInvoice = useCallback(async (): Promise<void> => {
    if (!invoice) return;

    setIsLoading(true);
    try {
      const postedInvoice = await invoiceService.postInvoice(invoice.uuid);
      setInvoice(postedInvoice);

      if (postedInvoice.remoteId) {
        await refreshInvoice();
      }
    } catch (error) {
      console.error("Error posting invoice:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      show({
        title: "❌ Error al publicar",
        message: `No se pudo publicar la factura.\n\n${errorMessage}`,
        confirmText: "Entendido",
        onConfirm: () => hide(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [invoice, refreshInvoice, show, hide]);

  const handleConfirmAndPostInvoice = useCallback((): void => {
    if (!invoice) return;

    show({
      title: "Confirmar publicación",
      message: `¿Está seguro de publicar la factura ${invoice.name || "esta factura"}?\n\nUna vez publicada, no se podrá modificar.`,
      confirmText: "Publicar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        hide();
        await handlePostInvoice();
      },
      onCancel: () => hide(),
    });
  }, [invoice, show, hide, handlePostInvoice]);

  const handleConfirmPayment = useCallback(async (): Promise<void> => {
    if (!payments || payments.length === 0 || !invoice) {
      return;
    }

    setIsLoading(true);
    try {
      const paidInvoice = await invoiceService.payInvoice(invoice.uuid, payments);
      navigate(AppScreen.ORDER_RECEIPT, {
        replace: true,
        state: { entity: paidInvoice },
      });
    } catch (error) {
      console.error("Error processing invoice payment:", error);

      const isNetworkError = error instanceof DomainNetworkError;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (isNetworkError) {
        show({
          title: "⚠️ Sin conexión",
          message: `No se pudo sincronizar con el servidor.\n\n${errorMessage}\n\n¿Desea continuar en modo offline?`,
          confirmText: "Continuar Offline",
          cancelText: "Cancelar",
          onConfirm: () => {
            hide();
            navigate(AppScreen.ORDER_RECEIPT, {
              replace: true,
              state: { entity: invoice },
            });
          },
          onCancel: () => hide(),
        });
      } else {
        show({
          title: "❌ Error",
          message: `${errorMessage}\n\n¿Desea continuar de todas formas?`,
          confirmText: "Continuar",
          cancelText: "Cancelar",
          onConfirm: () => {
            hide();
            navigate(AppScreen.ORDER_RECEIPT, {
              replace: true,
              state: { entity: invoice },
            });
          },
          onCancel: () => hide(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [invoice, payments, navigate, show, hide]);

  const handlePayPenalization = useCallback(async (): Promise<void> => {
    if (!payments || payments.length === 0 || !invoice) {
      return;
    }

    setIsLoading(true);
    try {
      const firstPayment = payments[0];
      firstPayment.targetUUID = invoice.uuid;
      firstPayment.targetRemoteId = invoice.remoteId ?? undefined;

      await paymentService.payPenalization(firstPayment);

      const refreshedInvoice = await invoiceService.refreshInvoiceFromBackend(invoice.uuid);
      if (refreshedInvoice) {
        setInvoice(refreshedInvoice);
      }

      setPayments([]);

      show({
        title: "Penalización pagada",
        message:
          "La penalización ha sido pagada exitosamente. Ahora puede proceder a pagar la factura.",
        confirmText: "Entendido",
        onConfirm: () => hide(),
      });
    } catch (error) {
      console.error("Error paying penalization:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      show({
        title: "Error al pagar penalización",
        message: `No se pudo procesar el pago de la penalización.\n\n${errorMessage}`,
        confirmText: "Entendido",
        onConfirm: () => hide(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [invoice, payments, show, hide]);

  const handleBackToOverview = useCallback((): void => {
    navigate(-1);
  }, [navigate]);

  const handleViewReceipt = useCallback((): void => {
    if (!invoice) return;
    navigate(AppScreen.ORDER_RECEIPT, {
      replace: true,
      state: { entity: invoice },
    });
  }, [invoice, navigate]);

  const handleViewPaymentHistory = useCallback((): void => {
    if (!invoice?.payments || invoice.payments.isEmpty) return;
    const invoicePayments = invoice.payments.toArray();
    navigate(AppScreen.CASHIER_HISTORY, {
      replace: true,
      state: { filteredPayments: invoicePayments },
    });
  }, [invoice, navigate]);

  const goToMultiplePayments = useCallback(
    (wizard: { goToStep: (step: EPayInvoiceStep) => void }): void => {
      setPaymentMode(EPaymentMode.MULTIPLE);
      wizard.goToStep(EPayInvoiceStep.MULTIPLE_PAYMENTS);
    },
    [setPaymentMode],
  );

  const goBackToOverview = useCallback(
    (wizard: { goToStep: (step: EPayInvoiceStep) => void }): void => {
      wizard.goToStep(EPayInvoiceStep.PAYMENT_SETUP);
    },
    [],
  );

  const value: IPayInvoiceWizardContext = useMemo(
    () => ({
      invoice,
      payments,
      paymentMode,
      isLoading,
      currencySymbol,
      isDraft,
      isPosted,
      hasCredit,
      hasPenalization,
      isPenalizationMode,
      setPayments,
      setPaymentMode,
      addPayment,
      removePayment,
      refreshInvoice,
      handleConfirmPayment,
      handlePayPenalization,
      handlePostInvoice,
      handleConfirmAndPostInvoice,
      handleBackToOverview,
      handleViewReceipt,
      handleViewPaymentHistory,
      goToMultiplePayments,
      goBackToOverview,
    }),
    [
      invoice,
      payments,
      paymentMode,
      isLoading,
      currencySymbol,
      isDraft,
      isPosted,
      hasCredit,
      hasPenalization,
      isPenalizationMode,
      addPayment,
      removePayment,
      refreshInvoice,
      handleConfirmPayment,
      handlePayPenalization,
      handlePostInvoice,
      handleConfirmAndPostInvoice,
      handleBackToOverview,
      handleViewReceipt,
      handleViewPaymentHistory,
      goToMultiplePayments,
      goBackToOverview,
    ],
  );

  return (
    <PayInvoiceWizardContext.Provider value={value}>
      {children}
    </PayInvoiceWizardContext.Provider>
  );
}

export function usePayInvoiceWizard(): IPayInvoiceWizardContext {
  const context = useContext(PayInvoiceWizardContext);
  if (!context) {
    throw new Error("usePayInvoiceWizard must be used within PayInvoiceWizardProvider");
  }
  return context;
}
