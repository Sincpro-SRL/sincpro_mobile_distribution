import { EPaymentType } from "@sincpro/mobile-distribution/domain/payment";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { Display } from "@sincpro/mobile-ui/Display";
import BoxIcon from "@sincpro/mobile-ui/icons/BoxIcon";
import WalletMoneyIcon from "@sincpro/mobile-ui/icons/WalletMoneyIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";
import { useNavigate } from "react-router-native";

function CashierCategoryNav() {
  const navigate = useNavigate();

  function handleNavigateToOrders() {
    navigate(AppScreen.CASHIER_HISTORY, {
      state: { paymentType: EPaymentType.REGULAR_PAYMENT },
    });
  }

  function handleNavigateToCredits() {
    navigate(AppScreen.CASHIER_HISTORY, {
      state: { paymentType: EPaymentType.CREDIT_PAYMENT },
    });
  }

  return (
    <View className="flex-row justify-between gap-4">
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-1 justify-start p-4 bg-bg-card rounded-[10px]"
        onPress={handleNavigateToOrders}
      >
        <View className="w-[45px] h-[45px] rounded-full bg-accent justify-center items-center mb-3">
          <Display.Icon color={theme.text.inverse} customIcon={BoxIcon} type="custom" />
        </View>
        <Typography.Text className="text-left mb-1" variant="bodySmall">
          {`Órdenes entregadas`}
        </Typography.Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-1 justify-start p-4 bg-bg-card rounded-[10px]"
        onPress={handleNavigateToCredits}
      >
        <View className="w-[45px] h-[45px] rounded-full justify-center items-center mb-3 bg-accent">
          <Display.Icon
            color={theme.text.inverse}
            customIcon={WalletMoneyIcon}
            type="custom"
          />
        </View>
        <Typography.Text className="text-left mb-1" variant="bodySmall">
          {`Pagos de crédito`}
        </Typography.Text>
      </TouchableOpacity>
    </View>
  );
}

export default CashierCategoryNav;
