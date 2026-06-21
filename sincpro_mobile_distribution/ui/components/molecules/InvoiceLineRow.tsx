import type { InvoiceLine } from "@sincpro/mobile-distribution/domain/invoice";
import { Display } from "@sincpro/mobile-ui";
import BoxIcon from "@sincpro/mobile-ui/icons/BoxIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface InvoiceLineRowProps {
  line: InvoiceLine;
  currencySymbol?: string;
  isLast?: boolean;
}

export function InvoiceLineRow({
  line,
  currencySymbol = "₡",
  isLast = false,
}: InvoiceLineRowProps) {
  const discountPercent = line.discount || 0;
  const total = line.priceSubtotal || line.priceUnit * line.quantity;

  return (
    <View
      className={cn(
        "flex-row items-center py-3 gap-3",
        !isLast && "border-b border-border-default",
      )}
    >
      <View className="w-10 h-10 justify-center items-center">
        <Display.Icon customIcon={BoxIcon} size={40} type="custom" />
      </View>
      <View className="flex-1 gap-1">
        <Typography.Text className="flex-1" numberOfLines={2} variant="bodySmall">
          {line.name}
        </Typography.Text>
        <View className="flex-row items-center gap-2">
          <Display.Monetary
            color={theme.text.secondary}
            currencySymbol={currencySymbol}
            textVariant="caption"
            value={line.priceUnit}
          />
          <Typography.Text className="text-text-tertiary" variant="caption">
            {`× ${line.quantity}`}
          </Typography.Text>
          {discountPercent > 0 && (
            <View className="bg-success/20 px-1.5 py-0.5 rounded">
              <Typography.Text className="text-success" variant="captionSmall">
                {`-${discountPercent}%`}
              </Typography.Text>
            </View>
          )}
        </View>
      </View>
      <View className="items-end">
        <Display.Monetary
          currencySymbol={currencySymbol}
          semibold
          textVariant="body"
          value={total}
        />
      </View>
    </View>
  );
}
