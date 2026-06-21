import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";

interface CustomerExemptBadgeProps {
  isExempt: boolean;
}

export function CustomerExemptBadge({ isExempt }: CustomerExemptBadgeProps) {
  if (!isExempt) return null;

  return <Display.Badge label="Exento" variant={BadgeVariants.WARNING} />;
}
