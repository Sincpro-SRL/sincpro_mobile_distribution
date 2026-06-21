import { SaleOrderCreateActions } from "@sincpro/mobile-distribution/ui/components/molecules";
import { SaleOrderFormEditable } from "@sincpro/mobile-distribution/ui/components/templates";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";

import { ECreateOrderStep, useCreateOrderWizard } from "./context";

interface StepOverviewProps {
  wizard: WizardContextValue;
}

export function StepOverview({ wizard }: StepOverviewProps) {
  const {
    order,
    customer,
    isLoading,
    startEditingOrderLine,
    removeOrderLine,
    handleConfirmAndCharge,
    handleSaveAsQuote,
    handleExitWizard,
  } = useCreateOrderWizard();

  const canSubmit = !!customer && order.orderLines.length > 0;

  return (
    <SaleOrderFormEditable
      allowedOperations={{
        canChangeCustomer: true,
        canAddLines: true,
        canRemoveLines: true,
        canEditLines: true,
      }}
      customer={customer}
      description="Cotización o pedido de productos"
      footer={
        <SaleOrderCreateActions
          isLoading={isLoading}
          onConfirmAndCharge={handleConfirmAndCharge}
          onSaveAsQuote={handleSaveAsQuote}
          readonly={!canSubmit}
        />
      }
      isLoading={isLoading}
      onBack={handleExitWizard}
      onCustomerSelect={() => wizard.goToStep(ECreateOrderStep.CUSTOMER_SELECTION)}
      onDeleteLine={removeOrderLine}
      onEditLine={(line) => {
        startEditingOrderLine(line);
        wizard.goToStep(ECreateOrderStep.PRODUCT_LINE_DETAIL);
      }}
      onProductSelect={() => wizard.goToStep(ECreateOrderStep.PRODUCT_CATALOG)}
      order={order}
      title="Nueva Orden"
    />
  );
}
