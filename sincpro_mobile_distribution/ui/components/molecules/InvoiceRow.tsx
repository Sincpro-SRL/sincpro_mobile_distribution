import { EInvoiceState, Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import {
  InvoiceCreditBadge,
  InvoicePenalizationBadge,
  InvoiceStateBadge,
  InvoiceStatusBadge,
} from "@sincpro/mobile-distribution/ui/components/atoms";
import { Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { View } from "react-native";

interface InvoiceRowProps {
  invoice: Invoice;
  onPress: () => void;
  currencySymbol?: string;
}

function renderDraftBadge(invoice: Invoice) {
  if (!invoice.isDraft()) {
    return null;
  }
  return <InvoiceStateBadge state={EInvoiceState.DRAFT} />;
}

function renderCreditBadge(invoice: Invoice) {
  if (!invoice.hasCredit) {
    return null;
  }
  return <InvoiceCreditBadge hasCredit />;
}

function renderPenalizationBadge(invoice: Invoice) {
  if (!invoice.penalizationAmount || invoice.penalizationAmount <= 0) {
    return null;
  }
  return <InvoicePenalizationBadge amount={invoice.penalizationAmount} />;
}

function InvoiceBadges({ invoice }: { invoice: Invoice }) {
  return (
    <View className="flex-row flex-wrap gap-1">
      {renderDraftBadge(invoice)}
      {renderCreditBadge(invoice)}
      {renderPenalizationBadge(invoice)}
      <InvoiceStatusBadge paymentState={invoice.paymentState} />
    </View>
  );
}

function renderPenalization(invoice: Invoice, currencySymbol: string) {
  if (!invoice.penalizationAmount || invoice.penalizationAmount <= 0) {
    return null;
  }

  return (
    <ListViewV2.Content.Row.Subtitle className="text-red-600">
      <Typography.Text className="text-red-600" variant="bodySmall">
        {"Penalización: "}
      </Typography.Text>
      <Display.Monetary
        className="text-red-600"
        currencySymbol={currencySymbol}
        textVariant="bodySmall"
        value={invoice.penalizationAmount}
      />
    </ListViewV2.Content.Row.Subtitle>
  );
}

export function InvoiceRow({ invoice, onPress, currencySymbol = "₡" }: InvoiceRowProps) {
  const invoiceName = invoice.name || `Factura #${invoice.remoteId}`;

  return (
    <ListViewV2.Content.Row onPress={onPress}>
      <ListViewV2.Content.Row.Content>
        <ListViewV2.Content.Row.Title
          numberOfLines={2}
          rightComponent={
            <Display.Monetary
              currencySymbol={currencySymbol}
              semibold
              textVariant="body"
              value={invoice.amountResidual}
            />
          }
        >
          {invoiceName}
        </ListViewV2.Content.Row.Title>
        <Display.Date
          className="text-text-secondary"
          prefix={`Fecha: `}
          textVariant="bodySmall"
          value={invoice.invoiceDate}
        />
        {renderPenalization(invoice, currencySymbol)}
        <ListViewV2.Content.Row.Footer>
          <InvoiceBadges invoice={invoice} />
        </ListViewV2.Content.Row.Footer>
      </ListViewV2.Content.Row.Content>

      <ListViewV2.Content.Row.Actions>
        <Display.Icon
          color={theme.text.secondary}
          name="chevron-forward"
          size={20}
          type="ionicons"
        />
      </ListViewV2.Content.Row.Actions>
    </ListViewV2.Content.Row>
  );
}
