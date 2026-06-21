import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface SaleOrderLinePriceBadgesProps {
  isManualPrice?: boolean;
  priceListName?: string | null;
  discountPercent?: number;
}

export function SaleOrderLinePriceBadges({
  isManualPrice,
  priceListName,
  discountPercent,
}: SaleOrderLinePriceBadgesProps) {
  const showDiscount = typeof discountPercent === "number" && discountPercent > 0;

  return (
    <>
      {showDiscount && (
        <View className="bg-success-100 px-1.5 py-0.5 rounded-md">
          <Typography.Text className="text-success-800" variant="captionSmall">
            -{discountPercent!.toFixed(discountPercent! >= 10 ? 0 : 1)}%
          </Typography.Text>
        </View>
      )}
      {isManualPrice && (
        <View className="bg-warning-100 px-1.5 py-0.5 rounded-md">
          <Typography.Text className="text-warning-800" variant="captionSmall">
            Editado
          </Typography.Text>
        </View>
      )}
      {priceListName && !isManualPrice && (
        <View className="bg-bg-muted px-1.5 py-0.5 rounded-md">
          <Typography.Text className="text-text-secondary" variant="captionSmall">
            {priceListName}
          </Typography.Text>
        </View>
      )}
    </>
  );
}
