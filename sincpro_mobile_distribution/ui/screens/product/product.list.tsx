import { ProductStockFilters } from "@sincpro/mobile-distribution/ui/components/molecules";
import { ProductListTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { AppBar } from "@sincpro/mobile-ui/Navigation/Navigation.AppBar";
import { useEffect } from "react";

import { ProductListProvider, useProductList } from "./product.list.context";

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

      <ProductListTemplate.AppBarActions>
        <AppBar.Action icon="scan-outline" onPress={handleOpenScanner} />
      </ProductListTemplate.AppBarActions>
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
