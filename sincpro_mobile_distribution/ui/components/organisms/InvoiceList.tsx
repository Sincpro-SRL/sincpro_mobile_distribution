import { EntityCollection } from "@sincpro/mobile/domain/entity";
import type { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { InvoiceRow } from "@sincpro/mobile-distribution/ui/components/molecules/InvoiceRow";
import { Display } from "@sincpro/mobile-ui/Display";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface InvoiceListProps {
  invoices: Invoice[] | EntityCollection<Invoice>;
  onSelectInvoice: (invoice: Invoice) => void;
  currencySymbol?: string;
}

export function InvoiceList({
  invoices,
  onSelectInvoice,
  currencySymbol = "₡",
}: InvoiceListProps) {
  const invoiceArray = Array.isArray(invoices) ? invoices : invoices.toArray();

  if (invoiceArray.length === 0) {
    return (
      <View className="items-center p-4">
        <Typography.Text variant="body">No hay facturas pendientes</Typography.Text>
      </View>
    );
  }

  return (
    <View className="p-3">
      <Display.CountRecords
        count={invoiceArray.length}
        name="Facturas Pendientes"
        withPadding={false}
      />
      <View className="mt-4">
        {invoiceArray.map((invoice) => (
          <InvoiceRow
            currencySymbol={currencySymbol}
            invoice={invoice}
            key={invoice.uuid}
            onPress={() => onSelectInvoice(invoice)}
          />
        ))}
      </View>
    </View>
  );
}
