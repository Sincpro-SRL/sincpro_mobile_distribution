import { Display } from "@sincpro/mobile-ui/Display";

interface ProductStockBadgeProps {
  inStock: boolean;
  showOnlyOutOfStock?: boolean;
}

export function ProductStockBadge({
  inStock,
  showOnlyOutOfStock = true,
}: ProductStockBadgeProps) {
  if (showOnlyOutOfStock && inStock) {
    return null;
  }

  return (
    <Display.Badge
      label={inStock ? "En Stock" : "Sin Stock"}
      variant={inStock ? Display.BadgeVariants.SUCCESS : Display.BadgeVariants.WARNING}
    />
  );
}
