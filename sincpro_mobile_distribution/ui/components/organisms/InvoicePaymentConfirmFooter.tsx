import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ReactNode } from "react";
import { View } from "react-native";

interface InvoicePaymentConfirmFooterProps {
  total: number;
  currencySymbol?: string;
  buttonText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  extraButtons?: ReactNode[];
}

export function InvoicePaymentConfirmFooter({
  total,
  currencySymbol = "₡",
  buttonText = "Confirmar pago",
  isLoading = false,
  disabled = false,
  onConfirm,
  extraButtons = [],
}: InvoicePaymentConfirmFooterProps) {
  const isDisabled = disabled || total <= 0;

  return (
    <View className="bg-bg-card border-t border-border-default p-4">
      <View className="flex-row justify-between items-center">
        <View>
          <Typography.Text className="text-text-secondary" variant="bodySmall">
            Total
          </Typography.Text>
          <Display.Monetary
            currencySymbol={currencySymbol}
            semibold
            textVariant="h3"
            value={total}
          />
        </View>

        <Form.Button
          className="min-w-[150px]"
          disabled={isDisabled}
          loading={isLoading}
          onPress={onConfirm}
          size="small"
          title={buttonText}
          variant="accent"
        />
      </View>

      {extraButtons.length > 0 && (
        <View className="mt-2 gap-2">
          {extraButtons.map((button, index) => (
            <View key={index}>{button}</View>
          ))}
        </View>
      )}
    </View>
  );
}
