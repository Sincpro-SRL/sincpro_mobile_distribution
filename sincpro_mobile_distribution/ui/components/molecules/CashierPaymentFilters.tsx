import type { IPaymentMethod } from "@sincpro/mobile-distribution/domain/payment";
import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { Feedback } from "@sincpro/mobile-ui/Feedback";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { useEffect, useState } from "react";
import { View } from "react-native";

interface CashierPaymentFiltersProps {
  onFilterSelect: (paymentMethod: IPaymentMethod) => void;
  onClearFilter: () => void;
}

function CashierPaymentFilters({
  onFilterSelect,
  onClearFilter,
}: CashierPaymentFiltersProps) {
  const { paymentMethods, settingsIsLoading, loadSettings } = useDistributionGlobal();
  const [activeMethodId, setActiveMethodId] = useState<number>(0);

  useEffect(() => {
    if (!paymentMethods || paymentMethods.length === 0) {
      loadSettings();
    }
  }, []);

  function handleSelectAll() {
    onClearFilter();
    setActiveMethodId(0);
  }

  function handleSelectMethod(paymentMethod: IPaymentMethod) {
    onFilterSelect(paymentMethod);
    setActiveMethodId(paymentMethod.id);
  }

  if (settingsIsLoading) {
    return (
      <View className="py-4 items-center">
        <Feedback.Spinner />
      </View>
    );
  }

  return (
    <ListViewV2.Header.Filters.Chips>
      <ListViewV2.Header.Filters.Chip
        active={activeMethodId === 0}
        label="Todo"
        onPress={handleSelectAll}
      />
      {paymentMethods?.map((paymentMethod) => (
        <ListViewV2.Header.Filters.Chip
          active={activeMethodId === paymentMethod.id}
          key={paymentMethod.id}
          label={paymentMethod.name}
          onPress={() => handleSelectMethod(paymentMethod)}
        />
      ))}
    </ListViewV2.Header.Filters.Chips>
  );
}

export default CashierPaymentFilters;
