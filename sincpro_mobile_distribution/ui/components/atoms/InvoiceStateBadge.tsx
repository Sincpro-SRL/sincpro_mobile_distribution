import { EInvoiceState } from "@sincpro/mobile-distribution/domain/invoice";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";

interface InvoiceStateBadgeProps {
  state: EInvoiceState;
}

const STATE_CONFIG: Record<EInvoiceState, { label: string; variant: BadgeVariants }> = {
  [EInvoiceState.DRAFT]: {
    label: "Borrador",
    variant: BadgeVariants.WARNING,
  },
  [EInvoiceState.POSTED]: {
    label: "Publicada",
    variant: BadgeVariants.SUCCESS,
  },
  [EInvoiceState.CANCELLED]: {
    label: "Cancelada",
    variant: BadgeVariants.DANGER,
  },
};

export function InvoiceStateBadge({ state }: InvoiceStateBadgeProps) {
  const config = STATE_CONFIG[state];

  if (!config) return null;

  return <Display.Badge label={config.label} variant={config.variant} />;
}
