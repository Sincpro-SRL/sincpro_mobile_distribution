import { SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";
import { SaleOrderLinePriceBadges } from "@sincpro/mobile-distribution/ui/components/molecules";
import { Display } from "@sincpro/mobile-ui";
import BoxIcon from "@sincpro/mobile-ui/icons/BoxIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";

interface SaleOrderLineRowProps {
  line: SaleOrderLine;
  currencySymbol?: string;
  readonly?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}

export function SaleOrderLineRow({
  line,
  currencySymbol = "₡",
  readonly = false,
  isLast = false,
  onPress,
  onDelete,
}: SaleOrderLineRowProps) {
  if (readonly) {
    return <SaleOrderLineReadOnlyRow currencySymbol={currencySymbol} line={line} />;
  }

  return (
    <SaleOrderLineEditableRow
      currencySymbol={currencySymbol}
      isLast={isLast}
      line={line}
      onDelete={onDelete}
      onPress={onPress}
    />
  );
}

function SaleOrderLineReadOnlyRow({
  line,
  currencySymbol,
}: {
  line: SaleOrderLine;
  currencySymbol: string;
}) {
  const discountPercent = line.discount || 0;

  return (
    <View className="flex-row py-2">
      <View className="justify-center items-center mr-4 p-2 rounded-lg bg-bg-muted">
        <Display.Icon customIcon={BoxIcon} size={40} type="custom" />
      </View>
      <View className="flex-1">
        <Typography.Text numberOfLines={1} semibold variant="body">
          {line.name}
        </Typography.Text>
        <View className="flex-row items-center gap-1.5 flex-wrap mt-1">
          <Display.Monetary currencySymbol={currencySymbol} value={line.priceUnit} />
          <SaleOrderLinePriceBadges discountPercent={discountPercent} />
        </View>
      </View>
      <View className="justify-center pl-2">
        <Typography.Text variant="caption">(× {line.quantity})</Typography.Text>
      </View>
    </View>
  );
}

function SaleOrderLineEditableRow({
  line,
  currencySymbol,
  isLast,
  onPress,
  onDelete,
}: {
  line: SaleOrderLine;
  currencySymbol: string;
  isLast: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const discountPercent = line.discount || 0;
  const total = line.priceSubtotal || line.priceUnit * line.quantity;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn(
        "flex-row items-center py-3",
        !isLast && "border-b border-border-default",
      )}
      onPress={onPress}
    >
      <View className="justify-center items-center mr-3 p-2 rounded-lg bg-bg-muted">
        <Display.Icon customIcon={BoxIcon} size={40} type="custom" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Typography.Text className="flex-1 mr-2" numberOfLines={1} variant="bodySmall">
            {line.name}
          </Typography.Text>
          <Typography.Text semibold variant="bodySmall">
            (×{line.quantity})
          </Typography.Text>
        </View>
        <View className="flex-row items-center gap-1.5 flex-wrap mt-1">
          <Display.Monetary currencySymbol={currencySymbol} value={total} />
          <SaleOrderLinePriceBadges discountPercent={discountPercent} />
        </View>
      </View>
      {onDelete && (
        <TouchableOpacity className="p-2 ml-2" onPress={onDelete}>
          <Display.Icon name="trash-2" size={20} type="feather" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
