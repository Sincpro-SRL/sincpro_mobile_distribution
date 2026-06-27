import { useNavigation, useRoute } from "@react-navigation/native";
import { ReceiptExporterAdapter } from "@sincpro/mobile/adapters/ReceiptExporter.adapter";
import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import {
  EPaymentAmountType,
  EPaymentState,
  Payment,
} from "@sincpro/mobile-distribution/domain/payment";
import { PaymentCredit } from "@sincpro/mobile-distribution/domain/payment/payment_credit";
import { PaymentOdoo } from "@sincpro/mobile-distribution/domain/payment/payment_odoo";
import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { Display } from "@sincpro/mobile-ui/Display";
import { Feedback } from "@sincpro/mobile-ui/Feedback";
import { Form } from "@sincpro/mobile-ui/Form";
import MoneyReceiveIcon from "@sincpro/mobile-ui/icons/MoneyReceiveIcon";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { isValidElement, useRef, useState } from "react";
import { View } from "react-native";

import { PaymentDetailProvider, usePaymentDetail } from "./payment.detail.context";

function ReceiptDivider() {
  return (
    <View className="h-px bg-border-default my-2 border border-dashed border-border-default" />
  );
}

function getCurrencySymbol(currency?: string) {
  return currency === "USD" ? "$" : currency === "CRC" ? "₡" : "";
}

function ReceiptRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <View className="flex-row justify-between mb-0.5">
      <Typography.Text className="text-xs text-text-tertiary flex-1">{label}</Typography.Text>
      {isValidElement(value) ? (
        value
      ) : (
        <Typography.Text className="text-xs text-text-primary font-medium flex-1 text-right">
          {value}
        </Typography.Text>
      )}
    </View>
  );
}

function ReceiptSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-2">
      <Typography.Text className="text-[11px] font-semibold text-text-secondary mb-1 uppercase tracking-wide">
        {title}
      </Typography.Text>
      {children}
    </View>
  );
}

function resolvePaymentType(payment: Payment): string {
  if (payment.paymentAmountType === EPaymentAmountType.OUTBOUND) return "Salida";
  if (payment.isCreditPayment) return "Crédito";
  return "Ingreso";
}

function ReceiptHeader({ payment }: { payment: Payment }) {
  const isPosted = payment.state === EPaymentState.POSTED;
  return (
    <View className="items-center mb-3 mt-1">
      <View className="w-10 h-10 rounded-full bg-blue-100 justify-center items-center mb-2">
        <MoneyReceiveIcon color="#1976D2" size={24} />
      </View>
      {payment.name && (
        <Typography.Text className="text-sm font-semibold text-text-primary mb-0.5 text-center px-5">
          {payment.name}
        </Typography.Text>
      )}
      <View className="my-1">
        <Display.Monetary
          bold
          className="text-2xl font-bold text-text-primary mb-1"
          currencySymbol={getCurrencySymbol(payment.currency)}
          value={payment.signedAmount}
        />
      </View>
      <Typography.Text
        className={cn(
          "text-[13px] font-semibold mb-1",
          isPosted ? "text-green-500" : "text-orange-500",
        )}
      >
        {isPosted ? "Pago Exitoso" : "Borrador"}
      </Typography.Text>
      <Typography.Text className="text-[11px] text-text-tertiary">
        {payment.date}
      </Typography.Text>
    </View>
  );
}

function PaymentInfoSection({ payment }: { payment: Payment }) {
  const paidEntityName =
    payment.saleOrderPaid?.name || payment.invoicePaid?.name || payment.creditNotePaid?.name;

  return (
    <ReceiptSection title="Detalles del Pago">
      <ReceiptRow label="Nombre" value={payment.name} />
      <ReceiptRow label="Documento" value={paidEntityName} />
      <ReceiptRow label="Tipo" value={resolvePaymentType(payment)} />
      <ReceiptRow label="Método" value={payment.paymentMethod?.name} />
      <ReceiptRow label="Referencia" value={payment.paymentReference} />
      <ReceiptRow label="Ruta" value={payment.routeId ? `#${payment.routeId}` : undefined} />
    </ReceiptSection>
  );
}

