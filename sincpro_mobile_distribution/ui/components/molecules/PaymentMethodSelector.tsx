import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import type { IPaymentMethod } from "@sincpro/mobile-distribution/domain/payment";
import { CREDIT_PAYMENT_METHOD } from "@sincpro/mobile-distribution/domain/settings";
import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";
import { getIcon } from "@sincpro/mobile-ui/icons/icon_getters";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

interface PaymentMethodSelectorProps {
  customer?: Customer;
  orderAmount?: number;
  selectedPaymentMethodId?: number;
  onSelectPaymentMethod: (paymentMethod: IPaymentMethod) => void;
  readonly?: boolean;
  hideCreditOption?: boolean;
}

function PaymentMethodSelector({
  customer,
  orderAmount = 0,
  selectedPaymentMethodId,
  onSelectPaymentMethod,
  readonly = false,
  hideCreditOption = false,
}: PaymentMethodSelectorProps) {
  const { paymentMethods, loadSettings, settingsIsLoading } = useDistributionGlobal();
  const [selectedId, setSelectedId] = useState<number | undefined>(selectedPaymentMethodId);

  useEffect(() => {
    if (!paymentMethods || paymentMethods.length === 0) {
      loadSettings();
    }
  }, []);

  useEffect(() => {
    setSelectedId(selectedPaymentMethodId);
  }, [selectedPaymentMethodId]);

  const customerHasCredit = customer?.availableCredit && customer.availableCredit > 0;
  const hasSufficientCredit =
    customer?.availableCredit && customer.availableCredit >= orderAmount;

  const handleSelectPaymentMethod = (paymentMethod: IPaymentMethod) => {
    if (readonly) return;
    setSelectedId(paymentMethod.id);
    onSelectPaymentMethod(paymentMethod);
  };

  const renderCreditBadges = () => {
    const isCreditSelected = selectedId === CREDIT_PAYMENT_METHOD.id;

    if (!customer) {
      return <Display.Badge label="Cliente no cargado" variant={BadgeVariants.WARNING} />;
    }

    if (!customerHasCredit) {
      return <Display.Badge label="Sin crédito" variant={BadgeVariants.WARNING} />;
    }

    if (!hasSufficientCredit && orderAmount > 0) {
      return <Display.Badge label="Crédito insuficiente" variant={BadgeVariants.WARNING} />;
    }

    if (isCreditSelected) {
      return (
        <View className="flex-row flex-wrap gap-2 px-3 pb-3">
          <Display.Badge
            label={`Disponible: ₡${customer.availableCredit?.toFixed(2) || "0.00"}`}
            variant={BadgeVariants.SUCCESS}
          />
          <Display.Badge
            label={`A utilizar: ₡${orderAmount.toFixed(2)}`}
            variant={BadgeVariants.WARNING}
          />
        </View>
      );
    }

    return (
      <Display.Badge
        label={`Disponible: ₡${customer.availableCredit?.toFixed(2) || "0.00"}`}
        variant={BadgeVariants.SUCCESS}
      />
    );
  };

  const renderCreditOption = () => {
    const isCreditSelected = selectedId === CREDIT_PAYMENT_METHOD.id;
    const creditDisabled = !customer || !hasSufficientCredit || readonly;

    return (
      <View key="credit-payment">
        <TouchableOpacity
          activeOpacity={creditDisabled ? 1 : 0.7}
          className={cn(
            "flex-row justify-between items-center py-2.5 border-b border-border-default",
            creditDisabled && "opacity-50",
          )}
          disabled={creditDisabled}
          onPress={() => !creditDisabled && handleSelectPaymentMethod(CREDIT_PAYMENT_METHOD)}
        >
          <View className="flex-row items-center max-w-[180px]">
            <View
              className={cn(
                "w-5 h-5 rounded-full border-2 border-border-default mr-3 justify-center items-center",
                isCreditSelected && "border-accent",
              )}
            >
              {isCreditSelected && <View className="w-2.5 h-2.5 rounded-full bg-accent" />}
            </View>
            <Typography.Text
              className={cn(creditDisabled && "text-text-tertiary")}
              variant="bodySmall"
            >
              {CREDIT_PAYMENT_METHOD.name}
            </Typography.Text>
          </View>
          <View className="w-8 h-8 justify-center items-center">
            <Display.Icon
              color={creditDisabled ? theme.text.tertiary : theme.warning}
              name="credit-card"
              size={20}
              type="feather"
            />
          </View>
        </TouchableOpacity>
        <View className="pl-8 py-2">{renderCreditBadges()}</View>
      </View>
    );
  };

  function renderPaymentIcon(name: string) {
    const iconPayment = getIcon(name);
    if (iconPayment) {
      return <Display.Icon customIcon={iconPayment.icon} size={20} type="custom" />;
    }
    return (
      <Display.Icon
        color={theme.text.secondary}
        name="dollar-sign"
        size={20}
        type="feather"
      />
    );
  }

  if (settingsIsLoading) {
    return (
      <View className="gap-0">
        <Typography.Text variant="bodySmall">Cargando métodos de pago...</Typography.Text>
      </View>
    );
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <View className="gap-0">
        <Typography.Text variant="bodySmall">
          No hay métodos de pago disponibles
        </Typography.Text>
      </View>
    );
  }

  return (
    <View className="gap-0">
      {paymentMethods.map((paymentMethod) => {
        const isSelected = selectedId === paymentMethod.id;
        return (
          <TouchableOpacity
            activeOpacity={readonly ? 1 : 0.7}
            className="flex-row justify-between items-center py-2.5 border-b border-border-default"
            disabled={readonly}
            key={paymentMethod.id}
            onPress={() => !readonly && handleSelectPaymentMethod(paymentMethod)}
          >
            <View className="flex-row items-center max-w-[180px]">
              <View
                className={cn(
                  "w-5 h-5 rounded-full border-2 border-border-default mr-3 justify-center items-center",
                  isSelected && "border-accent",
                )}
              >
                {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-accent" />}
              </View>
              <Typography.Text variant="bodySmall">{paymentMethod.name}</Typography.Text>
            </View>
            <View className="w-8 h-8 justify-center items-center">
              {renderPaymentIcon(paymentMethod.name)}
            </View>
          </TouchableOpacity>
        );
      })}
      {!hideCreditOption && renderCreditOption()}
    </View>
  );
}

export default PaymentMethodSelector;
