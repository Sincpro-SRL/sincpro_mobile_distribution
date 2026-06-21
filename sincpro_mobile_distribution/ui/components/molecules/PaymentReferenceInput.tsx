import { Form } from "@sincpro/mobile-ui";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { useState } from "react";
import { View } from "react-native";

interface PaymentReferenceInputProps {
  value?: string;
  onChange: (reference: string) => void;
  placeholder?: string;
}

function PaymentReferenceInput({
  value,
  onChange,
  placeholder = `Ej: 123456789, SINPE-001`,
}: PaymentReferenceInputProps) {
  const [internalValue, setInternalValue] = useState(value || "");

  function handleChange(text: string) {
    setInternalValue(text);
    onChange(text);
  }

  return (
    <View className="gap-1">
      <Form.Input
        label={`Referencia de pago (opcional)`}
        onChangeText={handleChange}
        placeholder={placeholder}
        value={internalValue}
      />
      <Typography.Text className="text-text-tertiary" variant="captionSmall">
        {`Número de transacción, comprobante o referencia`}
      </Typography.Text>
    </View>
  );
}

export default PaymentReferenceInput;
