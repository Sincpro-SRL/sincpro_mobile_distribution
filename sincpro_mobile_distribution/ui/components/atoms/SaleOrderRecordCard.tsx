import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface SaleOrderRecordCardProps {
  orderName: string;
  scheduledDate: string;
  secondLabel?: string;
  secondValue?: string;
  className?: string;
}

export function SaleOrderRecordCard({
  orderName,
  scheduledDate,
  secondLabel = "Fecha de orden",
  secondValue,
  className,
}: SaleOrderRecordCardProps) {
  return (
    <View className={cn("my-1.5 mx-3 flex-row justify-between items-start p-2.5", className)}>
      <View>
        <Typography.Text className="text-text-secondary" variant="bodySmall">
          {`Nro de orden`}
        </Typography.Text>
        <Typography.Text variant="h5">{orderName}</Typography.Text>
      </View>
      <View className="items-end">
        <Typography.Text className="text-text-secondary" variant="bodySmall">
          {secondLabel}
        </Typography.Text>
        <Typography.Text variant="h5">{secondValue || scheduledDate}</Typography.Text>
      </View>
    </View>
  );
}
