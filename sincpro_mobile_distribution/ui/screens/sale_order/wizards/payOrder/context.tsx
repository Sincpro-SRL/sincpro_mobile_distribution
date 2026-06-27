import { StackActions, useNavigation, useRoute } from "@react-navigation/native";
import { DomainNetworkError } from "@sincpro/mobile/exceptions";
import type { IAuthorizedPerson } from "@sincpro/mobile-distribution/domain/customer/credit";
import { EDocumentType } from "@sincpro/mobile-distribution/domain/electronic_invoice/document_type";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";
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

export enum EPayOrderStep {
  PAYMENT_SETUP = "PAYMENT_SETUP",
  MULTIPLE_PAYMENTS = "MULTIPLE_PAYMENTS",
}

export enum EPaymentMode {
  SINGLE = "SINGLE",
  MULTIPLE = "MULTIPLE",
}

interface IPayOrderWizardContext {
  order: SaleOrder | null;
  payments: Payment[];
  documentType: EDocumentType;
  selectedAuthorizedPerson: IAuthorizedPerson | undefined;
  paymentMode: EPaymentMode;
  isLoading: boolean;
  hasError: boolean;
  isCreditPayment: boolean;
  amountDiscount: number;

  setPayments: (payments: Payment[]) => void;
  setDocumentType: (type: EDocumentType) => void;
  setSelectedAuthorizedPerson: (person: IAuthorizedPerson | undefined) => void;
  setPaymentMode: (mode: EPaymentMode) => void;
  addPayment: (payment: Payment) => void;
  removePayment: (paymentId: string) => void;
  handleConfirmPayment: () => Promise<void>;
  handleBackToOverview: () => void;
  goToMultiplePayments: () => void;
  retryFetchOrder: () => void;
}

const PayOrderWizardContext = createContext<IPayOrderWizardContext | null>(null);

interface PayOrderWizardProviderProps {
  children: ReactNode;
}