function CustomerSection({ customer }: { customer: Customer }) {
  return (
    <ReceiptSection title="Cliente">
      <ReceiptRow label="Nombre" value={customer.name} />
      <ReceiptRow label="Identificación" value={customer.vat} />
    </ReceiptSection>
  );
}

function SaleOrderSection({ saleOrder }: { saleOrder: SaleOrder }) {
  return (
    <ReceiptSection title="Pedido Relacionado">
      <ReceiptRow label="Número" value={saleOrder.name} />
      <ReceiptRow label="Estado" value={saleOrder.status} />
      <ReceiptRow
        label="Total"
        value={
          <Display.Monetary
            className="text-xs text-text-primary font-medium flex-1 text-right"
            currencySymbol={getCurrencySymbol(saleOrder.currency)}
            value={saleOrder.amountTotal}
          />
        }
      />
      <ReceiptRow
        label="Saldo Pendiente"
        value={
          <Display.Monetary
            className="text-xs text-text-primary font-medium flex-1 text-right"
            currencySymbol={getCurrencySymbol(saleOrder.currency)}
            value={saleOrder.amountResidual}
          />
        }
      />
    </ReceiptSection>
  );
}

function InvoiceSection({ invoice }: { invoice: Invoice }) {
  return (
    <ReceiptSection title="Factura Relacionada">
      <ReceiptRow label="Número" value={invoice.name} />
      <ReceiptRow label="Estado" value={invoice.paymentState} />
      <ReceiptRow
        label="Total"
        value={
          <Display.Monetary
            className="text-xs text-text-primary font-medium flex-1 text-right"
            currencySymbol={getCurrencySymbol(invoice.currency)}
            value={invoice.amountTotal}
          />
        }
      />
      <ReceiptRow
        label="Saldo Pendiente"
        value={
          <Display.Monetary
            className="text-xs text-text-primary font-medium flex-1 text-right"
            currencySymbol={getCurrencySymbol(invoice.currency)}
            value={invoice.amountResidual}
          />
        }
      />
    </ReceiptSection>
  );
}

function CreditNoteSection({ creditNote }: { creditNote: CreditNote }) {
  return (
    <ReceiptSection title="Nota de Crédito">
      <ReceiptRow label="Número" value={creditNote.name} />
      <ReceiptRow label="Estado" value={creditNote.status} />
      <ReceiptRow
        label="Total"
        value={
          <Display.Monetary
            className="text-xs text-text-primary font-medium flex-1 text-right"
            currencySymbol={getCurrencySymbol(creditNote.currency)}
            value={creditNote.amountTotal}
          />
        }
      />
      <ReceiptRow
        label="Saldo Pendiente"
        value={
          <Display.Monetary
            className="text-xs text-text-primary font-medium flex-1 text-right"
            currencySymbol={getCurrencySymbol(creditNote.currency)}
            value={creditNote.amountResidual}
          />
        }
      />
    </ReceiptSection>
  );
}

function PaymentOdooSection({ paymentOdoo }: { paymentOdoo: PaymentOdoo }) {
  return (
    <ReceiptSection title="Sincronización (Odoo)">
      <ReceiptRow
        label="ID Remoto"
        value={paymentOdoo.remoteId ? `#${paymentOdoo.remoteId}` : undefined}
      />
      <ReceiptRow label="Estado" value={paymentOdoo.state} />
      <ReceiptRow label="Referencia" value={paymentOdoo.remoteRef} />
    </ReceiptSection>
  );
}

function PaymentCreditSection({
  paymentCredit,
  payment,
}: {
  paymentCredit: PaymentCredit;
  payment: Payment;
}) {
  return (
    <ReceiptSection title="Información de Crédito">
      <ReceiptRow
        label="Aplicación"
        value={payment.creditApplicationId ? `#${payment.creditApplicationId}` : undefined}
      />
      <ReceiptRow label="Término" value={payment.paymentTermDisplay} />
      <ReceiptRow label="Autorizado por" value={payment.authorizedPersonName} />
      <ReceiptRow label="Referencia" value={paymentCredit.paymentReference} />
    </ReceiptSection>
  );
}

