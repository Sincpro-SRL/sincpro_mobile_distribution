import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { LegalEntityTypes } from "@sincpro/mobile-distribution/domain/customer";
import { Typography } from "@sincpro/mobile-ui";
import { View } from "react-native";

interface CustomerInfoCardProps {
  customer: Customer;
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  const legalEntityLabel =
    customer.legalEntityType === LegalEntityTypes.COMPANY ? `Empresa` : `Persona Física`;

  return (
    <View className="bg-bg-card p-3 rounded-lg gap-3 border border-border-default shadow-sm">
      <View className="border-b border-border-default pb-2">
        <Typography.Text className="text-text-primary" semibold variant="bodySmall">
          {`Información del cliente`}
        </Typography.Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-0.5">
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            {`ID Cliente`}
          </Typography.Text>
          <Typography.Text semibold variant="body">
            {customer.vat || `N/A`}
          </Typography.Text>
        </View>

        <View className="flex-1 gap-0.5">
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            {`Entidad Legal`}
          </Typography.Text>
          <Typography.Text semibold variant="body">
            {legalEntityLabel}
          </Typography.Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-0.5">
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            {`Nombre`}
          </Typography.Text>
          <Typography.Text numberOfLines={2} semibold variant="body">
            {customer.name || `N/A`}
          </Typography.Text>
        </View>

        {customer.city && (
          <View className="flex-1 gap-0.5">
            <Typography.Text className="text-text-tertiary" variant="bodySmall">
              {`Ciudad`}
            </Typography.Text>
            <Typography.Text semibold variant="body">
              {customer.city}
            </Typography.Text>
          </View>
        )}
      </View>
    </View>
  );
}
