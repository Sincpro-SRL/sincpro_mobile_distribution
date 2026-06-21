import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";
import { View } from "react-native";

interface CustomerCreditBadgeProps {
  availableCredit: number;
  currencySymbol?: string;
}

export function CustomerCreditBadge({
  availableCredit,
  currencySymbol = "₡",
}: CustomerCreditBadgeProps) {
  if (availableCredit <= 0) return null;

  return (
    <View className="flex-row items-center gap-1">
      <Display.Badge label="Crédito" variant={BadgeVariants.SUCCESS} />
      <Display.Monetary
        currencySymbol={currencySymbol}
        semibold
        textVariant="captionSmall"
        value={availableCredit}
      />
    </View>
  );
}
