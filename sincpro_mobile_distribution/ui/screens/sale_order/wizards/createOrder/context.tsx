import { DomainNetworkError } from "@sincpro/mobile/exceptions";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { EProductStockFilter, Product } from "@sincpro/mobile-distribution/domain/product";
import {
  EOrderLineOperation,
  IOrderLineChangePayload,
  SaleOrder,
  SaleOrderLine,
} from "@sincpro/mobile-distribution/domain/sale_order";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import { productService } from "@sincpro/mobile-distribution/services/product.service";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-native";

export enum ECreateOrderStep {
  FORM_OVERVIEW = "FORM_OVERVIEW",
  CUSTOMER_SELECTION = "CUSTOMER_SELECTION",
  CUSTOMER_CREATE = "CUSTOMER_CREATE",
  PRODUCT_CATALOG = "PRODUCT_CATALOG",
  PRODUCT_LINE_DETAIL = "PRODUCT_LINE_DETAIL",
}

interface ICreateOrderWizardContext {
  order: SaleOrder;
  customer: Customer | null;
  selectedProduct: Product | null;
  editingLine: SaleOrderLine | undefined;
  isLoading: boolean;

  customers: Customer[];
  isLoadingCustomers: boolean;
  loadCustomers: () => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  refreshCustomersFromBackend: () => Promise<void>;

  products: Product[];
  isLoadingProducts: boolean;
  productStockFilter: EProductStockFilter;
  loadProducts: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  refreshProductsFromBackend: () => Promise<void>;
  filterProductsByStock: (filter: EProductStockFilter) => Promise<void>;

  startEditingOrderLine: (line: SaleOrderLine) => void;
  startAddingProduct: (product: Product) => void;
  submitProductLine: (payload: IOrderLineChangePayload) => Promise<void>;
  removeOrderLine: (line: SaleOrderLine) => Promise<void>;
  handleCustomerSelect: (nextCustomer: Customer) => void;
  handleConfirmAndCharge: () => Promise<void>;
  handleSaveAsQuote: () => void;
  handleBackToOverview: () => void;
  handleExitWizard: () => void;
}

const CreateOrderWizardContext = createContext<ICreateOrderWizardContext | null>(null);

interface CreateOrderWizardProviderProps {
  children: ReactNode;
  initialCustomer?: Customer | null;
  initialProduct?: Product | null;
}