export function PayOrderWizardProvider({ children }: PayOrderWizardProviderProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const { show, hide } = useConfirmationContext();
  const routeParams = route.params as any as
    | { order?: SaleOrder; documentType?: EDocumentType; id?: string }
    | undefined;

  const [order, setOrder] = useState<SaleOrder | null>(routeParams?.order || null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documentType, setDocumentType] = useState<EDocumentType>(
    routeParams?.documentType || EDocumentType.FACTURA_ELECTRONICA,
  );
  const [selectedAuthorizedPerson, setSelectedAuthorizedPerson] =
    useState<IAuthorizedPerson>();
  const [paymentMode, setPaymentMode] = useState<EPaymentMode>(EPaymentMode.SINGLE);
  const [isLoading, setIsLoading] = useState(!order);
  const [hasError, setHasError] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (order || !routeParams?.id) return;

    setIsLoading(true);
    setHasError(false);
    try {
      const fetchedOrder = await saleOrderService.getOrderById(routeParams.id);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [order, routeParams?.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (routeParams?.order) {
      saleOrderService.getOrderById(routeParams.order.uuid).then((updatedOrder) => {
        if (updatedOrder) {
          setOrder(updatedOrder);
        }
      });
    }
  }, []);

  const amountDiscount = useMemo(() => {
    if (!order) return 0;
    return typeof (order as any).getTotalDiscount === "function"
      ? (order as any).getTotalDiscount()
      : 0;
  }, [order]);

  const isCreditPayment = useMemo(() => {
    if (!payments || payments.length === 0) return false;
    return payments[0].isCreditPayment === true;
  }, [payments]);

  const addPayment = useCallback((payment: Payment) => {
    setPayments((prev) => [...prev, payment]);
  }, []);

  const removePayment = useCallback((paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.uuid !== paymentId));
  }, []);

  const handleConfirmPayment = useCallback(async (): Promise<void> => {
    if (!order || !payments || payments.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      let paidOrder: SaleOrder;

      if (isCreditPayment) {
        if (!order.customer) {
          throw new Error(
            "No se ha encontrado información del cliente para el pago a crédito",
          );
        }

        if (
          !order.customer.availableCredit ||
          order.customer.availableCredit < order.amountResidual
        ) {
          throw new Error(
            `Crédito insuficiente. Disponible: ₡${order.customer.availableCredit || 0}, Requerido: ₡${order.amountResidual}`,
          );
        }

        paidOrder = await saleOrderService.payOrderWithCredit(
          order.uuid,
          order.customer,
          documentType,
          selectedAuthorizedPerson,
        );
      } else {
        paidOrder = await saleOrderService.payOrder(
          order.uuid,
          payments,
          documentType,
          amountDiscount,
        );
      }

      if (!paidOrder) {
        return;
      }

      const invoice = paidOrder.saleOrderInvoices.last();
      if (!invoice) {
        console.error("No invoice found after payment");
        return;
      }

      navigation.dispatch(StackActions.replace(AppScreen.ORDER_RECEIPT, { entity: invoice }));
    } catch (error) {
      console.error("Error processing payment:", error);

      const isNetworkError = error instanceof DomainNetworkError;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (isNetworkError) {
        const refreshedOrder = await saleOrderService.getOrderById(order.uuid);
        const invoice = refreshedOrder?.saleOrderInvoices?.last();

        show({
          title: "Sin conexión",
          message: `No se pudo sincronizar con el servidor.\n\n${errorMessage}\n\n¿Desea continuar en modo offline e imprimir el recibo?`,
          confirmText: "Continuar Offline",
          cancelText: "Cancelar",
          onConfirm: () => {
            hide();
            if (invoice) {
              navigation.dispatch(
                StackActions.replace(AppScreen.ORDER_RECEIPT, { entity: invoice }),
              );
            }
          },
          onCancel: () => hide(),
        });
      } else {
        const refreshedOrder = await saleOrderService.getOrderById(order.uuid);
        const invoice = refreshedOrder?.saleOrderInvoices?.last();

        show({
          title: "Error",
          message: `${errorMessage}\n\n¿Desea continuar de todas formas?`,
          confirmText: "Continuar",
          cancelText: "Cancelar",
          onConfirm: () => {
            hide();
            if (invoice) {
              navigation.dispatch(
                StackActions.replace(AppScreen.ORDER_RECEIPT, { entity: invoice }),
              );
            }
          },
          onCancel: () => hide(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    order,
    payments,
    selectedAuthorizedPerson,
    amountDiscount,
    isCreditPayment,
    documentType,
    navigation,
    show,
    hide,
  ]);

  const handleBackToOverview = useCallback((): void => {
    if (payments.length > 1) {
      setPaymentMode(EPaymentMode.MULTIPLE);
    } else {
      setPaymentMode(EPaymentMode.SINGLE);
    }
  }, [payments.length]);

  const goToMultiplePayments = useCallback((): void => {
    if (isCreditPayment) {
      return;
    }
    setPaymentMode(EPaymentMode.MULTIPLE);
  }, [isCreditPayment]);

  const retryFetchOrder = useCallback(() => {
    setOrder(null);
    setHasError(false);
    fetchOrder();
  }, [fetchOrder]);

  const value: IPayOrderWizardContext = useMemo(
    () => ({
      order,
      payments,
      documentType,
      selectedAuthorizedPerson,
      paymentMode,
      isLoading,
      hasError,
      isCreditPayment,
      amountDiscount,
      setPayments,
      setDocumentType,
      setSelectedAuthorizedPerson,
      setPaymentMode,
      addPayment,
      removePayment,
      handleConfirmPayment,
      handleBackToOverview,
      goToMultiplePayments,
      retryFetchOrder,
    }),
    [
      order,
      payments,
      documentType,
      selectedAuthorizedPerson,
      paymentMode,
      isLoading,
      hasError,
      isCreditPayment,
      amountDiscount,
      addPayment,
      removePayment,
      handleConfirmPayment,
      handleBackToOverview,
      goToMultiplePayments,
      retryFetchOrder,
    ],
  );

  return (
    <PayOrderWizardContext.Provider value={value}>{children}</PayOrderWizardContext.Provider>
  );
}

export function usePayOrderWizard(): IPayOrderWizardContext {
  const context = useContext(PayOrderWizardContext);
  if (!context) {
    throw new Error("usePayOrderWizard must be used within PayOrderWizardProvider");
  }
  return context;
}
