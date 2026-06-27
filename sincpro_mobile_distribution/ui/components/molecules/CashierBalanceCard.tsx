import type { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { Display } from "@sincpro/mobile-ui/Display";
import WalletMoneyIcon from "@sincpro/mobile-ui/icons/WalletMoneyIcon";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";

interface CashierBalanceCardProps {
  totalAmount: number;
  groupedPayments: Record<string, Payment[]>;
  currencySymbol?: string;
  onMethodPress?: (methodName: string) => void;
}

function CashierBalanceCard({
  totalAmount,
  groupedPayments,
  currencySymbol = "₡",
  onMethodPress,
}: CashierBalanceCardProps) {
  function renderGroupedPayments() {
    const entries = Object.entries(groupedPayments);
    if (entries.length === 0) return null;

    return entries.map(([method, payments]) => {
      const methodTotal = payments.reduce((sum, p) => sum + p.value, 0);
      const PaymentMethodContainer = onMethodPress ? TouchableOpacity : View;

      return (
        <PaymentMethodContainer
          className={cn("pt-2 items-start w-1/2", onMethodPress && "opacity-90")}
          key={method}
          onPress={onMethodPress ? () => onMethodPress(method) : undefined}
        >
          <Display.Monetary
            currencySymbol={currencySymbol}
            semibold
            textVariant="body"
            value={methodTotal}
          />
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            {method}
          </Typography.Text>
        </PaymentMethodContainer>
      );
    });
  }

  return (
    <View className="bg-bg-card rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center justify-center mb-4">
        <View className="w-[48px] h-[48px] rounded-full bg-success/10 justify-center items-center mr-4">
          <Display.Icon customIcon={WalletMoneyIcon} type="custom" />
        </View>
        <View>
          <Display.Monetary
            className="mb-0.5"
            currencySymbol={currencySymbol}
            semibold
            textVariant="h5"
            value={totalAmount}
          />
          <Typography.Text className="text-text-secondary" variant="bodySmall">
            {`Total acumulado`}
          </Typography.Text>
        </View>
      </View>

      {Object.keys(groupedPayments).length > 0 && (
        <View className="border-t border-border-default flex-row flex-wrap pt-4">
          {renderGroupedPayments()}
        </View>
      )}
    </View>
  );
}

export default CashierBalanceCard;
