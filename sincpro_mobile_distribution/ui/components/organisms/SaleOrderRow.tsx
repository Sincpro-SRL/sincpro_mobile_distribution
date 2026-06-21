import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { SaleOrderCardHeader } from "@sincpro/mobile-distribution/ui/components/molecules";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface SaleOrderRowProps {
  saleOrder: SaleOrder;
  onPress?: () => void;
  readonly?: boolean;
}

export function SaleOrderRow({ saleOrder, onPress, readonly }: SaleOrderRowProps) {
  return (
    <View
      className="bg-bg-card border border-border-default rounded-2xl mx-4 p-3 mb-3 shadow-sm"
      style={theme.shadow["sm"]}
    >
      <SaleOrderCardHeader
        className="bg-bg-page border-border-default rounded-2xl shadow-sm"
        saleOrder={saleOrder}
      >
        <SaleOrderCardHeader.ScheduledDate value={saleOrder.scheduledDate} />
      </SaleOrderCardHeader>

      <View className="flex-row justify-between items-center p-3">
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
          <Typography.Text semibold variant="body">
            {saleOrder.productCount} {saleOrder.productCount === 1 ? "producto" : "productos"}
          </Typography.Text>
        </View>
        <Display.Monetary
          currencySymbol={saleOrder.currencySymbol}
          value={saleOrder.amountResidual || 0}
        />
      </View>

      <Form.Button
        disabled={readonly}
        onPress={onPress}
        size="small"
        title="Ver detalles"
        variant="accent"
      />
    </View>
  );
}
