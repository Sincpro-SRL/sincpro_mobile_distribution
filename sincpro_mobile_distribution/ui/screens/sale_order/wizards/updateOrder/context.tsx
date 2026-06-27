import { StackActions, useNavigation } from "@react-navigation/native";
import { loggerUseCases } from "@sincpro/mobile/infrastructure/logger";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { EProductStockFilter, Product } from "@sincpro/mobile-distribution/domain/product";
import { SaleOrder, SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import { productService } from "@sincpro/mobile-distribution/services/product.service";
import { saleOrderService } from "@sincpro/mobile-distribution/services/sale_order.service";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export enum EUpdateOrderStep {
  FORM_OVERVIEW = "FORM_OVERVIEW",
  CUSTOMER_SELECTION = "CUSTOMER_SELECTION",
  PRODUCT_CATALOG = "PRODUCT_CATALOG",
  PRODUCT_LINE_DETAIL = "PRODUCT_LINE_DETAIL",
}

interface UpdateOrderWizardContextValue {
  order: SaleOrder;
  customer: Customer | null;
  isLoading: boolean;
  selectedProduct: Product | null;
  editingLine: SaleOrderLine | null;

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

  handleCustomerChange: (newCustomer: Customer) => void;
  startAddingProduct: (product: Product) => void;
  startEditingOrderLine: (line: SaleOrderLine) => void;
  submitProductLine: (payload: any) => Promise<void>;
  addOrderLine: (product: Product, quantity: number, priceUnit: number) => Promise<void>;
  updateOrderLine: (lineId: number, quantity: number, priceUnit: number) => Promise<void>;
  removeOrderLine: (lineId: number) => Promise<void>;
  saveChanges: () => Promise<void>;
  cancelChanges: () => void;

  canEditOrder: boolean;
  allowedOperations: {
    canChangeCustomer: boolean;
    canAddLines: boolean;
    canRemoveLines: boolean;
    canModifyQuantities: boolean;
    canModifyPrices: boolean;
  };
}

const UpdateOrderWizardContext = createContext<UpdateOrderWizardContextValue | null>(null);

export function useUpdateOrderWizard(): UpdateOrderWizardContextValue {
  const context = useContext(UpdateOrderWizardContext);
  if (!context) {
    throw new Error("useUpdateOrderWizard must be used within UpdateOrderWizardProvider");
  }
  return context;
}

interface UpdateOrderWizardProviderProps {
  children: ReactNode;
  initialOrder: SaleOrder;
}

export function UpdateOrderWizardProvider({
  children,
  initialOrder,
}: UpdateOrderWizardProviderProps) {
  const navigation = useNavigation();
  const { show, hide } = useConfirmationContext();

  const [order, setOrder] = useState<SaleOrder>(initialOrder);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingLine, setEditingLine] = useState<SaleOrderLine | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productStockFilter, setProductStockFilter] = useState<EProductStockFilter>(
    EProductStockFilter.ALL,
  );

  const canEditOrder = useMemo(() => {
    return order.canBeUpdated();
  }, [order]);

  const allowedOperations = useMemo(() => {
    const ops = order.getAllowedUpdateOperations();
    return {
      ...ops,
      canChangeCustomer: ops.canAddLines || ops.canModifyQuantities,
    };
  }, [order]);

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

  useEffect(() => {
    async function loadCustomer() {
      try {
        setIsLoading(true);
        let customerData: Customer | null = null;

        if (order.customerId) {
          customerData = await customerService.getCustomerByRemoteId(order.customerId);
        }

        if (!customerData && order.customerUUID) {
          customerData = await customerService.getCustomerByUuid(order.customerUUID);
        }

        setCustomer(customerData);
      } catch (error) {
        loggerUseCases.error("Error loading customer:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCustomer();
  }, [order.customerUUID, order.customerId]);

  const addOrderLine = useCallback(
    async (product: Product, quantity: number, effectivePrice: number) => {
      if (!allowedOperations.canAddLines) {
        show({
          title: "Operación no permitida",
          message: "No se pueden agregar nuevas líneas a esta orden.",
          confirmText: "Entendido",
          onConfirm: () => hide(),
        });
        return;
      }

      try {
        setIsLoading(true);
        const updatedOrder = order.clone();
        updatedOrder.addProduct(product, quantity, effectivePrice);
        setOrder(updatedOrder);
      } catch (error) {
        loggerUseCases.error("Error adding order line:", error);
        show({
          title: "Error",
          message: `Error al agregar producto: ${error}`,
          confirmText: "Entendido",
          onConfirm: () => hide(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [order, allowedOperations.canAddLines, show, hide],
  );

  const updateOrderLine = useCallback(
    async (lineId: number, quantity: number, effectivePrice: number) => {
      if (!allowedOperations.canModifyQuantities && !allowedOperations.canModifyPrices) {
        show({
          title: "Operación no permitida",
          message: "No se pueden modificar las líneas de esta orden.",
          confirmText: "Entendido",
          onConfirm: () => hide(),
        });
        return;
      }

      try {
        setIsLoading(true);
        const updatedOrder = order.clone();
        updatedOrder.updateLine(lineId, quantity, effectivePrice);
        setOrder(updatedOrder);
      } catch (error) {
        loggerUseCases.error("Error updating order line:", error);
        show({
          title: "Error",
          message: `Error al actualizar línea: ${error}`,
          confirmText: "Entendido",
          onConfirm: () => hide(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [order, allowedOperations, show, hide],
  );

  const removeOrderLine = useCallback(
    async (lineId: number) => {
      if (!allowedOperations.canRemoveLines) {
        show({
          title: "Operación no permitida",
          message: "No se pueden eliminar líneas de esta orden.",
          confirmText: "Entendido",
          onConfirm: () => hide(),
        });
        return;
      }

      try {
        setIsLoading(true);
        const updatedOrder = order.clone();
        updatedOrder.removeLine(lineId);
        setOrder(updatedOrder);
      } catch (error) {
        loggerUseCases.error("Error removing order line:", error);
        show({
          title: "Error",
          message: `Error al eliminar línea: ${error}`,
          confirmText: "Entendido",
          onConfirm: () => hide(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [order, allowedOperations.canRemoveLines, show, hide],
  );

  const saveChanges = useCallback(async () => {
    show({
      title: "Guardar cambios",
      message: "¿Desea guardar los cambios realizados en la orden?",
      confirmText: "Guardar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        hide();
        setIsLoading(true);
        try {
          await saleOrderService.updateOrder(order);
          navigation.dispatch(
            StackActions.replace(AppScreen.SALE_ORDER_DETAIL, { saleOrder: order }),
          );
        } catch (error) {
          loggerUseCases.error("Error saving order:", error);
          show({
            title: "Error",
            message: `Error al guardar cambios: ${error}`,
            confirmText: "Entendido",
            onConfirm: () => hide(),
          });
        } finally {
          setIsLoading(false);
        }
      },
      onCancel: () => hide(),
    });
  }, [order, navigation, show, hide]);

  const cancelChanges = useCallback(() => {
    show({
      title: "Cancelar cambios",
      message: "¿Está seguro que desea cancelar? Se perderán todos los cambios no guardados.",
      confirmText: "Sí, cancelar",
      cancelText: "Continuar editando",
      onConfirm: () => {
        hide();
        navigation.dispatch(
          StackActions.replace(AppScreen.SALE_ORDER_DETAIL, { saleOrder: initialOrder }),
        );
      },
      onCancel: () => hide(),
    });
  }, [initialOrder, navigation, show, hide]);

  const startAddingProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setEditingLine(null);
  }, []);

  const handleCustomerChange = useCallback(
    (newCustomer: Customer) => {
      if (!allowedOperations.canChangeCustomer) {
        show({
          title: "Operación no permitida",
          message: "No se puede cambiar el cliente de esta orden.",
          confirmText: "Entendido",
          onConfirm: () => hide(),
        });
        return;
      }

      const needsReprice = order.needsRepriceForCustomer(newCustomer);

      if (!needsReprice) {
        const updatedOrder = order.clone();
        updatedOrder.changeCustomer(newCustomer, false);
        setOrder(updatedOrder);
        setCustomer(newCustomer);
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
          updatedOrder.changeCustomer(newCustomer, true);
          setOrder(updatedOrder);
          setCustomer(newCustomer);
        },
        onCancel: () => {
          hide();
          const updatedOrder = order.clone();
          updatedOrder.changeCustomer(newCustomer, false);
          setOrder(updatedOrder);
          setCustomer(newCustomer);
        },
      });
    },
    [order, allowedOperations.canChangeCustomer, show, hide],
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
      setEditingLine(line);
    },
    [show, hide],
  );

  const submitProductLine = useCallback(
    async (payload: any) => {
      if (editingLine) {
        if (payload.quantity <= 0) {
          await removeOrderLine(editingLine.id);
        } else {
          await updateOrderLine(editingLine.id, payload.quantity, payload.effectivePrice);
        }
      } else {
        if (payload.quantity > 0) {
          await addOrderLine(payload.product, payload.quantity, payload.effectivePrice);
        }
      }
      setSelectedProduct(null);
      setEditingLine(null);
    },
    [editingLine, updateOrderLine, addOrderLine, removeOrderLine],
  );

  const value: UpdateOrderWizardContextValue = {
    order,
    customer,
    isLoading,
    selectedProduct,
    editingLine,
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
    handleCustomerChange,
    startAddingProduct,
    startEditingOrderLine,
    submitProductLine,
    addOrderLine,
    updateOrderLine,
    removeOrderLine,
    saveChanges,
    cancelChanges,
    canEditOrder,
    allowedOperations,
  };

  return (
    <UpdateOrderWizardContext.Provider value={value}>
      {children}
    </UpdateOrderWizardContext.Provider>
  );
}
