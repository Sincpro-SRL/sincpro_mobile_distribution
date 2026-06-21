import { Form } from "@sincpro/mobile-ui/Form";
import ProfileIcon from "@sincpro/mobile-ui/icons/ProfileIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";

interface CustomerSelectorButtonProps {
  customerId?: number | null;
  customerName?: string | null;
  customerVat?: string | null;
  onSelect: () => void;
  onChange?: () => void;
  readonly?: boolean;
}

export function CustomerSelectorButton({
  customerId = null,
  customerName = null,
  customerVat = null,
  onSelect,
  onChange,
  readonly = false,
}: CustomerSelectorButtonProps) {
  const hasCustomer = customerName && customerId;

  return (
    <View className="gap-2 py-1.5 px-4 my-2">
      <Typography.Text semibold variant="body">
        Cliente
      </Typography.Text>
      {hasCustomer ? (
        <View className="flex-row justify-between items-center py-3 px-4 border border-border-default rounded-xl">
          <View className="flex-1">
            <Typography.Text semibold variant="body">
              {customerName}
            </Typography.Text>
            <Typography.Text variant="body">{customerVat}</Typography.Text>
          </View>
          {onChange && !readonly && (
            <TouchableOpacity className="py-2 px-3" onPress={onChange}>
              <Typography.Text semibold underline variant="bodySmall">
                {`Cambiar`}
              </Typography.Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Form.Button
          disabled={readonly}
          icon={<ProfileIcon color={theme.warning} size={20} />}
          onPress={onSelect}
          title={`Agregar un cliente`}
          variant="outline"
        />
      )}
    </View>
  );
}
