import { formatTwoDecimals } from "@sincpro/mobile/tools/utils/monetary";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { createContext, ReactNode, useContext } from "react";
import { View } from "react-native";

interface InvoiceCardHeaderContextValue {
  customer: Customer;
  invoices: Invoice[];
  currencySymbol: string;
}

const InvoiceCardHeaderContext = createContext<InvoiceCardHeaderContextValue | null>(null);

function useInvoiceCardHeader() {
  const context = useContext(InvoiceCardHeaderContext);
  if (!context) {
    throw new Error(
      "InvoiceCardHeader compound components must be used within InvoiceCardHeader",
    );
  }
  return context;
}

interface InvoiceCardHeaderProps {
  customer: Customer;
  invoices: Invoice[];
  currencySymbol?: string;
  backgroundColor?: string;
  badges?: ReactNode;
  children?: ReactNode;
}

function InvoiceCardHeaderRoot({
  customer,
  invoices,
  currencySymbol = "₡",
  backgroundColor,
  badges,
  children,
}: InvoiceCardHeaderProps) {
  const containerClass = backgroundColor
    ? undefined
    : "bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200";

  return (
    <InvoiceCardHeaderContext.Provider value={{ customer, invoices, currencySymbol }}>
      <View
        className={`rounded-xl p-4 gap-4 ${backgroundColor ? "" : containerClass}`.trim()}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 gap-0.5">
            <Typography.Text className="text-text-tertiary" variant="caption">
              {`Pago de facturas`}
            </Typography.Text>
            <Typography.Text semibold variant="bodyLarge">
              {customer.name}
            </Typography.Text>
          </View>
          <View className="items-end gap-1">
            <Display.Badge label="Facturas" variant={BadgeVariants.INFO_DARK} />
          </View>
        </View>

        {badges && <View className="flex-row flex-wrap gap-1.5">{badges}</View>}

        <View className="flex-row gap-3 justify-between">
          <View className="flex-1">
            <Typography.Text className="text-text-tertiary" variant="caption">
              {`Código`}
            </Typography.Text>
            <Typography.Text semibold variant="bodySmall">
              {customer.ref || `#${customer.remoteId}`}
            </Typography.Text>
          </View>
          <View className="items-end justify-end">{children}</View>
        </View>
      </View>
    </InvoiceCardHeaderContext.Provider>
  );
}

function InvoiceCount() {
  const { invoices } = useInvoiceCardHeader();
  const count = invoices.length;

  return (
    <View className="flex-row items-center gap-2">
      <View className="w-2 h-2 rounded bg-accent" />
      <Typography.Text semibold variant="body">
        {count} {count === 1 ? "factura" : "facturas"}
      </Typography.Text>
    </View>
  );
}

function TotalAmount() {
  const { invoices, currencySymbol } = useInvoiceCardHeader();
  const total = invoices.reduce((sum, inv) => sum + inv.amountResidual, 0);

  return (
    <View className="flex-row items-center gap-2">
      <View className="w-2 h-2 rounded bg-accent" />
      <Typography.Text semibold variant="body">
        {currencySymbol}
        {formatTwoDecimals(total)}
      </Typography.Text>
    </View>
  );
}

export const InvoiceCardHeader = Object.assign(InvoiceCardHeaderRoot, {
  InvoiceCount,
  TotalAmount,
});
