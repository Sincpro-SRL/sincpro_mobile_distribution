import { ProductStockFilters } from "@sincpro/mobile-distribution/ui/components/molecules";
import { ProductListTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { Form } from "@sincpro/mobile-ui/Form";
import { useEffect } from "react";

import { ProductListProvider, useProductList } from "./product.list.context";

const IconButton = Form.IconButton;

function ProductListScreenContent() {
  const {
    products,
    isLoading,
    stockFilter,
    loadProducts,
    searchProducts,
    refreshFromBackend,
    filterByStock,
    reset,
    handleSelectProduct,
    handleBack,
    handleOpenScanner,
  } = useProductList();

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <ProductListTemplate
      description="Lista de productos disponibles"
      isLoading={isLoading}
      onBack={handleBack}
      onRefresh={refreshFromBackend}
      onSearch={searchProducts}
      onSelect={handleSelectProduct}
      products={products}
      title="Productos"
    >
      <ProductListTemplate.Filters>
        <ProductStockFilters activeFilter={stockFilter} onFilterChange={filterByStock} />
      </ProductListTemplate.Filters>

      <ProductListTemplate.FloatingButton>
        <IconButton
          icon="qrcode"
          onPress={handleOpenScanner}
          rounded
          size="large"
          type="antdesign"
          variant="primary"
        />
      </ProductListTemplate.FloatingButton>
    </ProductListTemplate>
  );
}

export function ProductListScreen() {
  return (
    <ProductListProvider>
      <ProductListScreenContent />
    </ProductListProvider>
  );
}
