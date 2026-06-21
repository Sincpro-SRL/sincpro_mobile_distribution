import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { View } from "react-native";

interface CashierFooterActionsProps {
  onGenerateReport: () => void;
  onCloseCashRegister: () => void;
  isLoading?: boolean;
  hasPayments?: boolean;
}

function CashierFooterActions({
  onGenerateReport,
  onCloseCashRegister,
  isLoading = false,
  hasPayments = false,
}: CashierFooterActionsProps) {
  return (
    <View className="gap-3">
      <Form.Button
        disabled={!hasPayments}
        icon={<Display.Icon name="file-text" size={16} type="feather" />}
        loading={isLoading}
        onPress={onGenerateReport}
        title="Generar reporte de cierre"
        variant="outlineBlack"
      />
      {/* <Form.Button
        disabled={!hasPayments}
        loading={isLoading}
        onPress={onCloseCashRegister}
        title="Cerrar caja y resetear valores"
        variant="accent"
      /> */}
    </View>
  );
}

export default CashierFooterActions;
