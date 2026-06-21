import { EOrderLineOperation } from "@sincpro/mobile-distribution/domain/sale_order";
import { ProductActionFooter } from "@sincpro/mobile-distribution/ui/components/molecules";
import { ProductDetailTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ECreateOrderStep, useCreateOrderWizard } from "./context";

interface StepProductDetailProps {
  wizard: WizardContextValue;
}

export function StepProductDetail({ wizard }: StepProductDetailProps) {
  const { customer, selectedProduct, editingLine, submitProductLine, handleBackToOverview } =
    useCreateOrderWizard();

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
    handleBackToOverview();
    wizard.goToStep(ECreateOrderStep.FORM_OVERVIEW);
  }, [handleBackToOverview, wizard]);

  const handleSubmit = useCallback(() => {
    if (!selectedProduct || isBlocked) return;

    void submitProductLine({
      product: selectedProduct,
      quantity,
      effectivePrice: price,
      mode: isEditing ? EOrderLineOperation.UPDATE : EOrderLineOperation.ADD,
    });
    wizard.goToStep(ECreateOrderStep.FORM_OVERVIEW);
  }, [selectedProduct, quantity, price, isEditing, submitProductLine, wizard, isBlocked]);

  if (!selectedProduct) return null;

  return (
    <ProductDetailTemplate
      description="Configurar cantidad y precio"
      isLoading={false}
      onBack={handleBack}
      priceListId={customer?.priceListId}
      product={selectedProduct}
      title={isEditing ? "Editar Línea" : "Agregar Producto"}
    >
      <ProductDetailTemplate.Footer>
        <ProductActionFooter
          blocked={isBlocked}
          blockedMessage={blockedMessage}
          btnText={isEditing ? "Actualizar" : "Agregar al carrito"}
          editablePrice
          fractional
          maxDiscountPercent={customer?.maxDiscountApk}
          minIncrement={0.1}
          onPressButton={handleSubmit}
          onPriceChange={setPrice}
          onQuantityChange={setQuantity}
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
