import {
  IdentificationType,
  LegalEntityTypes,
} from "@sincpro/mobile-distribution/domain/customer";
import { Display } from "@sincpro/mobile-ui";
import { Control, FieldErrors } from "react-hook-form";
import { View } from "react-native";

import { CustomerContactInfoForm, CustomerPersonalInfoForm } from "../molecules";

export interface CustomerFormValues {
  vat: string;
  identificationType: IdentificationType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone: string;
  email: string;
  address?: string;
  economicActivityCode?: string;
}

interface CustomerCreateFormProps {
  control: Control<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
  legalEntityType: LegalEntityTypes;
}

export function CustomerCreateForm({
  control,
  errors,
  legalEntityType,
}: CustomerCreateFormProps) {
  return (
    <View className="gap-4 px-4 py-5">
      <CustomerPersonalInfoForm
        control={control}
        errors={errors}
        legalEntityType={legalEntityType}
      />

      <Display.Divider spacing={"md"} />

      <CustomerContactInfoForm control={control} errors={errors} />
    </View>
  );
}
