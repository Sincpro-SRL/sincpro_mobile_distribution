import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { CustomerFormTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { Form } from "@sincpro/mobile-ui";
import { useEffect } from "react";
import { useNavigate } from "react-router-native";

import { CustomerFormProvider, useCustomerForm } from "./customer.form.context";

function CustomerFormScreenContent() {
  const navigate = useNavigate();
  const { isSubmitting, legalEntityType, control, errors, submit, reset } = useCustomerForm();

  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <CustomerFormTemplate
      control={control}
      description="Registro de datos del cliente"
      errors={errors}
      isSubmitting={isSubmitting}
      legalEntityType={legalEntityType}
      onBack={() => navigate(AppScreen.CUSTOMER_LIST)}
      title="Nuevo Cliente"
    >
      <CustomerFormTemplate.Footer>
        <Form.Button
          loading={isSubmitting}
          onPress={submit}
          title="Registrar Cliente"
          variant="accent"
        />
      </CustomerFormTemplate.Footer>
    </CustomerFormTemplate>
  );
}

export function CustomerFormScreen() {
  const navigate = useNavigate();

  return (
    <CustomerFormProvider onCreate={() => navigate(AppScreen.CUSTOMER_LIST)}>
      <CustomerFormScreenContent />
    </CustomerFormProvider>
  );
}
