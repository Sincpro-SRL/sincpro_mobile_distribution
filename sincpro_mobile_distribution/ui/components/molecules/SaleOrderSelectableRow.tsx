import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { Display } from "@sincpro/mobile-ui/Display";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";

import { SaleOrderCardHeader } from "./SaleOrderCardHeader";

interface SaleOrderSelectableRowProps {
  saleOrder: SaleOrder;
  isSelected: boolean;
  onSelect: (saleOrder: SaleOrder) => void;
  disabled?: boolean;
}

export function SaleOrderSelectableRow({
  saleOrder,
  isSelected,
  onSelect,
  disabled = false,
}: SaleOrderSelectableRowProps) {
  const hasInvoices = saleOrder.invoiceIds && saleOrder.invoiceIds.length > 0;
  const isDisabled = disabled || !hasInvoices;

  const containerClass = isSelected
    ? isDisabled
      ? "bg-bg-card border-2 border-primary-500 rounded-[15px] mx-4 p-2 mb-3 shadow-lg opacity-60"
      : "bg-bg-card border-2 border-primary-500 rounded-[15px] mx-4 p-2 mb-3 shadow-lg"
    : isDisabled
      ? "bg-bg-card border border-border-default rounded-[15px] mx-4 p-2 mb-3 shadow-lg opacity-60"
      : "bg-bg-card border border-border-default rounded-[15px] mx-4 p-2 mb-3 shadow-lg";

  const statusDotClass = isDisabled
    ? "w-2 h-2 rounded-full mr-2 bg-text-tertiary"
    : "w-2 h-2 rounded-full mr-2 bg-success";

  return (
    <TouchableOpacity className={containerClass} onPress={() => onSelect(saleOrder)}>
      <SaleOrderCardHeader saleOrder={saleOrder}>
        <SaleOrderCardHeader.ScheduledDate value={saleOrder.scheduledDate} />
      </SaleOrderCardHeader>
      <View className="flex-row justify-between items-center p-3">
        <View className="flex-row items-center">
          <View className={statusDotClass} />
          <Typography.Text semibold variant="body">
            {`${saleOrder.productCount} ${saleOrder.productCount === 1 ? "producto" : "productos"}`}
          </Typography.Text>
        </View>
        <Display.Monetary
          currencySymbol={saleOrder.currencySymbol}
          value={saleOrder.amountTotal || 0}
        />
      </View>
      {!hasInvoices && (
        <Typography.Text className="text-warning px-3 pb-2" variant="caption">
          {`Sin factura - No disponible para devolución`}
        </Typography.Text>
      )}
    </TouchableOpacity>
  );
}
