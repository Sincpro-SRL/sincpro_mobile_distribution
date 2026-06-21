import { Form } from "@sincpro/mobile-ui/Form";
import { View } from "react-native";

interface SaleOrderUpdateActionsProps {
  isLoading: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

export function SaleOrderUpdateActions({
  isLoading,
  onSave,
  onCancel,
}: SaleOrderUpdateActionsProps) {
  return (
    <View className="flex-row gap-3 px-4">
      <View className="flex-1">
        <Form.Button
          disabled={isLoading}
          onPress={onCancel}
          title="Cancelar"
          variant="outline"
        />
      </View>
      <View className="flex-1">
        <Form.Button
          loading={isLoading}
          onPress={onSave}
          title="Guardar cambios"
          variant="accent"
        />
      </View>
    </View>
  );
}
