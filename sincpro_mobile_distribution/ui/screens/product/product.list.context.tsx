import { useNavigation } from "@react-navigation/native";
import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { EProductStockFilter, Product } from "@sincpro/mobile-distribution/domain/product";
import {
  ProductFetchedEvent,
  ProductStockUpdatedEvent,
} from "@sincpro/mobile-distribution/domain/product/events";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { productService } from "@sincpro/mobile-distribution/services/product.service";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface IProductListContext {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  stockFilter: EProductStockFilter;
  loadProducts: () => Promise<void>;
  searchProducts: (q: string) => void;
  refreshFromBackend: () => Promise<void>;
  filterByStock: (filter: EProductStockFilter) => void;
  clearSearch: () => Promise<void>;
  reset: () => void;
  handleSelectProduct: (product: Product) => void;
  handleBack: () => void;
  handleOpenScanner: () => void;
}

const ProductListContext = createContext<IProductListContext | null>(null);

export function ProductListProvider({
  children,
  initialSearchQuery,
}: {
  children: React.ReactNode;
  initialSearchQuery?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<EProductStockFilter>(
    EProductStockFilter.ALL,
  );

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await productService.getAllProducts(stockFilter);
      setProducts(result.toArray());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [stockFilter]);

  const searchProducts = useCallback(
    async (q: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const query = (q ?? "").trim();
        if (!query) {
          const result = await productService.getAllProducts(stockFilter);
          setProducts(result.toArray());
        } else {
          const result = await productService.searchProducts(query);
          if (stockFilter !== EProductStockFilter.ALL) {
            const filtered =
              stockFilter === EProductStockFilter.IN_STOCK
                ? result.filter((p) => p.inStock)
                : result.filter((p) => !p.inStock);
            setProducts(filtered.toArray());
          } else {
            setProducts(result.toArray());
          }
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [stockFilter],
  );

  const refreshFromBackend = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await productService.fetchAllProductsFromBackend();
      await loadProducts();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [loadProducts]);

  const filterByStock = useCallback(async (filter: EProductStockFilter) => {
    setStockFilter(filter);
    setIsLoading(true);
    setError(null);
    try {
      const result = await productService.getAllProducts(filter);
      setProducts(result.toArray());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  const reset = useCallback(() => {
    setProducts([]);
    setIsLoading(false);
    setError(null);
    setStockFilter(EProductStockFilter.ALL);
  }, []);

  const navigation = useNavigation();

  const handleSelectProduct = useCallback(
    (product: Product) => {
      (navigation as any).navigate(AppScreen.PRODUCT_DETAIL, { product });
    },
    [navigation],
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOpenScanner = useCallback(() => {
    navigation.navigate(AppScreen.SCANNER as never);
  }, [navigation]);

  useEffect(() => {
    if (initialSearchQuery) {
      searchProducts(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    const reload = () => void loadProducts();

    UIEventBus.on(ProductFetchedEvent.name, reload);
    UIEventBus.on(ProductStockUpdatedEvent.name, reload);

    return () => {
      UIEventBus.off(ProductFetchedEvent.name, reload);
      UIEventBus.off(ProductStockUpdatedEvent.name, reload);
    };
  }, [loadProducts]);

  const value = useMemo<IProductListContext>(
    () => ({
      products,
      isLoading,
      error,
      stockFilter,
      loadProducts,
      searchProducts,
      refreshFromBackend,
      filterByStock,
      clearSearch,
      reset,
      handleSelectProduct,
      handleBack,
      handleOpenScanner,
    }),
    [
      products,
      isLoading,
      error,
      stockFilter,
      loadProducts,
      searchProducts,
      refreshFromBackend,
      filterByStock,
      clearSearch,
      reset,
      handleSelectProduct,
      handleBack,
      handleOpenScanner,
    ],
  );

  return <ProductListContext.Provider value={value}>{children}</ProductListContext.Provider>;
}

export function useProductList() {
  const ctx = useContext(ProductListContext);
  if (!ctx) throw new Error("useProductList must be used within ProductListProvider");
  return ctx;
}
