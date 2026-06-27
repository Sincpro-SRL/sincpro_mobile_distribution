import {
  IProductPricingInfo,
  PriceListID,
} from "@sincpro/mobile-distribution/domain/product/price_list";
import { Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ScrollView, View } from "react-native";

interface ProductInfoCardProps {
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
  uomName?: string;
  taxFactor?: number;
  description?: string;
  priceMap?: Map<PriceListID, IProductPricingInfo>;
  priceListId?: PriceListID;
}

export function ProductInfoCard({
  name,
  category,
  price,
  quantity,
  uomName,
  taxFactor,
  description,
  priceMap,
  priceListId,
}: ProductInfoCardProps) {
  const unitOfMeasure = uomName || "Unidades";

  return (
    <View>
      <View className="bg-bg-muted p-3">
        <View className="flex-row items-start">
          <View className="mr-3 mt-1 bg-bg-card p-3 border border-border-default rounded-lg">
            <Display.Icon
              color={theme.text.secondary}
              name="package"
              size={24}
              type="feather"
            />
          </View>
          <View className="flex-1">
            <Typography.Text className="mb-1" semibold variant="bodyLarge">
              {name ?? `Nombre del producto no disponible`}
            </Typography.Text>
            <Display.Badge
              className="mb-1.5"
              label={category ?? `Sin categoría`}
              variant={Display.BadgeVariants.WARNING}
            />
            <Display.Monetary textVariant="h4" value={price ?? 0} />
            {taxFactor !== undefined && taxFactor > 0 && (
              <Typography.Text className="text-text-secondary" variant="bodySmall">
                {`Impuestos: ${taxFactor}%`}
              </Typography.Text>
            )}
            <Typography.Text className="text-text-secondary" variant="bodySmall">
              {`Cantidad disponible: ${quantity ?? 0} ${unitOfMeasure}`}
            </Typography.Text>
          </View>
        </View>

        {priceMap && priceMap.size > 0 && (
          <ProductPriceListSection
            activePriceListId={priceListId}
            defaultPrice={price ?? 0}
            priceMap={priceMap}
          />
        )}
      </View>

      <View className="bg-bg-card p-3">
        <Typography.Text className="mb-3" semibold variant="bodyLarge">
          {`Descripción de producto`}
        </Typography.Text>
        <Typography.Text className="leading-[20px]" variant="bodySmall">
          {description && description.length > 0
            ? description
            : `No hay descripción disponible para este producto.`}
        </Typography.Text>
      </View>
    </View>
  );
}

interface ProductPriceListSectionProps {
  priceMap: Map<PriceListID, IProductPricingInfo>;
  defaultPrice: number;
  activePriceListId?: PriceListID;
}

function ProductPriceListSection({
  priceMap,
  defaultPrice,
  activePriceListId,
}: ProductPriceListSectionProps) {
  const entries = Array.from(priceMap.entries());

  if (entries.length === 0) {
    return (
      <View className="mt-4">
        <Typography.Text className="mb-2" semibold>
          {`Precios`}
        </Typography.Text>
        <View className="bg-bg-card rounded-lg p-3 min-w-[100px] items-center border border-border-default">
          <Typography.Text className="text-xs text-text-tertiary mb-1 text-center">
            {`Precio Estándar`}
          </Typography.Text>
          <Display.Monetary bold textVariant="body" value={defaultPrice} />
        </View>
      </View>
    );
  }

  const orderedEntries =
    activePriceListId && priceMap.has(activePriceListId)
      ? [
          [activePriceListId, priceMap.get(activePriceListId)!] as [
            PriceListID,
            IProductPricingInfo,
          ],
          ...entries.filter(([id]) => id !== activePriceListId),
        ]
      : entries;

  return (
    <View className="mt-4">
      <Typography.Text className="mb-2" semibold>
        {`Precios`}
      </Typography.Text>
      <ScrollView className="flex-row" horizontal showsHorizontalScrollIndicator={false}>
        <View className="bg-bg-muted rounded-lg p-3 mr-2 min-w-[100px] items-center border border-border-default">
          <Typography.Text className="text-xs text-text-tertiary mb-1 text-center">
            {`Estándar`}
          </Typography.Text>
          <Display.Monetary bold textVariant="body" value={defaultPrice} />
          <Typography.Text className="text-[10px] text-text-tertiary mt-0.5">
            {`Precio Base`}
          </Typography.Text>
        </View>
        {orderedEntries.map(([id, info]) => (
          <View
            className={cn(
              "bg-bg-card rounded-lg p-3 mr-2 min-w-[100px] items-center border border-border-default",
              id === activePriceListId && "border-warning border-2",
            )}
            key={id}
          >
            <Typography.Text
              className="text-xs text-text-tertiary mb-1 text-center"
              numberOfLines={2}
            >
              {info.priceListName}
            </Typography.Text>
            <Display.Monetary bold textVariant="body" value={info.price} />
            <Typography.Text className="text-[10px] text-text-tertiary mt-0.5">
              {info.currency}
            </Typography.Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
