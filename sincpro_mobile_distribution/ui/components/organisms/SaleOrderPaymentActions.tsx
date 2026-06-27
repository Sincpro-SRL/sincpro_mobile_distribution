import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { createContext, ReactNode, useContext } from "react";
import { View } from "react-native";

interface PaymentActionsContextValue {
  isLoading?: boolean;
  currencySymbol: string;
}

const PaymentActionsContext = createContext<PaymentActionsContextValue | null>(null);

function usePaymentActionsContext() {
  const context = useContext(PaymentActionsContext);
  if (!context) {
    throw new Error(
      "PaymentActions compound components must be used within PaymentActions.Root",
    );
  }
  return context;
}

interface RootProps {
  isLoading?: boolean;
  currencySymbol?: string;
  children: ReactNode;
  compact?: boolean;
}

function Root({
  isLoading = false,
  currencySymbol = "₡",
  children,
  compact = false,
}: RootProps) {
  return (
    <PaymentActionsContext.Provider value={{ isLoading, currencySymbol }}>
      <View
        className={cn(
          "bg-bg-card border-t border-border-default gap-2",
          compact ? "p-2 gap-1.5" : "p-3",
        )}
      >
        {children}
      </View>
    </PaymentActionsContext.Provider>
  );
}

interface TotalDisplayProps {
  total: number;
  label?: string;
}

function TotalDisplay({ total, label = "Total" }: TotalDisplayProps) {
  const { currencySymbol } = usePaymentActionsContext();

  return (
    <View className="flex-col gap-0.5">
      <Typography.Text className="text-text-tertiary" variant="bodySmall">
        {label}
      </Typography.Text>
      <Display.Monetary
        currencySymbol={currencySymbol}
        semibold
        textVariant="bodyLarge"
        value={total}
      />
    </View>
  );
}

interface PrimaryActionProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function PrimaryAction({ label, onPress, disabled = false }: PrimaryActionProps) {
  const { isLoading } = usePaymentActionsContext();

  return (
    <Form.Button
      className="min-w-[160px]"
      disabled={disabled || isLoading}
      loading={isLoading}
      onPress={onPress}
      size="small"
      title={label}
      variant="accent"
    />
  );
}

interface SecondaryActionProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: "outline" | "outlineDanger";
}

function SecondaryAction({
  label,
  onPress,
  icon,
  variant = "outline",
}: SecondaryActionProps) {
  const { isLoading } = usePaymentActionsContext();

  return (
    <Form.Button
      className="mt-1"
      disabled={isLoading}
      icon={icon}
      onPress={onPress}
      size="small"
      title={label}
      variant={variant}
    />
  );
}

interface InlineRowProps {
  children: ReactNode;
}

function InlineRow({ children }: InlineRowProps) {
  return <View className="flex-row justify-between items-center">{children}</View>;
}

export const SaleOrderPaymentActions = {
  Root,
  TotalDisplay,
  PrimaryAction,
  SecondaryAction,
  InlineRow,
};
