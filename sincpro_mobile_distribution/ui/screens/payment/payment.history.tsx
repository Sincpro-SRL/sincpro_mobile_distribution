import CashierPaymentFilters from "@sincpro/mobile-distribution/ui/components/molecules/CashierPaymentFilters";
import CashierPaymentRow from "@sincpro/mobile-distribution/ui/components/molecules/CashierPaymentRow";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";

import { PaymentHistoryProvider, usePaymentHistory } from "./payment.history.context";

function PaymentHistoryContent() {
  const {
    payments,
    isLoading,
    refreshFromBackend,
    filterByPaymentMethod,
    clearFilter,
    handlePaymentPress,
    handleBack,
    formatDate,
  } = usePaymentHistory();

  return (
    <ListViewV2.Root
      description="Historial de cobros"
      isLoading={isLoading}
      items={payments}
      name="Pagos"
      onBack={handleBack}
      onRefresh={refreshFromBackend}
      readonly
    >
      <ListViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER}>
        <ListViewV2.Header.Filters>
          <CashierPaymentFilters
            onClearFilter={clearFilter}
            onFilterSelect={filterByPaymentMethod}
          />
        </ListViewV2.Header.Filters>
      </ListViewV2.Header>

      <ListViewV2.Content>
        {(item) => (
          <CashierPaymentRow
            formatDate={formatDate}
            key={item.uuid}
            onPress={() => handlePaymentPress(item)}
            payment={item}
          />
        )}
      </ListViewV2.Content>
    </ListViewV2.Root>
  );
}

export function PaymentHistoryScreen() {
  return (
    <PaymentHistoryProvider>
      <PaymentHistoryContent />
    </PaymentHistoryProvider>
  );
}
