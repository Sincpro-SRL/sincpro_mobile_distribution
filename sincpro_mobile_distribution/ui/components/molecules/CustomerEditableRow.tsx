import { useCommon } from "@sincpro/mobile/entrypoints/ui/common_provider";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { Display } from "@sincpro/mobile-ui";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { useState } from "react";
import { Modal, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

import {
  CustomerAvatar,
  CustomerCreditBadge,
  CustomerExemptBadge,
  CustomerStatusIcon,
} from "../atoms";

interface CustomerEditableRowProps {
  customer: Customer;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetail?: () => void;
}

interface MenuOption {
  label: string;
  icon: string;
  onPress: () => void;
  visible?: boolean;
}

export function CustomerEditableRow({
  customer,
  onPress,
  onEdit,
  onDelete,
  onViewDetail,
}: CustomerEditableRowProps) {
  const { debugMode } = useCommon();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuOptions: MenuOption[] = [
    {
      label: "Ver detalle",
      icon: "eye",
      onPress: () => {
        setMenuVisible(false);
        onViewDetail?.();
      },
      visible: !!onViewDetail,
    },
    {
      label: "Ver eventos",
      icon: "activity",
      onPress: () => {
        setMenuVisible(false);
        onViewDetail?.();
      },
      visible: debugMode && !!onViewDetail,
    },
    {
      label: "Editar",
      icon: "edit-2",
      onPress: () => {
        setMenuVisible(false);
        onEdit?.();
      },
      visible: !!onEdit,
    },
    {
      label: "Eliminar",
      icon: "trash-2",
      onPress: () => {
        setMenuVisible(false);
        onDelete?.();
      },
      visible: !!onDelete,
    },
  ].filter((opt) => opt.visible !== false);

  const hasMenuOptions = menuOptions.length > 0;

  return (
    <>
      <ListViewV2.Content.Row onPress={onPress}>
        <ListViewV2.Content.Row.Avatar>
          <CustomerAvatar customer={customer} size={40} />
        </ListViewV2.Content.Row.Avatar>

        <ListViewV2.Content.Row.Content>
          <ListViewV2.Content.Row.Title
            badge={
              customer.routeStatus && (
                <CustomerStatusIcon routeStatus={customer.routeStatus} />
              )
            }
          >
            {customer.name}
          </ListViewV2.Content.Row.Title>

          <ListViewV2.Content.Row.Subtitle>
            {customer.vat || "Sin cédula"}
          </ListViewV2.Content.Row.Subtitle>

          {(customer.availableCredit > 0 || customer.isExemptCustomer) && (
            <ListViewV2.Content.Row.Footer>
              <View className="flex-row flex-wrap gap-2">
                {customer.availableCredit > 0 && (
                  <CustomerCreditBadge availableCredit={customer.availableCredit} />
                )}
                {customer.isExemptCustomer && (
                  <CustomerExemptBadge isExempt={customer.isExemptCustomer} />
                )}
              </View>
            </ListViewV2.Content.Row.Footer>
          )}
        </ListViewV2.Content.Row.Content>

        {hasMenuOptions && (
          <ListViewV2.Content.Row.Actions>
            <ListViewV2.Content.Row.ActionButton
              icon={<Display.Icon name="more-vertical" size={20} type="feather" />}
              onPress={() => setMenuVisible(true)}
            />
          </ListViewV2.Content.Row.Actions>
        )}
      </ListViewV2.Content.Row>

      <Modal animationType="fade" transparent visible={menuVisible}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View className="flex-1 bg-black/50 justify-center items-center">
            <TouchableWithoutFeedback>
              <View className="bg-bg-card rounded-xl w-4/5 max-w-[300px] overflow-hidden">
                <View className="flex-row justify-between items-center p-4 border-b border-border-default">
                  <Typography.Text semibold variant="body">
                    {customer.name}
                  </Typography.Text>
                  <TouchableOpacity onPress={() => setMenuVisible(false)}>
                    <Display.Icon
                      color={theme.text.secondary}
                      name="x"
                      size={20}
                      type="feather"
                    />
                  </TouchableOpacity>
                </View>
                {menuOptions.map((option, index) => (
                  <TouchableOpacity
                    className={cn(
                      "flex-row items-center p-4 border-b border-border-default",
                      index === menuOptions.length - 1 && "border-b-0",
                    )}
                    key={option.label}
                    onPress={option.onPress}
                  >
                    <Display.Icon
                      color={theme.text.primary}
                      name={option.icon}
                      size={18}
                      type="feather"
                    />
                    <Typography.Text className="ml-3" variant="body">
                      {option.label}
                    </Typography.Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
