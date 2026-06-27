import { useNavigation } from "@react-navigation/native";
import type { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

import CashierPaymentRow from "../molecules/CashierPaymentRow";

interface CashierHistoryWidgetProps {
  payments: Payment[];
  formatDate: (date: string) => string;
  onPaymentPress?: (payment: Payment) => void;
  maxItems?: number;
}

function CashierHistoryWidget({
  payments,
  formatDate,
  onPaymentPress,
  maxItems = 5,
}: CashierHistoryWidgetProps) {
  const navigation = useNavigation();

  function handleViewAll() {
    navigation.navigate(AppScreen.CASHIER_HISTORY as never);
  }

  function handlePaymentPress(payment: Payment) {
    if (onPaymentPress) {
      onPaymentPress(payment);
    }
  }

  const displayPayments = payments.slice(0, maxItems);

  return (
    <View className="py-2">
      <View className="px-4 py-2 flex-row justify-between items-center">
        <Typography.Text semibold variant="body">
          Historial de cobros
        </Typography.Text>
        <Typography.Text
          className="text-text-tertiary"
          onPress={handleViewAll}
          underline
          variant="caption"
        >
          {`Ver todo`}
        </Typography.Text>
      </View>

      <View className="rounded-2xl">
        {displayPayments.length === 0 ? (
          <View className="p-6 items-center">
            <Typography.Text className="text-text-tertiary" variant="body">
              {"No hay pagos registrados"}
            </Typography.Text>
          </View>
        ) : (
          displayPayments.map((payment, index) => (
            <CashierPaymentRow
              formatDate={formatDate}
              key={payment.uuid || index}
              onPress={() => handlePaymentPress(payment)}
              payment={payment}
            />
          ))
        )}
      </View>
    </View>
  );
}

export default CashierHistoryWidget;
