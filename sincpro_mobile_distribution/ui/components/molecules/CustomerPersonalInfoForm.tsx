import {
  IDENTIFICATION_TYPE_LABEL,
  IdentificationType,
  LegalEntityTypes,
} from "@sincpro/mobile-distribution/domain/customer";
import { CustomerFormValues } from "@sincpro/mobile-distribution/ui/components/organisms";
import { Form, Typography } from "@sincpro/mobile-ui";
import { Control, FieldErrors } from "react-hook-form";
import { View } from "react-native";

interface CustomerPersonalInfoFormProps {
  control: Control<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
  legalEntityType: LegalEntityTypes;
}

export function CustomerPersonalInfoForm({
  control,
  errors,
  legalEntityType,
}: CustomerPersonalInfoFormProps) {
  const identificationOptions = Object.entries(IDENTIFICATION_TYPE_LABEL).map(
    ([value, label]) => ({
      label,
      value: value as IdentificationType,
    }),
  );

  return (
    <View className="gap-3">
      <View className="gap-2">
        <Typography.Text className="text-text-primary font-semibold mb-1" variant="bodySmall">
          {`Tipo de Identificaci\u00f3n`}
        </Typography.Text>
        <View className="flex-row flex-wrap gap-2">
          {identificationOptions.map((option) => (
            <View className="w-[48%]" key={option.value}>
              <Form.ControlledRadioButton
                control={control}
                label={option.label}
                name="identificationType"
                value={option.value}
              />
            </View>
          ))}
        </View>
      </View>

      <Form.ControlledInput
        control={control}
        error={errors.vat?.message}
        keyboardType="numeric"
        label="Cédula/NIT"
        name="vat"
        placeholder="Ej: 123456789"
        rules={{
          required: "La cédula es requerida",
          pattern: {
            value: /^[0-9]+$/,
            message: "Solo se permiten números",
          },
        }}
      />

      {legalEntityType === LegalEntityTypes.INDIVIDUAL ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Form.ControlledInput
              control={control}
              error={errors.firstName?.message}
              label="Nombre"
              name="firstName"
              placeholder="Juan"
              rules={{ required: "Requerido" }}
            />
          </View>
          <View className="flex-1">
            <Form.ControlledInput
              control={control}
              error={errors.lastName?.message}
              label="Apellidos"
              name="lastName"
              placeholder="Pérez"
              rules={{ required: "Requerido" }}
            />
          </View>
        </View>
      ) : (
        <Form.ControlledInput
          control={control}
          error={errors.companyName?.message}
          label="Razón Social"
          name="companyName"
          placeholder="Nombre de la empresa"
          rules={{ required: "La razón social es requerida" }}
        />
      )}
    </View>
  );
}
