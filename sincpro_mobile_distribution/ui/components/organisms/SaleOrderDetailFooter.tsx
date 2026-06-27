import { ESaleOrderStatus, SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { createContext, ReactNode, useContext } from "react";
import { View } from "react-native";

interface SaleOrderDetailFooterContextValue {
  saleOrder: SaleOrder;
  canEdit: boolean;
  onPay?: () => void;
  onSelectInvoice?: () => void;
  onViewReceipt?: () => void;
  onDeliver?: () => void;
  onEdit?: () => void;
  onConfirmQuotation?: () => void;
}

const SaleOrderDetailFooterContext = createContext<SaleOrderDetailFooterContextValue | null>(
  null,
);

function useFooterContext() {
  const context = useContext(SaleOrderDetailFooterContext);
  if (!context) {
    throw new Error(
      "SaleOrderDetailFooter components must be used within SaleOrderDetailFooter.Root",
    );
  }
  return context;
}

interface RootProps {
  saleOrder: SaleOrder;
  canEdit?: boolean;
  onPay?: () => void;
  onSelectInvoice?: () => void;
  onViewReceipt?: () => void;
  onDeliver?: () => void;
  onEdit?: () => void;
  onConfirmQuotation?: () => void;
  children?: ReactNode;
}

function Root({
  saleOrder,
  canEdit = false,
  onPay,
  onSelectInvoice,
  onViewReceipt,
  onDeliver,
  onEdit,
  onConfirmQuotation,
  children,
}: RootProps) {
  const contextValue: SaleOrderDetailFooterContextValue = {
    saleOrder,
    canEdit,
    onPay,
    onSelectInvoice,
    onViewReceipt,
    onDeliver,
    onEdit,
    onConfirmQuotation,
  };

  const hasChildren = Boolean(children);

  return (
    <SaleOrderDetailFooterContext.Provider value={contextValue}>
      <View className="flex-col p-3 bg-bg-card border-t border-border-default gap-2">
        {hasChildren ? (
          children
        ) : (
          <>
            <Total />
            <Actions>
              <EditButton />
              <PrimaryActionButton />
            </Actions>
          </>
        )}
      </View>
    </SaleOrderDetailFooterContext.Provider>
  );
}

function Total() {
  const { saleOrder } = useFooterContext();

  const isPaid = saleOrder.isPaid;
  const displayTotal = isPaid ? saleOrder.amountTotal : saleOrder.amountResidual;
  const totalLabel = isPaid ? "Total pagado:" : "Total a pagar:";

  return (
    <View className="flex-row justify-between items-center">
      <Typography.Text semibold variant="body">
        {totalLabel}
      </Typography.Text>
      <Display.Monetary
        currencySymbol={saleOrder.currencySymbol}
        semibold
        textVariant="bodyLarge"
        value={displayTotal}
      />
    </View>
  );
}

interface ActionsProps {
  children: ReactNode;
}

function Actions({ children }: ActionsProps) {
  return <View className="flex-row gap-2">{children}</View>;
}

function PrimaryActionButton() {
  const { saleOrder, onSelectInvoice } = useFooterContext();

  if (saleOrder.isQuotation) {
    return <ConfirmQuotationButton />;
  }

  if (saleOrder.status === ESaleOrderStatus.DONE) {
    return <ViewReceiptButton />;
  }

  const isReadyOrInProgress = [
    ESaleOrderStatus.READY_TO_DELIVER,
    ESaleOrderStatus.PARTIAL,
  ].includes(saleOrder.status);

  if (isReadyOrInProgress && saleOrder.amountResidual === 0) {
    return <DeliverButton />;
  }

  const isFullyPaid = saleOrder.isPaid || saleOrder.amountResidual <= 0;

  if (isFullyPaid) {
    if (saleOrder.canViewReceipt) {
      return <ViewReceiptButton />;
    }
    return null;
  }

  if (saleOrder.needsInvoiceSelection && onSelectInvoice) {
    return <SelectInvoiceButton />;
  }

  const hasPendingAmount = saleOrder.amountResidual > 0;
  if (
    hasPendingAmount &&
    (saleOrder.canPayDirectly ||
      saleOrder.isPartiallyPaid ||
      !saleOrder.hasDisplayPostedInvoices)
  ) {
    return <PayButton />;
  }

  return null;
}

function PayButton() {
  const { onPay } = useFooterContext();

  if (!onPay) return null;

  return (
    <Form.Button
      className="flex-1"
      onPress={onPay}
      size="small"
      title="Cobrar orden"
      variant="accent"
    />
  );
}

function ConfirmQuotationButton() {
  const { onConfirmQuotation } = useFooterContext();

  if (!onConfirmQuotation) return null;

  return (
    <Form.Button
      className="flex-1"
      onPress={onConfirmQuotation}
      size="small"
      title="Confirmar cotización"
      variant="accent"
    />
  );
}

function SelectInvoiceButton() {
  const { onSelectInvoice } = useFooterContext();

  if (!onSelectInvoice) return null;

  return (
    <Form.Button
      className="flex-1"
      onPress={onSelectInvoice}
      size="small"
      title="Seleccionar factura"
      variant="accent"
    />
  );
}

function ViewReceiptButton() {
  const { saleOrder, onViewReceipt } = useFooterContext();

  if (!onViewReceipt) return null;
  if (saleOrder.status !== ESaleOrderStatus.DONE) return null;

  return (
    <Form.Button
      className="flex-1"
      onPress={onViewReceipt}
      size="small"
      title="Ver comprobante"
      variant="accent"
    />
  );
}

function DeliverButton() {
  const { saleOrder, onDeliver } = useFooterContext();

  if (!onDeliver) return null;

  const isReadyOrInProgress = [
    ESaleOrderStatus.READY_TO_DELIVER,
    ESaleOrderStatus.PARTIAL,
  ].includes(saleOrder.status);

  if (!isReadyOrInProgress || saleOrder.amountResidual > 0) return null;

  return (
    <Form.Button
      className="flex-1"
      onPress={onDeliver}
      size="small"
      title="Entregar orden"
      variant="accent"
    />
  );
}

function EditButton() {
  const { canEdit, onEdit } = useFooterContext();

  if (!canEdit || !onEdit) return null;

  return (
    <Form.Button
      className="flex-1"
      onPress={onEdit}
      size="small"
      title="Editar orden"
      variant="outline"
    />
  );
}

export const SaleOrderDetailFooter = Object.assign(Root, {
  Total,
  Actions,
  PrimaryActionButton,
  PayButton,
  ConfirmQuotationButton,
  SelectInvoiceButton,
  ViewReceiptButton,
  DeliverButton,
  EditButton,
});
