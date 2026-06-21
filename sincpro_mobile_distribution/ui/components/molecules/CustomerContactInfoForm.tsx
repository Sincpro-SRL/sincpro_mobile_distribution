import { CustomerFormValues } from "@sincpro/mobile-distribution/ui/components/organisms";
import { Form, Typography } from "@sincpro/mobile-ui";
import { Control, FieldErrors } from "react-hook-form";
import { View } from "react-native";

interface CustomerContactInfoFormProps {
  control: Control<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
}

export function CustomerContactInfoForm({ control, errors }: CustomerContactInfoFormProps) {
  return (
    <View className="gap-3">
      <View className="border-b border-border-default pb-2 mb-1">
        <Typography.Text
          className="text-text-primary font-bold tracking-wide"
          variant="bodySmall"
        >
          {`INFORMACIÓN DE CONTACTO`}
        </Typography.Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Form.ControlledInput
            control={control}
            error={errors.phone?.message}
            keyboardType="phone-pad"
            label="Teléfono"
            name="phone"
            placeholder="8888-8888"
            rules={{
              required: "Requerido",
              pattern: {
                value: /^[0-9-]+$/,
                message: "Número inválido",
              },
            }}
          />
        </View>
        <View className="flex-1">
          <Form.ControlledInput
            control={control}
            error={errors.economicActivityCode?.message}
            label="Código Actividad"
            name="economicActivityCode"
            placeholder="Ej: 012345"
            rules={{ required: "Requerido" }}
          />
        </View>
      </View>

      <Form.ControlledInput
        autoCapitalize="none"
        control={control}
        error={errors.email?.message}
        keyboardType="email-address"
        label="Correo Electrónico"
        name="email"
        placeholder="cliente@ejemplo.com"
        rules={{
          required: "El correo es requerido",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Correo inválido",
          },
        }}
      />

      <Form.ControlledInput
        control={control}
        label="Dirección (opcional)"
        multiline
        name="address"
        numberOfLines={2}
        placeholder="Provincia, Cantón, Distrito..."
      />
    </View>
  );
}
