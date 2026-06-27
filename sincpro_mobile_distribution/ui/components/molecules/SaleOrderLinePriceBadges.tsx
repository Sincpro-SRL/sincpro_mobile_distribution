import { Display } from "@sincpro/mobile-ui";

interface SaleOrderLinePriceBadgesProps {
  isManualPrice?: boolean;
  priceListName?: string | null;
  discountPercent?: number;
}

export function SaleOrderLinePriceBadges({
  isManualPrice,
  priceListName,
  discountPercent,
}: SaleOrderLinePriceBadgesProps) {
  const showDiscount = typeof discountPercent === "number" && discountPercent > 0;

  return (
    <>
      {showDiscount && (
        <Display.Badge
          label={`-${discountPercent!.toFixed(discountPercent! >= 10 ? 0 : 1)}%`}
          variant={Display.BadgeVariants.SUCCESS}
        />
      )}
      {isManualPrice && (
        <Display.Badge label="Editado" variant={Display.BadgeVariants.WARNING} />
      )}
      {priceListName && !isManualPrice && (
        <Display.Badge label={priceListName} variant={Display.BadgeVariants.INFO} />
      )}
    </>
  );
}