function PaymentDetailContent() {
  const navigation = useNavigation();
  const { payment, isLoading, error, refresh, onBack } = usePaymentDetail();
  const receiptRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  }

  async function handleShareReceipt() {
    setIsSharing(true);
    await ReceiptExporterAdapter.captureAndShareAsPdf(receiptRef, {
      fileName: `comprobante_${payment?.name || "pago"}`,
      dialogTitle: "Compartir comprobante",
    });
    setIsSharing(false);
  }

  if (isLoading) {
    return <Feedback.Loading />;
  }

  if (error || !payment) {
    return <Feedback.Error message={error || "Pago no encontrado"} />;
  }

  const customer = payment.customer as Customer | null;
  const saleOrder = payment.saleOrderPaid as SaleOrder | null;
  const invoice = payment.invoicePaid as Invoice | null;
  const creditNote = payment.creditNotePaid;
  const paymentOdoo = payment.paymentOdoo as PaymentOdoo | null;
  const paymentCredit = payment.paymentCredit as PaymentCredit | null;

  return (
    <FormViewV2.Root
      description="Comprobante de pago"
      isEmpty={!payment}
      isLoading={isSharing}
      item={payment}
      name={payment.name || "Pago"}
      onBack={handleBack}
      onRefresh={refresh}
    >
      <FormViewV2.Header variant="default" />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>
            <View className="p-3 bg-bg-card rounded-lg" collapsable={false} ref={receiptRef}>
              <ReceiptHeader payment={payment} />

              <ReceiptDivider />
              <PaymentInfoSection payment={payment} />

              {customer && (
                <>
                  <ReceiptDivider />
                  <CustomerSection customer={customer} />
                </>
              )}

              {saleOrder && (
                <>
                  <ReceiptDivider />
                  <SaleOrderSection saleOrder={saleOrder} />
                </>
              )}

              {invoice && (
                <>
                  <ReceiptDivider />
                  <InvoiceSection invoice={invoice} />
                </>
              )}

              {creditNote && (
                <>
                  <ReceiptDivider />
                  <CreditNoteSection creditNote={creditNote} />
                </>
              )}

              {paymentOdoo && (
                <>
                  <ReceiptDivider />
                  <PaymentOdooSection paymentOdoo={paymentOdoo} />
                </>
              )}

              {paymentCredit && (
                <>
                  <ReceiptDivider />
                  <PaymentCreditSection payment={payment} paymentCredit={paymentCredit} />
                </>
              )}
            </View>
          </FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Form.Button onPress={handleBack} title="Cerrar" variant="secondary" />
          </View>
          <View className="flex-1">
            <Form.Button
              disabled={isSharing}
              onPress={handleShareReceipt}
              title="Compartir"
              variant="primary"
            />
          </View>
        </View>
      </FormViewV2.Footer>
    </FormViewV2.Root>
  );
}

export function PaymentDetailScreen(props: {
  paymentId?: string;
  payment?: Payment;
  onBack?: () => void;
}) {
  const route = useRoute();
  const navigationPayment = (route.params as any)?.payment as Payment | undefined;
  const navigationPaymentId = (route.params as any)?.paymentId as string | undefined;

  const initialPayment = props.payment ?? navigationPayment;
  const paymentId = props.paymentId ?? navigationPaymentId ?? initialPayment?.uuid;

  if (!paymentId && !initialPayment) {
    return <Feedback.Error message="ID de pago no proporcionado" />;
  }

  return (
    <PaymentDetailProvider
      initialPayment={initialPayment}
      onBack={props.onBack}
      paymentId={paymentId}
    >
      <PaymentDetailContent />
    </PaymentDetailProvider>
  );
}
