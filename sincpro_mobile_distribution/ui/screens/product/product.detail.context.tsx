import { Product } from "@sincpro/mobile-distribution/domain/product";
import { PriceListID } from "@sincpro/mobile-distribution/domain/product/price_list";
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
import { useNavigate } from "react-router-native";

interface IProductDetailContext {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  quantity: number;
  price: number;
  basePrice: number;
  priceListId?: PriceListID;
  maxDiscountPercent: number;
  isEditing: boolean;
  isBlocked: boolean;
  blockedMessage: string | null;
  total: number;
  setQuantity: (quantity: number) => void;
  setPrice: (price: number) => void;
  loadProduct: (uuid: string) => Promise<void>;
  handleSubmit: () => void;
  handleBack: () => void;
  handleSubmitAndNavigate: () => void;
}

const ProductDetailContext = createContext<IProductDetailContext | null>(null);

interface ProductDetailProviderProps {
  children: React.ReactNode;
  product?: Product;
  priceListId?: PriceListID;
  maxDiscountPercent?: number;
  editingLineId?: string;
  editingQuantity?: number;
  editingPrice?: number;
  onSubmit?: (payload: IProductDetailPayload) => void;
}

export interface IProductDetailPayload {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineId?: string;
}

export function ProductDetailProvider({
  children,
  product: initialProduct,
  priceListId,
  maxDiscountPercent = 20,
  editingLineId,
  editingQuantity,
  editingPrice,
  onSubmit,
}: ProductDetailProviderProps) {
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(editingQuantity ?? 1);
  const [price, setPrice] = useState<number>(editingPrice ?? 0);
  const [basePrice, setBasePrice] = useState<number>(0);

  const isEditing = !!editingLineId;

  useEffect(() => {
    if (!initialProduct) return;

    const calculatedBasePrice = initialProduct.resolveUnitPrice(priceListId);
    setBasePrice(calculatedBasePrice);
    setProduct(initialProduct);

    if (!isEditing) {
      setPrice(calculatedBasePrice);
    }
  }, [initialProduct, priceListId, isEditing]);

  const loadProduct = useCallback(
    async (uuid: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await productService.getProductByUuid(uuid);
        if (result) {
          setProduct(result);
          const calculatedBasePrice = result.resolveUnitPrice(priceListId);
          setBasePrice(calculatedBasePrice);
          if (!isEditing) {
            setPrice(calculatedBasePrice);
          }
        } else {
          setError("Producto no encontrado");
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [priceListId, isEditing],
  );

  const isBlocked = useMemo(() => {
    if (!product) return false;
    return !product.hasCabysCode();
  }, [product]);

  const blockedMessage = useMemo(() => {
    if (isBlocked) return "Producto sin código CABYS";
    return null;
  }, [isBlocked]);

  const total = useMemo(() => price * quantity, [price, quantity]);

  const handleSubmit = useCallback(() => {
    if (!product || isBlocked) return;

    if (onSubmit) {
      const payload: IProductDetailPayload = {
        product,
        quantity,
        unitPrice: price,
        lineId: editingLineId,
      };
      onSubmit(payload);
    }
  }, [product, quantity, price, editingLineId, onSubmit, isBlocked]);

  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSubmitAndNavigate = useCallback(() => {
    if (!product || isBlocked) return;
    handleSubmit();
    navigate(AppScreen.SALE_ORDER_CREATE, {
      state: {
        orderLine: {
          productId: product.remoteId,
          name: product.name,
          code: product.code,
          quantity,
          price,
          originalPrice: basePrice,
          description: product.description,
          uomId: product.uomId,
          uomName: product.uomName,
        },
      },
    });
  }, [product, isBlocked, handleSubmit, navigate, quantity, price, basePrice]);

  const value = useMemo<IProductDetailContext>(
    () => ({
      product,
      isLoading,
      error,
      quantity,
      price,
      basePrice,
      priceListId,
      maxDiscountPercent,
      isEditing,
      isBlocked,
      blockedMessage,
      total,
      setQuantity,
      setPrice,
      loadProduct,
      handleSubmit,
      handleBack,
      handleSubmitAndNavigate,
    }),
    [
      product,
      isLoading,
      error,
      quantity,
      price,
      basePrice,
      priceListId,
      maxDiscountPercent,
      isEditing,
      isBlocked,
      blockedMessage,
      total,
      loadProduct,
      handleSubmit,
      handleBack,
      handleSubmitAndNavigate,
    ],
  );

  return (
    <ProductDetailContext.Provider value={value}>{children}</ProductDetailContext.Provider>
  );
}

export function useProductDetail() {
  const ctx = useContext(ProductDetailContext);
  if (!ctx) throw new Error("useProductDetail must be used within ProductDetailProvider");
  return ctx;
}
