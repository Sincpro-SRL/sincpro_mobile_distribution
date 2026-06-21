import { CashierStatusBadge } from "@sincpro/mobile-distribution/ui/components/atoms";
import {
  CashierBalanceCard,
  CashierCategoryNav,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import {
  CashierFooterActions,
  CashierHistoryWidget,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { View } from "react-native";

import { CashierScreenProvider, useCashierScreen } from "./cashier.screen.context";

function CashierScreenContent() {
  const {
    payments,
    groupedPayments,
    totalAmount,
    isLoading,
    openedAt,
    closedAt,
    refreshFromBackend,
    handleCloseCashRegister,
    handleGenerateReport,
    handlePaymentPress,
    handleFilterByPaymentMethod,
    formatDate,
  } = useCashierScreen();

  return (
    <FormViewV2.Root
      description="Aquí puedes ver el balance de la caja y el historial de cobros."
      isLoading={isLoading}
      item={{ payments }}
      name="Caja"
      onRefresh={refreshFromBackend}
      withContainer={false}
    >
      <FormViewV2.Header
        logoSource={require("../../../../assets/DISTRIBUTION/logo.png")}
        variant={EVariantScreenHeader.ONLY_LOGO}
      />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>
            <CashierStatusBadge
              closedAt={closedAt}
              formatDate={formatDate}
              openedAt={openedAt}
            />
          </FormViewV2.Content.Group>

          <FormViewV2.Content.Group>
            <View className="p-2">
              <Typography.Text semibold variant="body">
                Balance total
              </Typography.Text>
            </View>
            <CashierBalanceCard
              groupedPayments={groupedPayments}
              onMethodPress={handleFilterByPaymentMethod}
              totalAmount={totalAmount}
            />
          </FormViewV2.Content.Group>

          <FormViewV2.Content.Group>
            <View className="p-2">
              <Typography.Text semibold variant="body">
                Balance por categoría
              </Typography.Text>
            </View>
            <View className="px-2 pb-2">
              <CashierCategoryNav />
            </View>
          </FormViewV2.Content.Group>

          <FormViewV2.Content.Group>
            <CashierHistoryWidget
              formatDate={formatDate}
              onPaymentPress={handlePaymentPress}
              payments={payments}
            />
          </FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>
        <CashierFooterActions
          hasPayments={payments.length > 0}
          isLoading={isLoading}
          onCloseCashRegister={handleCloseCashRegister}
          onGenerateReport={handleGenerateReport}
        />
      </FormViewV2.Footer>
    </FormViewV2.Root>
  );
}

export function CashierScreen() {
  return (
    <CashierScreenProvider>
      <CashierScreenContent />
    </CashierScreenProvider>
  );
}
