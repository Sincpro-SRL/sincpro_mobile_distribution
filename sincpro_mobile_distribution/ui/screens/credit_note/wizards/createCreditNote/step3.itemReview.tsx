import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import type { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";

import { ECreateCreditNoteStep, useCreateCreditNoteWizard } from "./context";

interface StepItemReviewProps {
  wizard: WizardContextValue;
}

export function StepItemReview({ wizard }: StepItemReviewProps) {
  const { originalOrder, currentEditingLine, updateLineQuantity, goToOverview } =
    useCreateCreditNoteWizard();

  const line = currentEditingLine;
  const originalLine = originalOrder.orderLines.find((l) => l.uuid === line?.uuid);
  const originalQuantity = originalLine?.quantity ?? 0;
  const maxQuantity = originalQuantity;
  const currencySymbol = originalOrder.currencySymbol;
  const priceUnit = line?.priceUnit ?? 0;
  const discount = line?.discount ?? 0;

  const [quantity, setQuantity] = useState(originalQuantity || 1);

  const lineTotal = useMemo(() => {
    return priceUnit * quantity * (1 - discount / 100);
  }, [priceUnit, quantity, discount]);

  const handleConfirm = useCallback(() => {
    if (!line) return;
    updateLineQuantity(line, quantity);
    goToOverview(wizard);
  }, [line, quantity, updateLineQuantity, goToOverview, wizard]);

  const handleBack = useCallback(() => {
    wizard.goToStep(ECreateCreditNoteStep.ITEM_SELECTION);
  }, [wizard]);

  const productInfoSection = useMemo(() => {
    if (!line) return null;
    return (
      <View className="p-4">
        <View className="gap-1">
          <Typography.Text numberOfLines={2} semibold variant="h4">
            {line.name}
          </Typography.Text>
          {line.productId && (
            <Typography.Text className="text-text-tertiary" variant="bodySmall">
              Código: {line.productId}
            </Typography.Text>
          )}
        </View>
      </View>
    );
  }, [line]);

  const priceSection = useMemo(() => {
    return (
      <View className="flex-row justify-between items-center p-4 bg-bg-muted rounded-xl mx-4">
        <View>
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            Precio unitario
          </Typography.Text>
          <Display.Monetary currencySymbol={currencySymbol} value={priceUnit} />
        </View>
        {discount > 0 && (
          <View>
            <Typography.Text className="text-green-500" variant="bodySmall">
              Descuento
            </Typography.Text>
            <Typography.Text className="text-green-500" semibold variant="body">
              -{discount}%
            </Typography.Text>
          </View>
        )}
      </View>
    );
  }, [priceUnit, discount, currencySymbol]);

  const quantitySection = useMemo(() => {
    return (
      <View className="p-4 gap-4">
        <View className="flex-row justify-between items-center">
          <Typography.Text semibold variant="subtitle">
            Cantidad a devolver
          </Typography.Text>
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            Máximo: {maxQuantity}
          </Typography.Text>
        </View>
        <View className="self-center">
          <Form.QuantitySelector
            max={maxQuantity}
            onChange={(value) => setQuantity(Math.max(1, value))}
            value={quantity}
          />
        </View>
        {quantity !== originalQuantity && (
          <Form.Button
            className="self-center"
            onPress={() => setQuantity(originalQuantity)}
            size="small"
            title="Restablecer cantidad original"
            variant="outline"
          />
        )}
      </View>
    );
  }, [quantity, maxQuantity, originalQuantity]);

  const impactPreviewSection = useMemo(() => {
    return (
      <View className="p-4 bg-bg-muted rounded-xl mx-4">
        <Typography.Text className="mb-3" semibold variant="subtitle">
          Vista previa de devolución
        </Typography.Text>
        <View className="flex-row justify-between items-center mb-2">
          <Typography.Text className="text-text-tertiary" variant="body">
            Cantidad original:
          </Typography.Text>
          <Typography.Text variant="body">{originalQuantity}</Typography.Text>
        </View>
        <View className="flex-row justify-between items-center mb-2">
          <Typography.Text className="text-text-tertiary" variant="body">
            Cantidad a devolver:
          </Typography.Text>
          <Typography.Text className="text-yellow-500" semibold variant="body">
            {quantity}
          </Typography.Text>
        </View>
        <View className="flex-row justify-between items-center mt-2 pt-3 border-t border-border-default">
          <Typography.Text semibold variant="body">
            Total devolución:
          </Typography.Text>
          <Display.Monetary currencySymbol={currencySymbol} value={lineTotal} />
        </View>
      </View>
    );
  }, [originalQuantity, quantity, lineTotal, currencySymbol]);

  const footerActions = useMemo(() => {
    return (
      <View className="p-4">
        <View className="flex-row gap-3">
          <Form.Button
            className="flex-[0.6]"
            onPress={handleBack}
            title="Volver"
            variant="outline"
          />
          <Form.Button
            className="flex-1"
            onPress={handleConfirm}
            title="Confirmar"
            variant="accent"
          />
        </View>
      </View>
    );
  }, [handleBack, handleConfirm]);

  if (!line) {
    return null;
  }

  return (
    <FormViewV2.Root
      description="Revisar cantidad a devolver"
      item={line}
      name="Detalle de producto"
      onBack={handleBack}
    >
      <FormViewV2.Header variant="default" />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>{productInfoSection}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{priceSection}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{quantitySection}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{impactPreviewSection}</FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>{footerActions}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