export function CreateOrderWizardProvider({
  children,
  initialCustomer = null,
  initialProduct = null,
}: CreateOrderWizardProviderProps) {
  const navigate = useNavigate();
  const { show, hide } = useConfirmationContext();

  const [order, setOrder] = useState<SaleOrder>(() => SaleOrder.obj({}));
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct);
  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productStockFilter, setProductStockFilter] = useState<EProductStockFilter>(
    EProductStockFilter.ALL,
  );

  const editingLine = useMemo(() => {
    if (!editingLineId) return undefined;
    return order.orderLines.find((l) => l.id === editingLineId);
  }, [editingLineId, order.orderLines]);

  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const result = await customerService.getAllCustomers();
      setCustomers(result.toArray());
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    setIsLoadingCustomers(true);
    try {
      const trimmed = (query ?? "").trim();
      const result = trimmed
        ? await customerService.searchCustomers(trimmed)
        : await customerService.getAllCustomers();
      setCustomers(result.toArray());
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  const refreshCustomersFromBackend = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      await customerService.pullAndMergeCustomersFromBackend();
      const result = await customerService.getAllCustomers();
      setCustomers(result.toArray());
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const result = await productService.getAllProducts(productStockFilter);
      setProducts(result.toArray());
    } finally {
      setIsLoadingProducts(false);
    }
  }, [productStockFilter]);

  const searchProducts = useCallback(
    async (query: string) => {
      setIsLoadingProducts(true);
      try {
        const trimmed = (query ?? "").trim();
        if (!trimmed) {
          const result = await productService.getAllProducts(productStockFilter);
          setProducts(result.toArray());
        } else {
          const result = await productService.searchProducts(trimmed);
          if (productStockFilter !== EProductStockFilter.ALL) {
            const filtered =
              productStockFilter === EProductStockFilter.IN_STOCK
                ? result.filter((p) => p.inStock)
                : result.filter((p) => !p.inStock);
            setProducts(filtered.toArray());
          } else {
            setProducts(result.toArray());
          }
        }
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [productStockFilter],
  );

  const refreshProductsFromBackend = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      await productService.fetchAllProductsFromBackend();
      const result = await productService.getAllProducts(productStockFilter);
      setProducts(result.toArray());
    } finally {
      setIsLoadingProducts(false);
    }
  }, [productStockFilter]);

  const filterProductsByStock = useCallback(async (filter: EProductStockFilter) => {
    setProductStockFilter(filter);
    setIsLoadingProducts(true);
    try {
      const result = await productService.getAllProducts(filter);
      setProducts(result.toArray());
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const handleCustomerSelect = useCallback(
    (nextCustomer: Customer): void => {
      const needsReprice = order.needsRepriceForCustomer(nextCustomer);

      if (!needsReprice) {
        const updatedOrder = order.clone();
        updatedOrder.changeCustomer(nextCustomer, false);
        setOrder(updatedOrder);
        setCustomer(nextCustomer);
        return;
      }

      show({
        title: "Recalcular precios",
        message:
          "El cliente tiene diferente lista de precios. ¿Recalcular precios de líneas no editadas manualmente?",
        confirmText: "Recalcular",
        cancelText: "Mantener",
        onConfirm: () => {
          hide();
          const updatedOrder = order.clone();
          updatedOrder.changeCustomer(nextCustomer, true);
          setOrder(updatedOrder);
          setCustomer(nextCustomer);
        },
        onCancel: () => {
          hide();
          const updatedOrder = order.clone();
          updatedOrder.changeCustomer(nextCustomer, false);
          setOrder(updatedOrder);
          setCustomer(nextCustomer);
        },
      });
    },
    [order, show, hide],
  );

  const startEditingOrderLine = useCallback(
    (line: SaleOrderLine): void => {
      const product = line.product;

      if (!product) {
        show({
          title: "Producto no encontrado",
          message:
            "El producto no está disponible localmente. Sincronice el catálogo de productos.",
          confirmText: "Entendido",
          onConfirm: () => hide(),
        });
        return;
      }

      setSelectedProduct(product);
      setEditingLineId(line.id);
    },
    [show, hide],
  );

  const startAddingProduct = useCallback((product: Product): void => {
    setSelectedProduct(product);
    setEditingLineId(null);
  }, []);

  const submitProductLine = useCallback(
    async (payload: IOrderLineChangePayload): Promise<void> => {
      const updatedOrder = order.clone();

      if (payload.mode === EOrderLineOperation.UPDATE && editingLineId) {
        updatedOrder.updateLine(editingLineId, payload.quantity, payload.effectivePrice);
      } else {
        updatedOrder.addProduct(payload.product, payload.quantity, payload.effectivePrice);
      }

      setOrder(updatedOrder);
      setSelectedProduct(null);
      setEditingLineId(null);
    },
    [order, editingLineId],
  );

  const removeOrderLine = useCallback(
    async (line: SaleOrderLine): Promise<void> => {
      const updatedOrder = order.clone();
      updatedOrder.removeLine(line.id);
      setOrder(updatedOrder);
    },
    [order],
  );

  const handleConfirmAndCharge = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const createdOrder = await saleOrderService.createSaleOrder(
        order.clone(),
        customer ?? undefined,
      );
      setOrder(createdOrder);
      navigate(AppScreen.SALE_ORDER_PAYMENT, {
        state: { order: createdOrder },
      });
    } catch (error) {
      console.error("Error creating sale order:", error);

      const isNetworkError = error instanceof DomainNetworkError;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (isNetworkError) {
        show({
          title: "Sin conexión",
          message: `No se pudo sincronizar con el servidor.\n\n${errorMessage}\n\n¿Desea continuar en modo offline?`,
          confirmText: "Continuar Offline",
          cancelText: "Cancelar",
          onConfirm: async () => {
            hide();
            const localOrder = await saleOrderService.getOrderById(order.uuid);
            if (localOrder) {
              navigate(AppScreen.SALE_ORDER_PAYMENT, {
                state: { order: localOrder },
              });
            }
          },
          onCancel: () => hide(),
        });
      } else {
        show({
          title: "Error",
          message: `${errorMessage}\n\n¿Desea continuar de todas formas?`,
          confirmText: "Continuar",
          cancelText: "Cancelar",
          onConfirm: async () => {
            hide();
            const localOrder = await saleOrderService.getOrderById(order.uuid);
            if (localOrder) {
              navigate(AppScreen.SALE_ORDER_PAYMENT, {
                state: { order: localOrder },
              });
            }
          },
          onCancel: () => hide(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [order, customer, navigate, show, hide]);

  const handleSaveAsQuote = useCallback((): void => {
    show({
      title: "Guardar como cotización",
      message: "¿Desea guardar esta orden como una cotización?",
      confirmText: "Sí, guardar",
      onConfirm: async () => {
        hide();
        setIsLoading(true);
        try {
          const createdOrder = await saleOrderService.createQuotationOrder(
            order.clone(),
            customer ?? undefined,
          );
          setOrder(createdOrder);
          navigate(AppScreen.SALE_ORDER_LIST, { replace: true });
        } catch (error) {
          console.error("Error creating quotation:", error);

          const isNetworkError = error instanceof DomainNetworkError;
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (isNetworkError) {
            show({
              title: "Sin conexión",
              message: `No se pudo sincronizar con el servidor.\n\n${errorMessage}\n\n¿Desea continuar en modo offline?`,
              confirmText: "Continuar Offline",
              cancelText: "Cancelar",
              onConfirm: () => {
                hide();
                navigate(AppScreen.SALE_ORDER_LIST, { replace: true });
              },
              onCancel: () => hide(),
            });
          } else {
            show({
              title: "Error",
              message: `${errorMessage}\n\n¿Desea continuar de todas formas?`,
              confirmText: "Continuar",
              cancelText: "Cancelar",
              onConfirm: () => {
                hide();
                navigate(AppScreen.SALE_ORDER_LIST, { replace: true });
              },
              onCancel: () => hide(),
            });
          }
        } finally {
          setIsLoading(false);
        }
      },
      onCancel: () => hide(),
    });
  }, [order, customer, show, hide, navigate]);

  const handleBackToOverview = useCallback((): void => {
    setSelectedProduct(null);
    setEditingLineId(null);
  }, []);

  const handleExitWizard = useCallback((): void => {
    const hasData = order.orderLines.length > 0 || customer !== null;

    if (!hasData) {
      navigate(-1);
      return;
    }

    show({
      title: "¿Salir sin guardar?",
      message: "Perderás todos los datos de la orden en curso. ¿Estás seguro?",
      confirmText: "Sí, salir",
      cancelText: "Cancelar",
      onConfirm: () => {
        hide();
        navigate(-1);
      },
      onCancel: () => hide(),
    });
  }, [order.orderLines.length, customer, show, hide, navigate]);

  const value: ICreateOrderWizardContext = useMemo(
    () => ({
      order,
      customer,
      selectedProduct,
      editingLine,
      isLoading,
      customers,
      isLoadingCustomers,
      loadCustomers,
      searchCustomers,
      refreshCustomersFromBackend,
      products,
      isLoadingProducts,
      productStockFilter,
      loadProducts,
      searchProducts,
      refreshProductsFromBackend,
      filterProductsByStock,
      startEditingOrderLine,
      startAddingProduct,
      submitProductLine,
      removeOrderLine,
      handleCustomerSelect,
      handleConfirmAndCharge,
      handleSaveAsQuote,
      handleBackToOverview,
      handleExitWizard,
    }),
    [
      order,
      customer,
      selectedProduct,
      editingLine,
      isLoading,
      customers,
      isLoadingCustomers,
      loadCustomers,
      searchCustomers,
      refreshCustomersFromBackend,
      products,
      isLoadingProducts,
      productStockFilter,
      loadProducts,
      searchProducts,
      refreshProductsFromBackend,
      filterProductsByStock,
      startEditingOrderLine,
      startAddingProduct,
      submitProductLine,
      removeOrderLine,
      handleCustomerSelect,
      handleConfirmAndCharge,
      handleSaveAsQuote,
      handleBackToOverview,
      handleExitWizard,
    ],
  );

  return (
    <CreateOrderWizardContext.Provider value={value}>
      {children}
    </CreateOrderWizardContext.Provider>
  );
}

export function useCreateOrderWizard(): ICreateOrderWizardContext {
  const context = useContext(CreateOrderWizardContext);
  if (!context) {
    throw new Error("useCreateOrderWizard must be used within CreateOrderWizardProvider");
  }
  return context;
}
