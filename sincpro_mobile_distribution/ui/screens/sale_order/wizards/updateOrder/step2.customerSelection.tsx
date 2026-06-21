import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { CustomerCreatedEvent } from "@sincpro/mobile-distribution/domain/customer/events";
import { CustomerListTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useEffect } from "react";

import { EUpdateOrderStep, useUpdateOrderWizard } from "./context";

interface StepCustomerSelectionProps {
  wizard: WizardContextValue;
}

export function StepCustomerSelection({ wizard }: StepCustomerSelectionProps) {
  const {
    customers,
    isLoadingCustomers,
    loadCustomers,
    searchCustomers,
    refreshCustomersFromBackend,
    handleCustomerChange,
  } = useUpdateOrderWizard();

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const reload = () => void loadCustomers();
    UIEventBus.on(CustomerCreatedEvent.name, reload);
    return () => {
      UIEventBus.off(CustomerCreatedEvent.name, reload);
    };
  }, [loadCustomers]);

  function handleSelectCustomer(customer: Customer): void {
    handleCustomerChange(customer);
    wizard.goToStep(EUpdateOrderStep.FORM_OVERVIEW);
  }

  return (
    <CustomerListTemplate
      customers={customers}
      description="Selecciona el nuevo cliente para la orden"
      isLoading={isLoadingCustomers}
      onBack={() => wizard.goToStep(EUpdateOrderStep.FORM_OVERVIEW)}
      onRefresh={refreshCustomersFromBackend}
      onSearch={searchCustomers}
      onSelect={handleSelectCustomer}
      title="Cambiar Cliente"
    />
  );
}
