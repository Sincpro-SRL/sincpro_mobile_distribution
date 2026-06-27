import { useNavigation } from "@react-navigation/native";
import { ERemoteState } from "@sincpro/mobile/domain/entity";
import { DomainNetworkError } from "@sincpro/mobile/exceptions";
import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import {
  CreditNote,
  ECreditNotePaymentState,
} from "@sincpro/mobile-distribution/domain/credit_note";
import { CreditNoteCreatedEvent } from "@sincpro/mobile-distribution/domain/credit_note/events";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ICreditNoteDetailContext {
  creditNote: CreditNote;
  customer: Customer | null;
  isLoading: boolean;
  isPosting: boolean;
  isPaid: boolean;
  isPartial: boolean;
  isDraft: boolean;
  isPosted: boolean;
  isSynced: boolean;
  canPost: boolean;
  canPay: boolean;
  hasNumericKey: boolean;
  refreshCreditNote: () => Promise<void>;
  postCreditNote: () => Promise<void>;
  handlePayCreditNote: () => void;
  handleViewReceipt: () => void;
  handleBack: () => void;
}

const CreditNoteDetailContext = createContext<ICreditNoteDetailContext | null>(null);

interface CreditNoteDetailProviderProps {
  children: ReactNode;
  creditNote: CreditNote;
  customer: Customer | null;
}

