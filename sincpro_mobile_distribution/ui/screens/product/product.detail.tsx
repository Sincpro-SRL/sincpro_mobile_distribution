import { useRoute } from "@react-navigation/native";
import { Product } from "@sincpro/mobile-distribution/domain/product";
import { ProductActionFooter } from "@sincpro/mobile-distribution/ui/components/molecules";
import { ProductDetailTemplate } from "@sincpro/mobile-distribution/ui/components/templates";

import { ProductDetailProvider, useProductDetail } from "./product.detail.context";

function ProductDetailScreenContent() {
  const {
    product,
    isLoading,
    quantity,
    price,
    basePrice,
    maxDiscountPercent,
    isEditing,
    isBlocked,
    blockedMessage,
    setQuantity,
    setPrice,
    handleBack,
    handleSubmitAndNavigate,
  } = useProductDetail();

  if (!product) return null;

  return (
    <ProductDetailTemplate
      isLoading={isLoading}
      onBack={handleBack}
      product={product}
      title="Detalle de Producto"
    >
      <ProductDetailTemplate.Footer>
        <ProductActionFooter
          blocked={isBlocked}
          blockedMessage={blockedMessage ?? undefined}
          btnText={isEditing ? "Actualizar" : "Agregar al carrito"}
          editablePrice
          fractional
          maxDiscountPercent={maxDiscountPercent}
          minIncrement={0.1}
          onPressButton={handleSubmitAndNavigate}
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

export function ProductDetailScreen() {
  const route = useRoute();
  const navigationProduct = (route.params as any)?.product;
  const productFromProps = navigationProduct
    ? Product.fromJSON(navigationProduct)
    : undefined;

  return (
    <ProductDetailProvider product={productFromProps}>
      <ProductDetailScreenContent />
    </ProductDetailProvider>
  );
}
