import { Form } from "@sincpro/mobile-ui/Form";
import AddItemIcon from "@sincpro/mobile-ui/icons/AddItemIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface ProductSelectorButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function ProductSelectorButton({
  onPress,
  disabled = false,
}: ProductSelectorButtonProps) {
  return (
    <View className="gap-2 py-1.5 px-4 my-2">
      <Typography.Text semibold variant="body">
        {`Productos`}
      </Typography.Text>
      <Form.Button
        disabled={disabled}
        icon={<AddItemIcon color={theme.warning} size={16} />}
        onPress={onPress}
        title="Agregar un producto"
        variant="outline"
      />
    </View>
  );
}