export function CreditNoteDetailProvider({
  children,
  creditNote: initialCreditNote,
  customer,
}: CreditNoteDetailProviderProps) {
  const navigation = useNavigation();
  const { show, hide } = useConfirmationContext();
  const [creditNote, setCreditNote] = useState<CreditNote>(initialCreditNote);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const isPaid = creditNote.paymentState === ECreditNotePaymentState.PAID;
  const isPartial = creditNote.paymentState === ECreditNotePaymentState.PARTIAL;
  const isSynced = creditNote.remoteState === ERemoteState.SYNCED;
  const isDraft = creditNote.state === "draft";
  const isPosted = creditNote.state === "posted";
  const hasRemoteId = Boolean(creditNote.remoteId && creditNote.remoteId > 0);
  const canPost = hasRemoteId && isDraft;
  const canPay = hasRemoteId && !isPaid;
  const hasNumericKey = Boolean(creditNote.numericKey || creditNote.consecutiveNumber);

  const refreshCreditNote = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshed = await creditNoteService.refreshCreditNoteFromBackend(
        creditNote.remoteId || creditNote.uuid,
      );
      if (refreshed) {
        setCreditNote(CreditNote.fromJSON(refreshed));
      }
    } catch (error) {
      console.error("Error refreshing credit note:", error);
    } finally {
      setIsLoading(false);
    }
  }, [creditNote.remoteId]);

  const postCreditNote = useCallback(async () => {
    if (!creditNote.uuid) return;

    setIsPosting(true);
    try {
      const posted = await creditNoteService.postCreditNote(creditNote.uuid);
      setCreditNote(CreditNote.fromJSON(posted));

      await refreshCreditNote();
    } catch (error) {
      console.error("Error posting credit note:", error);

      const isNetworkError = error instanceof DomainNetworkError;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (isNetworkError) {
        show({
          title: "Sin conexión",
          message: `No se pudo sincronizar con el servidor.\n\n${errorMessage}\n\nLa nota de crédito se guardará localmente y se sincronizará cuando haya conexión.`,
          confirmText: "Entendido",
          cancelText: "",
          onConfirm: () => hide(),
          onCancel: () => hide(),
        });
      } else {
        show({
          title: "Error",
          message: `${errorMessage}\n\n¿Desea continuar de todas formas?`,
          confirmText: "Continuar",
          cancelText: "Cancelar",
          onConfirm: () => hide(),
          onCancel: () => hide(),
        });
      }
    } finally {
      setIsPosting(false);
    }
  }, [creditNote.uuid, show, hide, refreshCreditNote]);

  const handlePayCreditNote = useCallback(() => {
    if (!creditNote || !customer) return;

    if (isPaid) {
      (navigation as any).navigate(AppScreen.PAYMENT_HISTORY, {
        filteredPayments: creditNote.payments.toArray(),
      });
      return;
    }

    if (!hasRemoteId) {
      show({
        title: "Sincronización pendiente",
        message:
          "La nota de crédito debe sincronizarse con el servidor antes de poder procesarla. Use el botón 'Sincronizar'.",
        confirmText: "Entendido",
        cancelText: "",
        onConfirm: () => hide(),
        onCancel: () => hide(),
      });
      return;
    }

    if (isDraft) {
      show({
        title: "Publicar y pagar nota de crédito",
        message:
          "Esta nota de crédito está en borrador. Al procesar el pago, se publicará automáticamente y luego se procesará la devolución. ¿Desea continuar?",
        confirmText: "Continuar",
        cancelText: "Cancelar",
        onConfirm: () => {
          hide();
          (navigation as any).navigate(AppScreen.CREDIT_NOTE_PAYMENT, {
            creditNote,
            customer,
            payments: [],
          });
        },
        onCancel: () => hide(),
      });
      return;
    }

    (navigation as any).navigate(AppScreen.CREDIT_NOTE_PAYMENT, {
      creditNote,
      customer,
      payments: [],
    });
  }, [creditNote, customer, isPaid, isDraft, hasRemoteId, navigation, show, hide]);

  const handleViewReceipt = useCallback(() => {
    if (!creditNote) return;

    if (!creditNote.numericKey && !creditNote.consecutiveNumber) {
      show({
        title: "No disponible",
        message:
          "No se puede imprimir el ticket. La nota de crédito necesita sincronizarse con el servidor para obtener la clave numérica electrónica.",
        confirmText: "Entendido",
        cancelText: "",
        onConfirm: () => hide(),
        onCancel: () => hide(),
      });
      return;
    }

    (navigation as any).navigate(AppScreen.ORDER_RECEIPT, { entity: creditNote });
  }, [creditNote, navigation, show, hide]);

  const handleBack = useCallback(() => {
    if (customer) {
      (navigation as any).navigate(AppScreen.CUSTOMER_ORDERS_DETAIL, { customer });
    } else {
      navigation.navigate(AppScreen.CUSTOMER_ORDERS_LIST as never);
    }
  }, [customer, navigation]);

  useEffect(() => {
    if (initialCreditNote) {
      creditNoteService
        .getCreditNoteById(initialCreditNote.uuid || initialCreditNote.remoteId!)
        .then((updatedCreditNote) => {
          if (updatedCreditNote) {
            setCreditNote(updatedCreditNote);
          }
        });
    }
  }, []);

  useEffect(() => {
    if (!creditNote) return;

    const loadCreditNote = () => {
      const id = creditNote.uuid || creditNote.remoteId;
      if (id) {
        creditNoteService.getCreditNoteById(id).then((updatedCreditNote) => {
          if (updatedCreditNote) {
            setCreditNote(updatedCreditNote);
          }
        });
      }
    };

    UIEventBus.on(CreditNoteCreatedEvent.name, loadCreditNote);

    return () => {
      UIEventBus.off(CreditNoteCreatedEvent.name, loadCreditNote);
    };
  }, [creditNote, refreshCreditNote]);

  const value = useMemo<ICreditNoteDetailContext>(
    () => ({
      creditNote,
      customer,
      isLoading,
      isPosting,
      isPaid,
      isPartial,
      isDraft,
      isPosted,
      isSynced,
      canPost,
      canPay,
      hasNumericKey,
      refreshCreditNote,
      postCreditNote,
      handlePayCreditNote,
      handleViewReceipt,
      handleBack,
    }),
    [
      creditNote,
      customer,
      isLoading,
      isPosting,
      isPaid,
      isPartial,
      isDraft,
      isPosted,
      isSynced,
      canPost,
      canPay,
      hasNumericKey,
      refreshCreditNote,
      postCreditNote,
      handlePayCreditNote,
      handleViewReceipt,
      handleBack,
    ],
  );

  return (
    <CreditNoteDetailContext.Provider value={value}>
      {children}
    </CreditNoteDetailContext.Provider>
  );
}

export function useCreditNoteDetail(): ICreditNoteDetailContext {
  const context = useContext(CreditNoteDetailContext);
  if (!context) {
    throw new Error("useCreditNoteDetail must be used within CreditNoteDetailProvider");
  }
  return context;
}
