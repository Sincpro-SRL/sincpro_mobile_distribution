import { Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { createContext, ReactNode, useContext } from "react";
import { View } from "react-native";

interface PaymentSummaryContextValue {
  currencySymbol: string;
}

const PaymentSummaryContext = createContext<PaymentSummaryContextValue | null>(null);

function usePaymentSummaryContext() {
  const context = useContext(PaymentSummaryContext);
  if (!context) {
    throw new Error(
      "PaymentSummary compound components must be used within PaymentSummary.Root",
    );
  }
  return context;
}

interface RootProps {
  currencySymbol?: string;
  children: ReactNode;
}

function Root({ currencySymbol = "₡", children }: RootProps) {
  return (
    <PaymentSummaryContext.Provider value={{ currencySymbol }}>
      <View className="bg-bg-card rounded-lg p-3 gap-1.5">{children}</View>
    </PaymentSummaryContext.Provider>
  );
}

interface LineProps {
  label: string;
  value: number;
  color?: string;
  isNegative?: boolean;
  isTotal?: boolean;
  separator?: boolean;
}

function Line({
  label,
  value,
  color,
  isNegative = false,
  isTotal = false,
  separator = false,
}: LineProps) {
  const { currencySymbol } = usePaymentSummaryContext();

  const variant = isTotal ? "bodyLarge" : "body";
  const displayValue = isNegative ? -value : value;

  return (
    <View
      className={cn(
        "flex-row justify-between items-center",
        separator && "border-t border-border-default pt-1.5 mt-1",
        isTotal && "pt-1.5 mt-1",
      )}
    >
      <Typography.Text semibold={isTotal} variant={variant}>
        {label}
      </Typography.Text>
      <Display.Monetary
        color={color}
        currencySymbol={currencySymbol}
        semibold={isTotal}
        textVariant={variant}
        value={displayValue}
      />
    </View>
  );
}

function Subtotal({ value }: { value: number }) {
  return <Line label="Subtotal" value={value} />;
}

function Paid({ value }: { value: number }) {
  if (value <= 0) return null;
  return <Line color="#22c55e" isNegative label="Total pagado" value={value} />;
}

function Discount({ value }: { value: number }) {
  if (value <= 0) return null;
  return <Line color="#f97316" isNegative label="Descuento" value={value} />;
}

function Exemptions({ value }: { value: number }) {
  if (value <= 0) return null;
  return <Line color="#f97316" isNegative label="Exoneraciones" value={value} />;
}

function Taxes({ value }: { value: number }) {
  return <Line label="Impuestos" separator value={value} />;
}

function Total({ value, label = "Total" }: { value: number; label?: string }) {
  return <Line isTotal label={label} value={value} />;
}

export const PaymentSummary = {
  Root,
  Line,
  Subtotal,
  Paid,
  Discount,
  Exemptions,
  Taxes,
  Total,
};
