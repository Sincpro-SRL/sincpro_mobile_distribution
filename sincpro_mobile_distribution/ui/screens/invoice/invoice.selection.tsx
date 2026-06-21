import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { CustomerInfoCard } from "@sincpro/mobile-distribution/ui/components/molecules";
import { InvoiceList } from "@sincpro/mobile-distribution/ui/components/organisms";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { theme } from "@sincpro/mobile-ui/theme";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-native";

import {
  EInvoiceFilter,
  InvoiceSelectionProvider,
  useInvoiceSelection,
} from "./invoice.selection.context";

const FILTER_OPTIONS = [
  { key: EInvoiceFilter.NOT_PAID, label: "No pagadas" },
  { key: EInvoiceFilter.PAID, label: "Pagadas" },
  { key: EInvoiceFilter.ALL, label: "Todas" },
];

function InvoiceSelectionContent() {
  const {
    customer,
    filteredInvoices,
    isLoading,
    currentFilter,
    setCurrentFilter,
    loadInvoices,
    refreshFromBackend,
    fetchMoreInvoices,
    reset,
    handleSelectInvoice,
    handleBack,
  } = useInvoiceSelection();

  useEffect(() => {
    loadInvoices();
    return () => reset();
  }, [loadInvoices, reset]);

  const currencySymbol = useMemo(() => {
    return filteredInvoices[0]?.currencySymbol ?? "₡";
  }, [filteredInvoices]);

  const handleFetchMore = useCallback(() => {
    fetchMoreInvoices(20);
  }, [fetchMoreInvoices]);

  return (
    <FormViewV2.Root
      description="Seleccione una factura para pagar"
      isEmpty={!customer}
      isLoading={isLoading}
      item={customer}
      name="Facturas"
      onBack={handleBack}
      onRefresh={refreshFromBackend}
    >
      <FormViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER}>
        <FormViewV2.Header.ActionsBar>
          <Form.Button
            className="flex-1"
            icon={<Display.Icon color="#f97316" name="download" size={14} type="antdesign" />}
            onPress={handleFetchMore}
            size="small"
            title="Cargar 20 más"
            variant="outline"
          />
        </FormViewV2.Header.ActionsBar>
      </FormViewV2.Header>

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>
            {customer && <CustomerInfoCard customer={customer} />}
          </FormViewV2.Content.Group>

          <FormViewV2.Content.Group>
            <Form.FilterButtonGroup>
              {FILTER_OPTIONS.map((option) => (
                <Form.FilterButton
                  active={currentFilter === option.key}
                  key={option.key}
                  onPress={() => setCurrentFilter(option.key)}
                  title={option.label}
                />
              ))}
            </Form.FilterButtonGroup>
          </FormViewV2.Content.Group>

          <FormViewV2.Content.Group>
            <InvoiceList
              currencySymbol={currencySymbol}
              invoices={filteredInvoices}
              onSelectInvoice={handleSelectInvoice}
            />
          </FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>
    </FormViewV2.Root>
  );
}

interface InvoiceSelectionScreenProps {
  customer?: Customer;
}

export function InvoiceSelectionScreen({ customer }: InvoiceSelectionScreenProps) {
  const location = useLocation();
  const customerFromState = location.state?.customer as Customer | undefined;
  const resolvedCustomer = customer ?? customerFromState;

  if (!resolvedCustomer) {
    return null;
  }

  return (
    <InvoiceSelectionProvider customer={resolvedCustomer}>
      <InvoiceSelectionContent />
    </InvoiceSelectionProvider>
  );
}
