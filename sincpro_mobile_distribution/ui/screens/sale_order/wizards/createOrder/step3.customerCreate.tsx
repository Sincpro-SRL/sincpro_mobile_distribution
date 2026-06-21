import {
  Customer,
  ECustomerRouteStatus,
  IdentificationType,
  LegalEntityTypes,
} from "@sincpro/mobile-distribution/domain/customer";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import { CustomerFormValues } from "@sincpro/mobile-distribution/ui/components/organisms";
import { CustomerFormTemplate } from "@sincpro/mobile-distribution/ui/components/templates";
import { Form } from "@sincpro/mobile-ui";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ECreateOrderStep, useCreateOrderWizard } from "./context";

interface StepCustomerCreateProps {
  wizard: WizardContextValue;
}

export function StepCustomerCreate({ wizard }: StepCustomerCreateProps) {
  const { handleCustomerSelect } = useCreateOrderWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalEntityType, setLegalEntityType] = useState<LegalEntityTypes>(
    LegalEntityTypes.INDIVIDUAL,
  );

  const {
    control,
    handleSubmit,
    watch,
    reset: resetForm,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    mode: "onBlur",
    defaultValues: {
      vat: "",
      identificationType: IdentificationType.FISICA,
      firstName: "",
      lastName: "",
      companyName: "",
      phone: "",
      email: "",
      address: "",
      economicActivityCode: "",
    },
  });

  const identificationType = watch("identificationType");

  useEffect(() => {
    const newLegalEntityType =
      identificationType === IdentificationType.JURIDICA
        ? LegalEntityTypes.COMPANY
        : LegalEntityTypes.INDIVIDUAL;
    setLegalEntityType(newLegalEntityType);
  }, [identificationType]);

  const createCustomer = useCallback(
    async (data: CustomerFormValues) => {
      setIsSubmitting(true);
      try {
        const customerName =
          legalEntityType === LegalEntityTypes.INDIVIDUAL
            ? `${data.firstName} ${data.lastName}`.trim()
            : data.companyName || "";

        const customerData: Partial<Customer> = {
          name: customerName,
          vat: data.vat,
          ref: "",
          identificationType: data.identificationType,
          legalEntityType,
          email: data.email,
          phone: data.phone,
          address: data.address,
          economicActivityCode: data.economicActivityCode,
          routeStatus: ECustomerRouteStatus.CREATED_IN_ROUTE,
        };

        const customer = Customer.obj(customerData);
        const created = await customerService.createCustomer(
          customer,
          ECustomerRouteStatus.CREATED_IN_ROUTE,
        );

        handleCustomerSelect(created);
        wizard.goToStep(ECreateOrderStep.FORM_OVERVIEW);
      } finally {
        setIsSubmitting(false);
      }
    },
    [legalEntityType, handleCustomerSelect, wizard],
  );

  const submit = useCallback(() => {
    handleSubmit(createCustomer)();
  }, [handleSubmit, createCustomer]);

  useEffect(() => {
    return () => resetForm();
  }, [resetForm]);

  return (
    <CustomerFormTemplate
      control={control}
      description="Crear cliente para la orden"
      errors={errors}
      isSubmitting={isSubmitting}
      legalEntityType={legalEntityType}
      onBack={() => wizard.goToStep(ECreateOrderStep.CUSTOMER_SELECTION)}
      title="Nuevo Cliente"
    >
      <CustomerFormTemplate.Footer>
        <Form.Button
          loading={isSubmitting}
          onPress={submit}
          title="Registrar y Seleccionar"
          variant="accent"
        />
      </CustomerFormTemplate.Footer>
    </CustomerFormTemplate>
  );
}
