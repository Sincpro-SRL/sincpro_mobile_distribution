import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { CustomerRow } from "@sincpro/mobile-distribution/ui/components/organisms";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { useEffect } from "react";

import { InvoiceCustomerListProvider, useInvoiceCustomerList } from "./invoice.list.context";

function InvoiceCustomerListContent() {
  const {
    customers,
    isLoading,
    loadCustomers,
    searchCustomers,
    refreshFromBackend,
    reset,
    handleSelectCustomer,
    handleBack,
  } = useInvoiceCustomerList();

  useEffect(() => {
    loadCustomers();
    return () => reset();
  }, [loadCustomers, reset]);

  return (
    <ListViewV2.Root
      description="Seleccione un cliente con facturas pendientes"
      isLoading={isLoading}
      items={customers}
      name="Facturas pendientes"
      onBack={handleBack}
      onRefresh={refreshFromBackend}
      onSearch={searchCustomers}
    >
      <ListViewV2.Header variant="default">
        <ListViewV2.Header.Search />
      </ListViewV2.Header>

      <ListViewV2.Content>
        {(customer: Customer) => (
          <CustomerRow
            customer={customer}
            key={customer.uuid}
            onPress={() => handleSelectCustomer(customer)}
          />
        )}
      </ListViewV2.Content>
    </ListViewV2.Root>
  );
}

export function InvoiceCustomerListScreen() {
  return (
    <InvoiceCustomerListProvider>
      <InvoiceCustomerListContent />
    </InvoiceCustomerListProvider>
  );
}
