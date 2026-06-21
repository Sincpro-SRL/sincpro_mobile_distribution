import { Form } from "@sincpro/mobile-ui/Form";
import { View } from "react-native";

interface SaleOrderCreateActionsProps {
  onSaveAsQuote: () => void;
  onConfirmAndCharge: () => void;
  isLoading?: boolean;
  readonly?: boolean;
}

export function SaleOrderCreateActions({
  onSaveAsQuote,
  onConfirmAndCharge,
  isLoading = false,
  readonly = false,
}: SaleOrderCreateActionsProps) {
  return (
    <View className="p-3 gap-2">
      <Form.Button
        disabled={isLoading || readonly}
        loading={isLoading}
        onPress={onConfirmAndCharge}
        size="small"
        title="Confirmar y cobrar"
        variant="accent"
      />
      <Form.Button
        disabled={isLoading}
        loading={isLoading}
        onPress={onSaveAsQuote}
        size="small"
        title="Guardar cotización"
        variant="outline"
      />
    </View>
  );
}
