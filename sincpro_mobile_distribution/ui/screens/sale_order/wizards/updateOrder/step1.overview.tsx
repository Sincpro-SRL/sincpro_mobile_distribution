import { SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";
import { SaleOrderUpdateActions } from "@sincpro/mobile-distribution/ui/components/molecules";
import { SaleOrderFormEditable } from "@sincpro/mobile-distribution/ui/components/templates";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";

import { EUpdateOrderStep, useUpdateOrderWizard } from "./context";

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
    saveChanges,
    cancelChanges,
    allowedOperations,
  } = useUpdateOrderWizard();

  function handleEditLine(line: SaleOrderLine): void {
    startEditingOrderLine(line);
    wizard.goToStep(EUpdateOrderStep.PRODUCT_LINE_DETAIL);
  }

  function handleDeleteLine(line: SaleOrderLine): void {
    removeOrderLine(line.id);
  }

  function handleCustomerSelect(): void {
    wizard.goToStep(EUpdateOrderStep.CUSTOMER_SELECTION);
  }

  return (
    <SaleOrderFormEditable
      allowedOperations={{
        canChangeCustomer: allowedOperations.canChangeCustomer,
        canAddLines: allowedOperations.canAddLines,
        canRemoveLines: allowedOperations.canRemoveLines,
        canEditLines:
          allowedOperations.canModifyQuantities || allowedOperations.canModifyPrices,
      }}
      customer={customer}
      description="Editar productos y cantidades"
      footer={
        <SaleOrderUpdateActions
          isLoading={isLoading}
          onCancel={cancelChanges}
          onSave={saveChanges}
        />
      }
      isLoading={isLoading}
      onBack={cancelChanges}
      onCustomerSelect={
        allowedOperations.canChangeCustomer ? handleCustomerSelect : undefined
      }
      onDeleteLine={allowedOperations.canRemoveLines ? handleDeleteLine : undefined}
      onEditLine={handleEditLine}
      onProductSelect={() => wizard.goToStep(EUpdateOrderStep.PRODUCT_CATALOG)}
      order={order}
      title="Modificar Orden"
    />
  );
}
