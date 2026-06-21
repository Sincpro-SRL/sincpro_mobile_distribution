import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { CustomerRow } from "@sincpro/mobile-distribution/ui/components/organisms";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useEffect } from "react";

import {
  CustomerOrdersListProvider,
  useCustomerOrdersList,
} from "./customer_orders.list.context";

function CustomerOrdersListContent() {
  const {
    customers,
    isLoading,
    loadCustomers,
    searchCustomers,
    refreshFromBackend,
    reset,
    handleSelectCustomer,
    handleBack,
  } = useCustomerOrdersList();

  useEffect(() => {
    loadCustomers();
    return () => reset();
  }, [loadCustomers, reset]);

  return (
    <ListViewV2.Root
      description="Seleccionar cliente para crear nota de crédito"
      isLoading={isLoading}
      items={customers}
      name="Notas de Crédito"
      onBack={handleBack}
      onRefresh={refreshFromBackend}
      onSearch={searchCustomers}
    >
      <ListViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER}>
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

export function CustomerOrdersListScreen() {
  return (
    <CustomerOrdersListProvider>
      <CustomerOrdersListContent />
    </CustomerOrdersListProvider>
  );
}
