import type { InvoiceLine } from "@sincpro/mobile-distribution/domain/invoice";
import { Display } from "@sincpro/mobile-ui";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

import { InvoiceLineRow } from "../molecules/InvoiceLineRow";

interface InvoiceLineListProps {
  lines: InvoiceLine[];
  currencySymbol?: string;
  backgroundColor?: string;
}

export function InvoiceLineList({
  lines,
  currencySymbol = "₡",
  backgroundColor,
}: InvoiceLineListProps) {
  if (!lines || lines.length === 0) {
    return (
      <View className="p-4 items-center bg-bg-muted rounded-lg mx-4">
        <Typography.Text className="text-text-tertiary" variant="bodySmall">
          {`No hay líneas en esta factura`}
        </Typography.Text>
      </View>
    );
  }

  return (
    <View className="p-0" style={backgroundColor ? { backgroundColor } : undefined}>
      <View className="px-4 pt-4 pb-3 border-b border-border-default">
        <Display.CountRecords count={lines.length} name="productos" withPadding={false} />
      </View>
      <View className="px-4 py-3">
        {lines.map((line, index) => (
          <InvoiceLineRow
            currencySymbol={currencySymbol}
            isLast={index === lines.length - 1}
            key={line.uuid || `line-${index}`}
            line={line}
          />
        ))}
      </View>
    </View>
  );
}
