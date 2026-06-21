import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";

interface InvoicePenalizationBadgeProps {
  amount: number;
}

export function InvoicePenalizationBadge({ amount }: InvoicePenalizationBadgeProps) {
  if (amount <= 0) {
    return null;
  }

  return <Display.Badge label={`Penalización`} variant={BadgeVariants.DANGER} />;
}
