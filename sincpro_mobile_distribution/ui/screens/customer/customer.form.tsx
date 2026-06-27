import { useNavigation } from "@react-navigation/native";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { CustomerFormTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { Form } from "@sincpro/mobile-ui";
import { useEffect } from "react";

import { CustomerFormProvider, useCustomerForm } from "./customer.form.context";

function CustomerFormScreenContent() {
  const navigation = useNavigation();
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
      onBack={() => navigation.navigate(AppScreen.CUSTOMER_LIST as never)}
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
  const navigation = useNavigation();

  return (
    <CustomerFormProvider
      onCreate={() => navigation.navigate(AppScreen.CUSTOMER_LIST as never)}
    >
      <CustomerFormScreenContent />
    </CustomerFormProvider>
  );
}
