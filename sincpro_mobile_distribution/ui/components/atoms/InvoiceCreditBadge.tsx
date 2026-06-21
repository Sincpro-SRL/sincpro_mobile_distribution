import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";

interface InvoiceCreditBadgeProps {
  hasCredit: boolean;
}

export function InvoiceCreditBadge({ hasCredit }: InvoiceCreditBadgeProps) {
  if (!hasCredit) return null;

  return <Display.Badge label="Crédito" variant={BadgeVariants.INFO_DARK} />;
}
