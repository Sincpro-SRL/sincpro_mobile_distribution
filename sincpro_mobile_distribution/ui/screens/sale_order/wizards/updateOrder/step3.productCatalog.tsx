import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { Product } from "@sincpro/mobile-distribution/domain/product";
import { ProductFetchedEvent } from "@sincpro/mobile-distribution/domain/product/events";
import { ProductStockFilters } from "@sincpro/mobile-distribution/ui/components/molecules";
import { ProductListTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useEffect } from "react";

import { EUpdateOrderStep, useUpdateOrderWizard } from "./context";

interface StepProductCatalogProps {
  wizard: WizardContextValue;
}

export function StepProductCatalog({ wizard }: StepProductCatalogProps) {
  const {
    products,
    isLoadingProducts,
    productStockFilter,
    loadProducts,
    searchProducts,
    refreshProductsFromBackend,
    filterProductsByStock,
    startAddingProduct,
  } = useUpdateOrderWizard();

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const reload = () => void loadProducts();
    UIEventBus.on(ProductFetchedEvent.name, reload);
    return () => {
      UIEventBus.off(ProductFetchedEvent.name, reload);
    };
  }, [loadProducts]);

  function handleSelectProduct(product: Product): void {
    startAddingProduct(product);
    wizard.goToStep(EUpdateOrderStep.PRODUCT_LINE_DETAIL);
  }

  return (
    <ProductListTemplate
      description="Selecciona producto para agregar a la orden"
      isLoading={isLoadingProducts}
      onBack={() => wizard.goToStep(EUpdateOrderStep.FORM_OVERVIEW)}
      onRefresh={refreshProductsFromBackend}
      onSearch={searchProducts}
      onSelect={handleSelectProduct}
      products={products}
      title="Agregar Producto"
    >
      <ProductListTemplate.Filters>
        <ProductStockFilters
          activeFilter={productStockFilter}
          onFilterChange={filterProductsByStock}
        />
      </ProductListTemplate.Filters>
    </ProductListTemplate>
  );
}
