import {
  CustomerInfoCard,
  SaleOrderCardHeader,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import {
  SaleOrderLineList,
  SaleOrderPaymentActions,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { Form } from "@sincpro/mobile-ui/Form";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import type { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useCallback, useMemo } from "react";
import { View } from "react-native";

import { useCreateCreditNoteWizard } from "./context";

interface StepOverviewProps {
  wizard: WizardContextValue;
}

export function StepOverview({ wizard }: StepOverviewProps) {
  const {
    originalOrder,
    customer,
    selectedLines,
    isLoading,
    totalToReturn,
    hasSelectedItems,
    hasAllItemsSelected,
    removeLine,
    selectAllLines,
    confirmCreditNote,
    goToItemSelection,
    handleBack,
  } = useCreateCreditNoteWizard();

  const orderHeaderSection = useMemo(() => {
    return (
      <View className="p-2">
        <SaleOrderCardHeader className="bg-bg-muted" saleOrder={originalOrder}>
          <SaleOrderCardHeader.ScheduledDate value={originalOrder.scheduledDate} />
        </SaleOrderCardHeader>
        <Typography.Text className="text-text-tertiary px-2 pt-2" variant="caption">
          Orden original para devolución
        </Typography.Text>
      </View>
    );
  }, [originalOrder]);

  const customerSection = useMemo(() => {
    if (!customer) return null;
    return <CustomerInfoCard customer={customer} />;
  }, [customer]);

  const originalLinesSection = useMemo(() => {
    return (
      <View className="py-2">
        <Typography.Text className="px-4 pb-2" semibold variant="subtitle">
          Productos de la orden original
        </Typography.Text>
        <SaleOrderLineList
          currencySymbol={originalOrder.currencySymbol}
          lines={originalOrder.orderLines}
          readonly
        />
      </View>
    );
  }, [originalOrder]);

  const selectedLinesSection = useMemo(() => {
    if (!hasSelectedItems) return null;

    return (
      <View className="py-2">
        <Typography.Text className="px-4 pb-2" semibold variant="subtitle">
          Productos a devolver ({selectedLines.length})
        </Typography.Text>
        <SaleOrderLineList
          currencySymbol={originalOrder.currencySymbol}
          lines={selectedLines}
          onDeleteLine={(line) => removeLine(line.uuid)}
        />
      </View>
    );
  }, [selectedLines, hasSelectedItems, originalOrder.currencySymbol, removeLine]);

  const handleGoToSelection = useCallback(() => {
    goToItemSelection(wizard);
  }, [goToItemSelection, wizard]);

  const footerActions = (
    <View className="p-4 gap-3">
      <SaleOrderPaymentActions.Root
        compact
        currencySymbol={originalOrder.currencySymbol}
        isLoading={isLoading}
      >
        <SaleOrderPaymentActions.InlineRow>
          <SaleOrderPaymentActions.TotalDisplay
            label="Total a devolver"
            total={totalToReturn}
          />
          <SaleOrderPaymentActions.PrimaryAction
            disabled={!hasSelectedItems}
            label="Crear Nota de Crédito"
            onPress={confirmCreditNote}
          />
        </SaleOrderPaymentActions.InlineRow>
      </SaleOrderPaymentActions.Root>

      <View className="flex-row gap-2">
        <Form.Button
          onPress={handleGoToSelection}
          size="small"
          title={hasSelectedItems ? "Agregar más productos" : "Seleccionar Productos"}
          variant="outline"
        />
        {!hasAllItemsSelected && originalOrder.orderLines.length > 0 && (
          <Form.Button
            onPress={selectAllLines}
            size="small"
            title="Todos los Productos"
            variant="outline"
          />
        )}
      </View>
    </View>
  );

  return (
    <FormViewV2.Root
      description="Seleccionar productos para devolver al cliente"
      isEmpty={!originalOrder}
      isLoading={isLoading}
      item={originalOrder}
      name="Nueva Nota de Crédito"
      onBack={handleBack}
    >
      <FormViewV2.Header variant="default" />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>{orderHeaderSection}</FormViewV2.Content.Group>
          {customerSection && (
            <FormViewV2.Content.Group>{customerSection}</FormViewV2.Content.Group>
          )}
          <FormViewV2.Content.Group>{originalLinesSection}</FormViewV2.Content.Group>
          {selectedLinesSection && (
            <FormViewV2.Content.Group>{selectedLinesSection}</FormViewV2.Content.Group>
          )}
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>{footerActions}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
