import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { InvoiceReadyToReconcileEvent } from "@sincpro/mobile-distribution/domain/invoice/events";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { invoiceService } from "@sincpro/mobile-distribution/services/invoice.service";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-native";

export enum EInvoiceFilter {
  NOT_PAID = "NOT_PAID",
  PAID = "PAID",
  ALL = "ALL",
}

interface IInvoiceSelectionContext {
  customer: Customer;
  unpaidInvoices: Invoice[];
  allInvoices: Invoice[];
  filteredInvoices: Invoice[];
  selectedInvoices: Invoice[];
  isLoading: boolean;
  totalSelectedAmount: number;
  currentFilter: EInvoiceFilter;
  setCurrentFilter: (filter: EInvoiceFilter) => void;
  loadInvoices: () => Promise<void>;
  refreshFromBackend: () => Promise<void>;
  fetchMoreInvoices: (limit?: number) => Promise<void>;
  setSelectedInvoices: (invoices: Invoice[]) => void;
  reset: () => void;
  handleSelectInvoice: (invoice: Invoice) => void;
  handleBack: () => void;
}

const InvoiceSelectionContext = createContext<IInvoiceSelectionContext | null>(null);

interface InvoiceSelectionProviderProps {
  children: ReactNode;
  customer: Customer;
}

export function InvoiceSelectionProvider({
  children,
  customer,
}: InvoiceSelectionProviderProps) {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<EInvoiceFilter>(EInvoiceFilter.NOT_PAID);

  const unpaidInvoices = useMemo(() => {
    return allInvoices.filter((inv) => inv.amountResidual > 0);
  }, [allInvoices]);

  const filteredInvoices = useMemo(() => {
    switch (currentFilter) {
      case EInvoiceFilter.NOT_PAID:
        return allInvoices.filter((inv) => inv.amountResidual > 0);
      case EInvoiceFilter.PAID:
        return allInvoices.filter((inv) => inv.amountResidual === 0);
      case EInvoiceFilter.ALL:
        return allInvoices;
      default:
        return allInvoices;
    }
  }, [allInvoices, currentFilter]);

  const totalSelectedAmount = useMemo(() => {
    return selectedInvoices.reduce((sum, inv) => sum + (inv.amountResidual || 0), 0);
  }, [selectedInvoices]);

  const loadInvoices = useCallback(async () => {
    if (!customer?.remoteId) {
      setAllInvoices([]);
      return;
    }

    setIsLoading(true);
    try {
      const invoices = await invoiceService.getInvoicesByCustomer([customer.remoteId]);
      setAllInvoices(invoices.toArray());
    } finally {
      setIsLoading(false);
    }
  }, [customer?.remoteId]);

  const refreshFromBackend = useCallback(async () => {
    if (!customer?.remoteId) return;

    setIsLoading(true);
    try {
      await invoiceService.fetchNotPaidInvoicesByCustomer([customer.remoteId]);

      const updatedInvoices = await invoiceService.getInvoicesByCustomer([customer.remoteId]);
      setAllInvoices(updatedInvoices.toArray());
    } finally {
      setIsLoading(false);
    }
  }, [customer?.remoteId]);

  const fetchMoreInvoices = useCallback(
    async (limit: number = 20) => {
      if (!customer?.remoteId) return;

      setIsLoading(true);
      try {
        await invoiceService.fetchMoreInvoicesByCustomer([customer.remoteId], limit);

        const updatedInvoices = await invoiceService.getInvoicesByCustomer([
          customer.remoteId,
        ]);
        setAllInvoices(updatedInvoices.toArray());
      } finally {
        setIsLoading(false);
      }
    },
    [customer?.remoteId],
  );

  const reset = useCallback(() => {
    setAllInvoices([]);
    setSelectedInvoices([]);
    setIsLoading(false);
    setCurrentFilter(EInvoiceFilter.NOT_PAID);
  }, []);

  const navigate = useNavigate();

  const handleSelectInvoice = useCallback(
    (invoice: Invoice) => {
      navigate(AppScreen.INVOICE_PAYMENT, { state: { invoice, customer } });
    },
    [navigate, customer],
  );

  const handleBack = useCallback(() => {
    navigate(AppScreen.INVOICE_LIST);
  }, [navigate]);

  useEffect(() => {
    const reload = () => void loadInvoices();

    UIEventBus.on(InvoiceReadyToReconcileEvent.name, reload);

    return () => {
      UIEventBus.off(InvoiceReadyToReconcileEvent.name, reload);
    };
  }, [loadInvoices]);

  const value = useMemo<IInvoiceSelectionContext>(
    () => ({
      customer,
      unpaidInvoices,
      allInvoices,
      filteredInvoices,
      selectedInvoices,
      isLoading,
      totalSelectedAmount,
      currentFilter,
      setCurrentFilter,
      loadInvoices,
      refreshFromBackend,
      fetchMoreInvoices,
      setSelectedInvoices,
      reset,
      handleSelectInvoice,
      handleBack,
    }),
    [
      customer,
      unpaidInvoices,
      allInvoices,
      filteredInvoices,
      selectedInvoices,
      isLoading,
      totalSelectedAmount,
      currentFilter,
      loadInvoices,
      refreshFromBackend,
      fetchMoreInvoices,
      reset,
      handleSelectInvoice,
      handleBack,
    ],
  );

  return (
    <InvoiceSelectionContext.Provider value={value}>
      {children}
    </InvoiceSelectionContext.Provider>
  );
}

export function useInvoiceSelection(): IInvoiceSelectionContext {
  const context = useContext(InvoiceSelectionContext);
  if (!context) {
    throw new Error("useInvoiceSelection must be used within InvoiceSelectionProvider");
  }
  return context;
}
