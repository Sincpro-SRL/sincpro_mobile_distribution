import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { CustomerCreatedEvent } from "@sincpro/mobile-distribution/domain/customer/events";
import { CustomerListTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { Form } from "@sincpro/mobile-ui";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useEffect } from "react";

import { ECreateOrderStep, useCreateOrderWizard } from "./context";

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
    handleCustomerSelect,
  } = useCreateOrderWizard();

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
    handleCustomerSelect(customer);
    wizard.goToStep(ECreateOrderStep.FORM_OVERVIEW);
  }

  return (
    <CustomerListTemplate
      customers={customers}
      description="Escoge el cliente para la orden"
      isLoading={isLoadingCustomers}
      onBack={() => wizard.goToStep(ECreateOrderStep.FORM_OVERVIEW)}
      onRefresh={refreshCustomersFromBackend}
      onSearch={searchCustomers}
      onSelect={handleSelectCustomer}
      title="Seleccionar Cliente"
    >
      <CustomerListTemplate.HeaderActions>
        <Form.Button
          className="bg-bg-card"
          onPress={() => wizard.goToStep(ECreateOrderStep.CUSTOMER_CREATE)}
          size="small"
          title="Cliente nuevo"
          variant="outline"
        />
      </CustomerListTemplate.HeaderActions>
    </CustomerListTemplate>
  );
}
