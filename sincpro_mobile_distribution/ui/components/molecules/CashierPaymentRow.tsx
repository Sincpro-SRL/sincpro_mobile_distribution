import { useNavigation } from "@react-navigation/native";
import {
  EPaymentTargetType,
  type Payment,
} from "@sincpro/mobile-distribution/domain/payment";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { Display } from "@sincpro/mobile-ui";
import MoneyReceiveIcon from "@sincpro/mobile-ui/icons/MoneyReceiveIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { useState } from "react";
import { Modal, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

const TARGET_TYPE_COLORS: Record<EPaymentTargetType, string> = {
  [EPaymentTargetType.SALE_ORDER]: "#7C54F9",
  [EPaymentTargetType.INVOICE]: "#FF8D3B",
  [EPaymentTargetType.CREDIT_NOTE]: "#FF3B30",
};

interface CashierPaymentRowProps {
  payment: Payment;
  onPress?: (payment: Payment) => void;
  formatDate: (date: string) => string;
}

interface MenuOption {
  label: string;
  icon: string;
  onPress: () => void;
  visible?: boolean;
}

function CashierPaymentRow({ payment, onPress, formatDate }: CashierPaymentRowProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();

  const iconColor = payment.targetType
    ? TARGET_TYPE_COLORS[payment.targetType] || "#7C54F9"
    : "#7C54F9";

  const isNegative = payment.value < 0;
  const amountColor = isNegative ? theme.danger : theme.text.tertiary;

  function handleRowPress() {
    if (onPress) {
      onPress(payment);
    }
  }

  function handleViewEntity() {
    setMenuVisible(false);
    if (payment.paidEntity) {
      (navigation as any).navigate(AppScreen.ORDER_RECEIPT as never, {
        entity: payment.paidEntity,
      });
    }
  }

  function handleViewReceipt() {
    setMenuVisible(false);
    if (payment.paidEntity) {
      (navigation as any).navigate(AppScreen.ORDER_RECEIPT as never, {
        entity: payment.paidEntity,
      });
    }
  }

  function handleViewPaymentDetail() {
    setMenuVisible(false);
    (navigation as any).navigate(AppScreen.PAYMENT_DETAIL as never, {
      payment,
      paymentId: payment.uuid,
    });
  }

  const getEntityLabel = (): string => {
    switch (payment.targetType) {
      case EPaymentTargetType.SALE_ORDER:
        return "Ver orden de venta";
      case EPaymentTargetType.INVOICE:
        return "Ver factura";
      case EPaymentTargetType.CREDIT_NOTE:
        return "Ver nota de crédito";
      default:
        return "Ver detalle";
    }
  };

  const hasReceipt =
    payment.invoicePaid?.hasReceipt ||
    Boolean(payment.creditNotePaid?.consecutiveNumber) ||
    Boolean(payment.saleOrderPaid);

  const menuOptions: MenuOption[] = [
    {
      label: getEntityLabel(),
      icon: "eye",
      onPress: handleViewEntity,
      visible: Boolean(payment.paidEntity),
    },
    {
      label: "Ver comprobante",
      icon: "printer",
      onPress: handleViewReceipt,
      visible: hasReceipt,
    },
    {
      label: "Detalles del pago",
      icon: "info",
      onPress: handleViewPaymentDetail,
      visible: true,
    },
  ].filter((opt) => opt.visible !== false);

  const hasMenuOptions = menuOptions.length > 0;

  return (
    <>
      <ListViewV2.Content.Row onPress={handleRowPress}>
        <ListViewV2.Content.Row.Avatar>
          <Display.Icon
            color={iconColor}
            customIcon={MoneyReceiveIcon}
            size={35}
            type="custom"
          />
        </ListViewV2.Content.Row.Avatar>

        <ListViewV2.Content.Row.Content>
          <ListViewV2.Content.Row.Title>
            {payment.targetName || "Pago"}
          </ListViewV2.Content.Row.Title>
          <ListViewV2.Content.Row.Subtitle>
            {formatDate(payment.date)}
          </ListViewV2.Content.Row.Subtitle>
          <ListViewV2.Content.Row.Footer>
            <Typography.Text
              className="text-text-tertiary"
              numberOfLines={1}
              variant="bodySmall"
            >
              {payment.paymentMethod?.name || "Sin método"}
            </Typography.Text>
          </ListViewV2.Content.Row.Footer>
        </ListViewV2.Content.Row.Content>

        <ListViewV2.Content.Row.Actions>
          <Display.Monetary color={amountColor} value={payment.value} />
          {hasMenuOptions && (
            <ListViewV2.Content.Row.ActionButton
              icon={<Display.Icon name="more-vertical" size={20} type="feather" />}
              onPress={() => setMenuVisible(true)}
            />
          )}
        </ListViewV2.Content.Row.Actions>
      </ListViewV2.Content.Row>

      <Modal animationType="fade" transparent visible={menuVisible}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View className="flex-1 bg-black/50 justify-center items-center">
            <TouchableWithoutFeedback>
              <View className="bg-bg-card rounded-xl w-4/5 max-w-[300px] overflow-hidden">
                <View className="flex-row justify-between items-center p-4 border-b border-border-default">
                  <Typography.Text semibold variant="body">
                    {payment.targetName || `Pago`}
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

export default CashierPaymentRow;
