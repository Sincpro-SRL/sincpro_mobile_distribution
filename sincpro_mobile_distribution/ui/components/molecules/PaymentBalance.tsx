import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { createContext, ReactNode, useContext } from "react";
import { View } from "react-native";

interface PaymentBalanceContextValue {
  totalToPay: number;
  totalPaid: number;
  remainingToPay: number;
  currencySymbol: string;
}

const PaymentBalanceContext = createContext<PaymentBalanceContextValue | null>(null);

function usePaymentBalanceContext() {
  const context = useContext(PaymentBalanceContext);
  if (!context) {
    throw new Error(
      "PaymentBalance compound components must be used within PaymentBalance.Root",
    );
  }
  return context;
}

function formatMoney(value: number, currencySymbol: string): string {
  return `${currencySymbol}${value.toFixed(2)}`;
}

interface RootProps {
  totalToPay: number;
  totalPaid: number;
  remainingToPay: number;
  currencySymbol?: string;
  children: ReactNode;
}

function Root({
  totalToPay,
  totalPaid,
  remainingToPay,
  currencySymbol = "₡",
  children,
}: RootProps) {
  return (
    <PaymentBalanceContext.Provider
      value={{ totalToPay, totalPaid, remainingToPay, currencySymbol }}
    >
      <View className="bg-bg-card rounded-lg p-4 gap-3">{children}</View>
    </PaymentBalanceContext.Provider>
  );
}

function TotalToPay() {
  const { totalToPay, currencySymbol } = usePaymentBalanceContext();

  return (
    <View className="flex-row justify-between items-center">
      <Typography.Text variant="bodySmall">{`Total a pagar`}</Typography.Text>
      <Typography.Text semibold variant="body">
        {formatMoney(totalToPay, currencySymbol)}
      </Typography.Text>
    </View>
  );
}

function TotalPaid() {
  const { totalPaid, currencySymbol } = usePaymentBalanceContext();

  return (
    <View className="flex-row justify-between items-center">
      <Typography.Text variant="bodySmall">{`Total pagado`}</Typography.Text>
      <Typography.Text className="text-success" semibold variant="body">
        {formatMoney(totalPaid, currencySymbol)}
      </Typography.Text>
    </View>
  );
}

function RemainingToPay() {
  const { remainingToPay, currencySymbol } = usePaymentBalanceContext();
  const isComplete = remainingToPay <= 0;

  return (
    <View className="flex-row justify-between items-center border-t border-border-default pt-3">
      <Typography.Text semibold variant="body">
        {isComplete ? `Completado` : `Restante`}
      </Typography.Text>
      <Typography.Text
        className={isComplete ? "text-success" : "text-warning"}
        semibold
        variant="bodyLarge"
      >
        {formatMoney(Math.abs(remainingToPay), currencySymbol)}
      </Typography.Text>
    </View>
  );
}

export const PaymentBalance = {
  Root,
  TotalToPay,
  TotalPaid,
  RemainingToPay,
};
