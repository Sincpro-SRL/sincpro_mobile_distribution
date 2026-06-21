import { RemoteEntityCollection } from "@sincpro/mobile/domain/entity";
import { DomainNetworkError } from "@sincpro/mobile/exceptions";
import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { SaleOrder, SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { creditNoteService } from "@sincpro/mobile-distribution/services/credit_note.service";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-native";

export enum ECreateCreditNoteStep {
  OVERVIEW = "OVERVIEW",
  ITEM_SELECTION = "ITEM_SELECTION",
  ITEM_REVIEW = "ITEM_REVIEW",
}

interface ICreateCreditNoteWizardContext {
  originalOrder: SaleOrder;
  customer: Customer | null;
  selectedLines: SaleOrderLine[];
  currentEditingLine: SaleOrderLine | null;
  isLoading: boolean;
  totalToReturn: number;
  hasSelectedItems: boolean;
  hasAllItemsSelected: boolean;

  selectLine: (line: SaleOrderLine) => void;
  updateLineQuantity: (line: SaleOrderLine, quantity: number) => void;
  removeLine: (lineId: string) => void;
  selectAllLines: () => void;
  setCurrentEditingLine: (line: SaleOrderLine | null) => void;
  confirmCreditNote: () => Promise<void>;
  goToItemSelection: (wizard: { goToStep: (step: ECreateCreditNoteStep) => void }) => void;
  goToItemReview: (wizard: { goToStep: (step: ECreateCreditNoteStep) => void }) => void;
  goToOverview: (wizard: { goToStep: (step: ECreateCreditNoteStep) => void }) => void;
  handleBack: () => void;
}

const CreateCreditNoteWizardContext = createContext<ICreateCreditNoteWizardContext | null>(
  null,
);

interface CreateCreditNoteWizardProviderProps {
  children: ReactNode;
  originalOrder: SaleOrder;
  customer: Customer | null;
}

export function CreateCreditNoteWizardProvider({
  children,
  originalOrder,
  customer,
}: CreateCreditNoteWizardProviderProps) {
  const navigate = useNavigate();
  const { show, hide } = useConfirmationContext();
  const [selectedLines, setSelectedLines] = useState<SaleOrderLine[]>([]);
  const [currentEditingLine, setCurrentEditingLine] = useState<SaleOrderLine | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const totalToReturn = useMemo(() => {
    return selectedLines.reduce(
      (sum, line) => sum + line.priceUnit * line.quantity * (1 - (line.discount || 0) / 100),
      0,
    );
  }, [selectedLines]);

  const hasSelectedItems = selectedLines.length > 0;
  const hasAllItemsSelected =
    originalOrder.orderLines.length > 0 &&
    selectedLines.length === originalOrder.orderLines.length;

  const selectLine = useCallback((line: SaleOrderLine) => {
    setSelectedLines((prev) => {
      const existingIndex = prev.findIndex((l) => l.uuid === line.uuid);
      if (existingIndex >= 0) {
        return prev;
      }
      return [...prev, line];
    });
  }, []);

  const updateLineQuantity = useCallback((line: SaleOrderLine, quantity: number) => {
    setSelectedLines((prev) => {
      const existingIndex = prev.findIndex((l) => l.uuid === line.uuid);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = SaleOrderLine.fromJSON<SaleOrderLine>({
          ...line,
          quantity,
        });
        return updated;
      }
      const newLine = SaleOrderLine.fromJSON<SaleOrderLine>({ ...line, quantity });
      return [...prev, newLine];
    });
  }, []);

  const removeLine = useCallback((lineUuid: string) => {
    setSelectedLines((prev) => prev.filter((l) => l.uuid !== lineUuid));
  }, []);

  const selectAllLines = useCallback(() => {
    show({
      title: "Devolver Todos los Productos",
      message: "¿Está seguro que desea devolver todos los productos de esta orden?",
      confirmText: "Todos",
      cancelText: "Cancelar",
      onConfirm: () => {
        hide();
        setSelectedLines([...originalOrder.orderLines]);
      },
      onCancel: () => hide(),
    });
  }, [originalOrder.orderLines, show, hide, setSelectedLines]);

  const confirmCreditNote = useCallback(async () => {
    if (selectedLines.length === 0) {
      show({
        title: "Error",
        message: "Debe seleccionar al menos un producto para devolver",
        confirmText: "Entendido",
        cancelText: "",
        onConfirm: () => hide(),
        onCancel: () => hide(),
      });
      return;
    }

    show({
      title: "Confirmar Nota de Crédito",
      message: "¿Está seguro que desea crear esta nota de crédito?",
      confirmText: "Crear",
      cancelText: "Cancelar",
      onConfirm: async () => {
        hide();
        setIsLoading(true);
        try {
          const newCreditNote = CreditNote.createFromOriginalOrder(
            originalOrder,
            selectedLines,
          );

          const creditNotes = await creditNoteService.createLocalCreditNote(
            new RemoteEntityCollection([newCreditNote]),
          );

          const createdCreditNote = creditNotes.first();

          navigate(AppScreen.CREDIT_NOTE_DETAIL, {
            state: { creditNote: createdCreditNote, customer },
            replace: true,
          });
        } catch (error) {
          console.error("Error creating credit note:", error);

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
                navigate(AppScreen.CUSTOMER_ORDERS_DETAIL, {
                  state: { customer },
                  replace: true,
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
                navigate(AppScreen.CUSTOMER_ORDERS_DETAIL, {
                  state: { customer },
                  replace: true,
                });
              },
              onCancel: () => hide(),
            });
          }
        } finally {
          setIsLoading(false);
        }
      },
      onCancel: () => hide(),
    });
  }, [selectedLines, originalOrder, customer, navigate, show, hide]);

  const goToItemSelection = useCallback(
    (wizard: { goToStep: (step: ECreateCreditNoteStep) => void }) => {
      wizard.goToStep(ECreateCreditNoteStep.ITEM_SELECTION);
    },
    [],
  );

  const goToItemReview = useCallback(
    (wizard: { goToStep: (step: ECreateCreditNoteStep) => void }) => {
      wizard.goToStep(ECreateCreditNoteStep.ITEM_REVIEW);
    },
    [],
  );

  const goToOverview = useCallback(
    (wizard: { goToStep: (step: ECreateCreditNoteStep) => void }) => {
      setCurrentEditingLine(null);
      wizard.goToStep(ECreateCreditNoteStep.OVERVIEW);
    },
    [setCurrentEditingLine],
  );

  const handleBack = useCallback(() => {
    navigate(AppScreen.CUSTOMER_ORDERS_DETAIL, { state: { customer } });
  }, [navigate, customer]);

  const value = useMemo<ICreateCreditNoteWizardContext>(
    () => ({
      originalOrder,
      customer,
      selectedLines,
      currentEditingLine,
      isLoading,
      totalToReturn,
      hasSelectedItems,
      hasAllItemsSelected,
      selectLine,
      updateLineQuantity,
      removeLine,
      selectAllLines,
      setCurrentEditingLine,
      confirmCreditNote,
      goToItemSelection,
      goToItemReview,
      goToOverview,
      handleBack,
    }),
    [
      originalOrder,
      customer,
      selectedLines,
      currentEditingLine,
      isLoading,
      totalToReturn,
      hasSelectedItems,
      hasAllItemsSelected,
      selectLine,
      updateLineQuantity,
      removeLine,
      selectAllLines,
      confirmCreditNote,
      goToItemSelection,
      goToItemReview,
      goToOverview,
      handleBack,
    ],
  );

  return (
    <CreateCreditNoteWizardContext.Provider value={value}>
      {children}
    </CreateCreditNoteWizardContext.Provider>
  );
}

export function useCreateCreditNoteWizard(): ICreateCreditNoteWizardContext {
  const context = useContext(CreateCreditNoteWizardContext);
  if (!context) {
    throw new Error(
      "useCreateCreditNoteWizard must be used within CreateCreditNoteWizardProvider",
    );
  }
  return context;
}
