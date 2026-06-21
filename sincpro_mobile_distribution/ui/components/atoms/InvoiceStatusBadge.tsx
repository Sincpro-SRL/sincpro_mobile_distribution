import { EInvoicePaymentState } from "@sincpro/mobile-distribution/domain/invoice";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";

interface InvoiceStatusBadgeProps {
  paymentState: EInvoicePaymentState;
}

const PAYMENT_STATE_CONFIG: Record<
  EInvoicePaymentState,
  { label: string; variant: BadgeVariants }
> = {
  [EInvoicePaymentState.PAID]: {
    label: "Pagado",
    variant: BadgeVariants.SUCCESS,
  },
  [EInvoicePaymentState.PARTIAL]: {
    label: "Parcial",
    variant: BadgeVariants.WARNING,
  },
  [EInvoicePaymentState.NOT_PAID]: {
    label: "No pagado",
    variant: BadgeVariants.INFO,
  },
  [EInvoicePaymentState.IN_PAYMENT]: {
    label: "En proceso de pago",
    variant: BadgeVariants.INFO_DARK,
  },
  [EInvoicePaymentState.REVERSED]: {
    label: "Reversado",
    variant: BadgeVariants.WARNING,
  },
};

export function InvoiceStatusBadge({ paymentState }: InvoiceStatusBadgeProps) {
  const config = PAYMENT_STATE_CONFIG[paymentState] || {
    label: paymentState || "Desconocido",
    variant: BadgeVariants.INFO,
  };

  return <Display.Badge label={config.label} variant={config.variant} />;
}
