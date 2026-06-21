import { Dialog, type EditableValueModalChip } from "@sincpro/mobile-ui/Dialog";
import { Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { useCallback, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";

interface PriceInputProps {
  basePrice: number;
  value: number;
  onChange: (price: number) => void;
  maxDiscountPercent?: number;
  allowSurcharge?: boolean;
  maxSurchargePercent?: number;
  precision?: number;
  currencySymbol?: string;
  disabled?: boolean;
  className?: string;
}

function normalizePrice(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

export function PriceInput({
  basePrice,
  value,
  onChange,
  maxDiscountPercent = 10,
  allowSurcharge = false,
  maxSurchargePercent = 10,
  precision = 2,
  currencySymbol = "₡",
  disabled,
  className,
}: PriceInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState(value.toFixed(precision));

  const minPrice = useMemo(
    () => normalizePrice(basePrice * (1 - maxDiscountPercent / 100), precision),
    [basePrice, maxDiscountPercent, precision],
  );

  const maxPrice = useMemo(
    () =>
      allowSurcharge
        ? normalizePrice(basePrice * (1 + (maxSurchargePercent || 0) / 100), precision)
        : basePrice,
    [allowSurcharge, basePrice, maxSurchargePercent, precision],
  );

  const { discountPct, surchargePct } = useMemo(() => {
    if (basePrice === 0) return { discountPct: 0, surchargePct: 0 };
    if (value < basePrice) {
      return {
        discountPct: Math.round(((basePrice - value) / basePrice) * 1000) / 10,
        surchargePct: 0,
      };
    }
    if (value > basePrice) {
      return {
        discountPct: 0,
        surchargePct: Math.round(((value - basePrice) / basePrice) * 1000) / 10,
      };
    }
    return { discountPct: 0, surchargePct: 0 };
  }, [value, basePrice]);

  function openModal() {
    if (disabled) return;
    setDraft(value.toFixed(precision));
    setModalVisible(true);
  }

  const parseNumber = useCallback((raw: string): number => {
    if (!raw) return NaN;
    let s = raw.replace(/[^0-9.,-]/g, "");
    s = s.replace(/,/g, ".");
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
  }, []);

  function applyDraft() {
    let n = parseNumber(draft);
    if (isNaN(n)) {
      setModalVisible(false);
      return;
    }
    n = normalizePrice(n, precision);
    if (n > maxPrice) n = maxPrice;
    if (n < minPrice) n = minPrice;
    onChange(n);
    setModalVisible(false);
  }

  const discountChips = useMemo(() => {
    const base = [1, 2, 5, maxDiscountPercent];
    return Array.from(new Set(base.filter((x) => x <= maxDiscountPercent))).sort(
      (a, b) => a - b,
    );
  }, [maxDiscountPercent]);

  const surchargeChips = useMemo(() => {
    if (!allowSurcharge) return [] as number[];
    const base = [1, 2, 5, maxSurchargePercent];
    return Array.from(new Set(base.filter((x) => x <= maxSurchargePercent))).sort(
      (a, b) => a - b,
    );
  }, [allowSurcharge, maxSurchargePercent]);

  const modalChips: EditableValueModalChip[] = [
    ...discountChips.map((d) => ({
      label: `-${d}%`,
      onPress: () => {
        const newPrice = normalizePrice(basePrice * (1 - d / 100), precision);
        setDraft(newPrice.toFixed(precision));
      },
    })),
    ...surchargeChips.map((d) => ({
      label: `+${d}%`,
      onPress: () => {
        const newPrice = normalizePrice(basePrice * (1 + d / 100), precision);
        setDraft(newPrice.toFixed(precision));
      },
    })),
  ];

  const helperText = allowSurcharge
    ? `Base: ${currencySymbol} ${basePrice.toFixed(precision)} | Rango: ${currencySymbol} ${minPrice.toFixed(precision)} - ${currencySymbol} ${maxPrice.toFixed(precision)}`
    : `Base: ${currencySymbol} ${basePrice.toFixed(precision)} | Mín: ${currencySymbol} ${minPrice.toFixed(precision)}`;

  return (
    <View className={className}>
      <TouchableOpacity
        activeOpacity={0.7}
        className={cn(
          "border border-warning rounded-xl p-2 bg-warning/10",
          disabled && "opacity-50",
        )}
        onPress={openModal}
      >
        <View className="flex-row items-center justify-between">
          <Typography.Text semibold variant="body">
            {currencySymbol} {value.toFixed(precision)}
          </Typography.Text>
          <View className="flex-row items-center gap-1 bg-warning/20 px-1.5 py-0.5 rounded-lg">
            <Display.Icon color={theme.warning} name="edit-2" size={12} type="feather" />
            <Typography.Text className="text-[10px]" variant="bodySmall">
              {`Editar`}
            </Typography.Text>
          </View>
        </View>
        {discountPct > 0 && (
          <Typography.Text className="mt-1 text-warning" variant="bodySmall">
            {`-${discountPct}% (mín ${currencySymbol} ${minPrice.toFixed(precision)})`}
          </Typography.Text>
        )}
        {surchargePct > 0 && (
          <Typography.Text className="mt-1 text-primary" variant="bodySmall">
            {`+${surchargePct}% (máx ${currencySymbol} ${maxPrice.toFixed(precision)})`}
          </Typography.Text>
        )}
      </TouchableOpacity>

      <Dialog.EditValue
        chips={modalChips}
        helperText={helperText}
        keyboardType="decimal-pad"
        onCancel={() => setModalVisible(false)}
        onChangeValue={setDraft}
        onConfirm={applyDraft}
        placeholder={basePrice.toFixed(precision)}
        rightAdornment={
          <Typography.Text className="ml-1" variant="body">
            {currencySymbol}
          </Typography.Text>
        }
        title={`Editar precio`}
        value={draft}
        visible={modalVisible}
      />
    </View>
  );
}
