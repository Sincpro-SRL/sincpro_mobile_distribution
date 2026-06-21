import { SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";
import { Display } from "@sincpro/mobile-ui";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { View } from "react-native";

import { SaleOrderLineRow } from "./SaleOrderLineRow";

interface SaleOrderLineListProps {
  lines: SaleOrderLine[];
  currencySymbol?: string;
  className?: string;
  readonly?: boolean;
  onPressLine?: (line: SaleOrderLine) => void;
  onDeleteLine?: (line: SaleOrderLine) => void;
}

export function SaleOrderLineList({
  lines,
  currencySymbol = "₡",
  className,
  readonly = false,
  onPressLine,
  onDeleteLine,
}: SaleOrderLineListProps) {
  if (!lines || lines.length === 0) {
    return null;
  }

  return (
    <View className={cn("p-3", className)}>
      <Display.CountRecords count={lines.length} name="productos" withPadding={false} />
      {lines.map((line, index) => (
        <SaleOrderLineRow
          currencySymbol={currencySymbol}
          isLast={index === lines.length - 1}
          key={line.uuid}
          line={line}
          onDelete={readonly ? undefined : () => onDeleteLine?.(line)}
          onPress={readonly ? undefined : () => onPressLine?.(line)}
          readonly={readonly}
        />
      ))}
    </View>
  );
}
