import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

import { PriceInput } from "./PriceInput";

interface ProductActionFooterProps {
  price: number;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onPressButton: () => void;
  btnText?: string;
  titleText?: string;
  maxQuantity?: number;
  fractional?: boolean;
  precision?: number;
  minIncrement?: number;
  originalPrice?: number;
  editablePrice?: boolean;
  onPriceChange?: (p: number) => void;
  maxDiscountPercent?: number;
  allowSurcharge?: boolean;
  maxSurchargePercent?: number;
  blocked?: boolean;
  blockedMessage?: string;
}

export function ProductActionFooter({
  price,
  quantity,
  onQuantityChange,
  onPressButton,
  btnText = "Agregar",
  titleText = "Total",
  maxQuantity,
  fractional = false,
  precision = 2,
  minIncrement,
  originalPrice,
  editablePrice = false,
  onPriceChange,
  maxDiscountPercent = 20,
  allowSurcharge = false,
  maxSurchargePercent = 10,
  blocked = false,
  blockedMessage,
}: ProductActionFooterProps) {
  const basePrice = originalPrice ?? price;
  const total = price * quantity;

  return (
    <View className="p-4 shadow-lg">
      <View className="flex-row justify-between items-center mb-2">
        <Typography.Text variant="body">{titleText}</Typography.Text>
        <Display.Monetary textVariant={"h5"} value={total} />
      </View>

      {editablePrice && onPriceChange && (
        <PriceInput
          allowSurcharge={allowSurcharge}
          basePrice={basePrice}
          className="mb-2"
          disabled={blocked}
          maxDiscountPercent={maxDiscountPercent}
          maxSurchargePercent={maxSurchargePercent}
          onChange={onPriceChange}
          precision={precision}
          value={price}
        />
      )}

      {blocked && blockedMessage && (
        <View className="mb-2">
          <Display.Badge label={blockedMessage} variant={Display.BadgeVariants.WARNING} />
        </View>
      )}

      <View className="flex-row items-center gap-3">
        {fractional ? (
          <Form.FractionalQuantityInput
            disabled={blocked}
            maxValue={maxQuantity}
            minIncrement={minIncrement}
            onChange={onQuantityChange}
            precision={precision}
            value={quantity}
          />
        ) : (
          <Form.QuantitySelector
            max={maxQuantity}
            onChange={blocked ? () => {} : onQuantityChange}
            value={quantity}
          />
        )}
        <Form.Button
          className="flex-1 max-w-[160px]"
          disabled={maxQuantity === 0 || blocked}
          onPress={onPressButton}
          size="small"
          title={btnText}
          variant="accent"
        />
      </View>
    </View>
  );
}
