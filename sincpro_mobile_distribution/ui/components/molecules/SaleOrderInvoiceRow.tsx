import { SaleOrderInvoice } from "@sincpro/mobile-distribution/domain/sale_order";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";

interface SaleOrderInvoiceRowProps {
  invoice: SaleOrderInvoice;
  currencySymbol: string;
  onPrint?: (invoice: SaleOrderInvoice) => void;
}

function getInvoiceStateBadge(invoice: SaleOrderInvoice): {
  label: string;
  variant: BadgeVariants;
} {
  if (invoice.isPaid()) {
    return { label: `Pagada`, variant: BadgeVariants.SUCCESS };
  }
  if (invoice.isInPayment()) {
    return { label: `En proceso de pago`, variant: BadgeVariants.INFO_DARK };
  }
  if (invoice.isPartiallyPaid()) {
    return { label: `Parcial`, variant: BadgeVariants.INFO_DARK };
  }
  if (invoice.isDraft()) {
    return { label: `Borrador`, variant: BadgeVariants.WARNING };
  }
  return { label: `Pendiente`, variant: BadgeVariants.WARNING };
}

export function SaleOrderInvoiceRow({
  invoice,
  currencySymbol,
  onPrint,
}: SaleOrderInvoiceRowProps) {
  const paymentBadge = getInvoiceStateBadge(invoice);

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border-default">
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          <Typography.Text semibold variant="body">
            {invoice.name}
          </Typography.Text>
          <Display.Badge label={paymentBadge.label} variant={paymentBadge.variant} />
        </View>
        <Typography.Text className="text-text-tertiary" variant="bodySmall">
          {invoice.invoiceDate}
        </Typography.Text>
      </View>

      <View className="flex-row items-center gap-2">
        <Display.Monetary
          currencySymbol={currencySymbol}
          semibold
          textVariant="body"
          value={invoice.amountTotal}
        />
        {onPrint && invoice.isPosted() && (
          <TouchableOpacity
            activeOpacity={0.7}
            className="p-2 rounded-lg"
            onPress={() => onPrint(invoice)}
          >
            <Display.Icon color={theme.primary} name="printer" size={20} type="feather" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
