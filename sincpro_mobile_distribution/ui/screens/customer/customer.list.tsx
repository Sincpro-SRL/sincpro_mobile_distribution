import { CustomerListTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { AppBar } from "@sincpro/mobile-ui/Navigation/Navigation.AppBar";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { useEffect } from "react";

import {
  CustomerCreditFilter,
  CustomerListProvider,
  useCustomerList,
} from "./customer.list.context";

const FILTER_OPTIONS: { label: string; value: CustomerCreditFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Con crédito", value: "with_credit" },
  { label: "Sin crédito", value: "without_credit" },
];

function CustomerListScreenContent() {
  const {
    customers,
    isLoading,
    filterType,
    setFilterType,
    loadCustomers,
    searchCustomers,
    refreshFromBackend,
    reset,
    handleSelectCustomer,
    handleViewDetail,
    handleCreateCustomer,
    handleBack,
  } = useCustomerList();

  useEffect(() => {
    loadCustomers();
    return () => reset();
  }, [loadCustomers, reset]);

  return (
    <CustomerListTemplate
      customers={customers}
      description="Lista de clientes registrados"
      isLoading={isLoading}
      onBack={handleBack}
      onRefresh={refreshFromBackend}
      onSearch={searchCustomers}
      onSelect={handleSelectCustomer}
      onViewDetail={handleViewDetail}
      title="Clientes"
    >
      <CustomerListTemplate.Filters>
        <ListViewV2.Header.Filters.Chips>
          {FILTER_OPTIONS.map((option) => (
            <ListViewV2.Header.Filters.Chip
              active={filterType === option.value}
              key={option.value}
              label={option.label}
              onPress={() => setFilterType(option.value)}
            />
          ))}
        </ListViewV2.Header.Filters.Chips>
      </CustomerListTemplate.Filters>
      <CustomerListTemplate.AppBarActions>
        <AppBar.Action icon="add" onPress={handleCreateCustomer} tone="tinted" />
      </CustomerListTemplate.AppBarActions>
    </CustomerListTemplate>
  );
}

export function CustomerListScreen() {
  return (
    <CustomerListProvider>
      <CustomerListScreenContent />
    </CustomerListProvider>
  );
}
