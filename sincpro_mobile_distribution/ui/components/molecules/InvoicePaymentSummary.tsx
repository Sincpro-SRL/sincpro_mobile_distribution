import { EntityCollection } from "@sincpro/mobile/domain/entity";
import type { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { PaymentSummary } from "@sincpro/mobile-distribution/ui/components/molecules/PaymentSummary";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface InvoicePaymentSummaryProps {
  invoices: Invoice[] | EntityCollection<Invoice>;
  currencySymbol?: string;
}

function calculateInvoiceTotals(invoices: Invoice[] | EntityCollection<Invoice>) {
  const invoiceArray = Array.isArray(invoices) ? invoices : invoices.toArray();

  let totalResidual = 0;
  let totalTaxes = 0;
  let totalUntaxed = 0;

  for (const invoice of invoiceArray) {
    totalResidual += invoice.amountResidual || 0;

    if (invoice.amountTotal > 0) {
      const residualRatio = (invoice.amountResidual || 0) / invoice.amountTotal;
      totalTaxes += (invoice.amountTax || 0) * residualRatio;
      totalUntaxed += (invoice.amountUntaxed || 0) * residualRatio;
    }
  }

  return { totalResidual, totalTaxes, totalUntaxed };
}

export function InvoicePaymentSummary({
  invoices,
  currencySymbol = "₡",
}: InvoicePaymentSummaryProps) {
  const { totalResidual, totalTaxes, totalUntaxed } = calculateInvoiceTotals(invoices);

  return (
    <View className="px-4 py-4 border-t border-border-default">
      <Typography.Text className="mb-3" semibold variant="bodyLarge">
        Resumen de pago
      </Typography.Text>
      <PaymentSummary.Root currencySymbol={currencySymbol}>
        <PaymentSummary.Line label="Subtotal" value={totalUntaxed} />
        <PaymentSummary.Line label="Impuestos" value={totalTaxes} />
        <PaymentSummary.Line isTotal label="Total a pagar" separator value={totalResidual} />
      </PaymentSummary.Root>
    </View>
  );
}
