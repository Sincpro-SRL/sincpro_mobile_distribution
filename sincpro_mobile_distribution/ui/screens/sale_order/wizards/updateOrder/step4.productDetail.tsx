import { ProductActionFooter } from "@sincpro/mobile-distribution/ui/components/molecules";
import { ProductDetailTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EUpdateOrderStep, useUpdateOrderWizard } from "./context";

interface StepProductDetailProps {
  wizard: WizardContextValue;
}

export function StepProductDetail({ wizard }: StepProductDetailProps) {
  const { customer, selectedProduct, editingLine, submitProductLine, allowedOperations } =
    useUpdateOrderWizard();

  const isEditing = !!editingLine;
  const basePrice = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.resolveUnitPrice(customer?.priceListId);
  }, [selectedProduct, customer?.priceListId]);

  const [quantity, setQuantity] = useState<number>(editingLine?.quantity ?? 1);
  const [price, setPrice] = useState<number>(editingLine?.effectiveUnitPrice ?? basePrice);

  useEffect(() => {
    if (editingLine) {
      setQuantity(editingLine.quantity);
      setPrice(editingLine.effectiveUnitPrice);
    } else {
      setQuantity(1);
      setPrice(basePrice);
    }
  }, [editingLine, basePrice]);

  const isBlocked = useMemo(() => {
    if (!selectedProduct) return true;
    return !selectedProduct.hasCabysCode();
  }, [selectedProduct]);

  const blockedMessage = useMemo(() => {
    if (!selectedProduct) return "Producto no seleccionado";
    if (!selectedProduct.hasCabysCode()) return "Producto sin código CABYS";
    return undefined;
  }, [selectedProduct]);

  const handleBack = useCallback(() => {
    wizard.goToStep(EUpdateOrderStep.FORM_OVERVIEW);
  }, [wizard]);

  const handleSubmit = useCallback(() => {
    if (!selectedProduct) return;
    if (isBlocked && quantity > 0) return;

    void submitProductLine({
      product: selectedProduct,
      quantity,
      effectivePrice: price,
    });
    wizard.goToStep(EUpdateOrderStep.FORM_OVERVIEW);
  }, [selectedProduct, quantity, price, submitProductLine, wizard, isBlocked]);

  const buttonText = useMemo(() => {
    if (isEditing && quantity <= 0) return "Eliminar línea";
    return isEditing ? "Actualizar" : "Agregar";
  }, [isEditing, quantity]);

  const canRemove = allowedOperations.canRemoveLines && isEditing;

  const handleQuantityChange = useCallback(
    (qty: number) => {
      if (canRemove || qty > 0) {
        setQuantity(qty);
      }
    },
    [canRemove],
  );

  if (!selectedProduct) return null;

  return (
    <ProductDetailTemplate
      description="Modificar cantidad y precio"
      isLoading={false}
      onBack={handleBack}
      priceListId={customer?.priceListId}
      product={selectedProduct}
      title={isEditing ? "Editar Línea" : "Agregar Producto"}
    >
      <ProductDetailTemplate.Footer>
        <ProductActionFooter
          blocked={isBlocked && quantity > 0}
          blockedMessage={blockedMessage}
          btnText={buttonText}
          editablePrice
          fractional
          maxDiscountPercent={customer?.maxDiscountApk}
          minIncrement={0.1}
          onPressButton={handleSubmit}
          onPriceChange={setPrice}
          onQuantityChange={handleQuantityChange}
          originalPrice={basePrice}
          precision={2}
          price={price}
          quantity={quantity}
          titleText={isEditing ? "Total actualizado" : "Total"}
        />
      </ProductDetailTemplate.Footer>
    </ProductDetailTemplate>
  );
}
