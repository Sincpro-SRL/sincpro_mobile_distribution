import type { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { Display } from "@sincpro/mobile-ui/Display";
import { getIcon } from "@sincpro/mobile-ui/icons/icon_getters";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";

interface SaleOrderPaymentListProps {
  payments: Payment[];
  backgroundColor?: string;
  readonly?: boolean;
  onDelete?: (payment: Payment) => void;
  onPress?: (payment: Payment, index: number) => void;
}

function SaleOrderPaymentList({
  payments,
  backgroundColor,
  readonly = false,
  onDelete,
  onPress,
}: SaleOrderPaymentListProps) {
  function renderPaymentRow(payment: Payment, index: number) {
    const { icon: IconComponent, label } = getIcon(payment?.paymentMethod?.name);
    const isEditable = !readonly && onPress;

    const rowContent = (
      <>
        <View className="flex-row items-center gap-3">
          <Display.Icon customIcon={IconComponent} type="custom" />
          <Typography.Text className="max-w-[180px]" variant="caption">
            {payment.paymentMethod?.name || label}
          </Typography.Text>
        </View>
        <View className="flex-row items-center gap-4">
          <Typography.Text className="text-green-600" variant="body">
            ₡{payment.total.toFixed(2)}
          </Typography.Text>
          {isEditable && (
            <Display.Icon
              color={theme.text.secondary}
              name="chevron-right"
              size={16}
              type="feather"
            />
          )}
          {!readonly && onDelete && (
            <TouchableOpacity className="p-1" onPress={() => onDelete(payment)}>
              <Display.Icon color={theme.danger} name="trash-2" size={18} type="feather" />
            </TouchableOpacity>
          )}
        </View>
      </>
    );

    if (isEditable) {
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row justify-between items-center py-2.5 px-4 border-b border-border-default mb-2"
          key={index}
          onPress={() => onPress(payment, index)}
        >
          {rowContent}
        </TouchableOpacity>
      );
    }

    return (
      <View
        className="flex-row justify-between items-center py-2.5 px-4 border-b border-border-default mb-2"
        key={index}
      >
        {rowContent}
      </View>
    );
  }

  if (!payments || payments.length === 0) {
    return null;
  }

  return (
    <View className="px-2" style={backgroundColor ? { backgroundColor } : undefined}>
      {payments.map((payment, index) => renderPaymentRow(payment, index))}
    </View>
  );
}

export default SaleOrderPaymentList;
