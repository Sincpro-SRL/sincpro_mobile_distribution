import { EInvoicePaymentState } from "@sincpro/mobile-distribution/domain/invoice";
import {
  InvoiceCreditBadge,
  InvoicePenalizationBadge,
  InvoiceStateBadge,
  InvoiceStatusBadge,
} from "@sincpro/mobile-distribution/ui/components/atoms";
import {
  InvoiceCardHeader,
  PaymentSummary,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import {
  InvoiceLineList,
  InvoicePaymentManager,
  SaleOrderPaymentActions,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { Form } from "@sincpro/mobile-ui/Form";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import type { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useMemo } from "react";
import { View } from "react-native";

import { EPaymentMode, usePayInvoiceWizard } from "./context";

interface StepOverviewProps {
  wizard: WizardContextValue;
}

export function StepOverview({ wizard }: StepOverviewProps) {
  const {
    invoice,
    payments,
    paymentMode,
    currencySymbol,
    isLoading,
    isDraft,
    hasCredit,
    hasPenalization,
    isPenalizationMode,
    setPayments,
    refreshInvoice,
    handleConfirmPayment,
    handlePayPenalization,
    handleConfirmAndPostInvoice,
    handleBackToOverview,
    handleViewReceipt,
    handleViewPaymentHistory,
    goToMultiplePayments,
  } = usePayInvoiceWizard();

  const statusBadges = useMemo(() => {
    if (!invoice) return null;
    return (
      <>
        <InvoiceStateBadge state={invoice.state} />
        <InvoiceStatusBadge paymentState={invoice.paymentState} />
        {hasCredit && <InvoiceCreditBadge hasCredit />}
        {hasPenalization && (
          <InvoicePenalizationBadge amount={invoice.penalizationAmount ?? 0} />
        )}
      </>
    );
  }, [invoice, hasCredit, hasPenalization]);

  const invoiceHeaderInfo = useMemo(() => {
    if (!invoice) return null;
    const customer = invoice.customer;
    if (!customer) return null;
    return (
      <InvoiceCardHeader
        badges={statusBadges}
        currencySymbol={currencySymbol}
        customer={customer}
        invoices={[invoice]}
      >
        <InvoiceCardHeader.TotalAmount />
      </InvoiceCardHeader>
    );
  }, [invoice, currencySymbol, statusBadges]);

  const invoiceLines = useMemo(() => {
    if (!invoice) return null;
    return <InvoiceLineList currencySymbol={currencySymbol} lines={invoice.invoiceLines} />;
  }, [invoice, currencySymbol]);

  const paymentManager = useMemo(() => {
    if (!invoice) return null;

    const isInvoicePaid = [
      EInvoicePaymentState.PAID,
      EInvoicePaymentState.IN_PAYMENT,
    ].includes(invoice.paymentState);

    if (isInvoicePaid) return null;

    const totalToPay = isPenalizationMode
      ? (invoice.penalizationAmount ?? 0)
      : invoice.amountResidual;

    return (
      <InvoicePaymentManager
        goToMultiplePayments={() => goToMultiplePayments(wizard)}
        manyPayments={paymentMode === EPaymentMode.MULTIPLE}
        payments={payments}
        setPayments={setPayments}
        totalToPay={totalToPay}
      />
    );
  }, [
    invoice,
    payments,
    setPayments,
    paymentMode,
    isPenalizationMode,
    goToMultiplePayments,
    wizard,
  ]);

  const paymentSummary = useMemo(() => {
    if (!invoice) return null;
    return (
      <View className="p-3">
        <PaymentSummary.Root currencySymbol={currencySymbol}>
          <PaymentSummary.Subtotal value={invoice.amountUntaxed} />
          <PaymentSummary.Paid value={invoice.amountTotal - invoice.amountResidual} />
          <PaymentSummary.Taxes value={invoice.amountTax} />
          {hasPenalization && (
            <PaymentSummary.Line
              label="Penalización"
              value={invoice.penalizationAmount ?? 0}
            />
          )}
          <PaymentSummary.Total value={invoice.amountResidual} />
        </PaymentSummary.Root>
      </View>
    );
  }, [invoice, currencySymbol, hasPenalization]);

  const footerActions = useMemo(() => {
    if (!invoice) return null;

    const isPosted = invoice.isPosted();
    const isPaid = invoice.paymentState === EInvoicePaymentState.PAID;
    const needsPayment = [
      EInvoicePaymentState.NOT_PAID,
      EInvoicePaymentState.PARTIAL,
    ].includes(invoice.paymentState);

    if (isDraft) {
      const totalPaid = payments?.reduce((a, c) => a + c.total, 0) || 0;
      const expectedAmount = isPenalizationMode
        ? (invoice.penalizationAmount ?? 0)
        : invoice.amountResidual;
      const actionLabel = isPenalizationMode ? "Pagar Penalización" : "Confirmar pago";
      const actionHandler = isPenalizationMode ? handlePayPenalization : handleConfirmPayment;

      return (
        <View className="gap-3 p-3">
          {needsPayment && (
            <SaleOrderPaymentActions.Root
              compact
              currencySymbol={currencySymbol}
              isLoading={isLoading}
            >
              <SaleOrderPaymentActions.InlineRow>
                <SaleOrderPaymentActions.TotalDisplay
                  label="Total a pagar"
                  total={totalPaid}
                />
                <SaleOrderPaymentActions.PrimaryAction
                  disabled={totalPaid <= 0 || totalPaid !== expectedAmount}
                  label={actionLabel}
                  onPress={actionHandler}
                />
              </SaleOrderPaymentActions.InlineRow>
            </SaleOrderPaymentActions.Root>
          )}
          <View className="flex-row flex-wrap gap-3">
            <Form.Button
              loading={isLoading}
              onPress={refreshInvoice}
              size="small"
              title="Sincronizar"
              variant="outline"
            />
            <Form.Button
              disabled={isPenalizationMode}
              loading={isLoading}
              onPress={handleConfirmAndPostInvoice}
              size="small"
              title="Publicar factura"
              variant="secondary"
            />
          </View>
        </View>
      );
    }

    if (isPosted && isPaid) {
      return (
        <View className="gap-3 p-3">
          <View className="flex-row flex-wrap gap-3">
            <Form.Button
              loading={isLoading}
              onPress={refreshInvoice}
              size="small"
              title="Sincronizar"
              variant="outline"
            />
            <Form.Button
              confirm="¿Desea imprimir el comprobante de esta factura?"
              disabled={isPenalizationMode}
              onPress={handleViewReceipt}
              size="small"
              title="Imprimir"
              variant="outline"
            />
            <Form.Button
              disabled={isPenalizationMode}
              onPress={handleViewPaymentHistory}
              size="small"
              title="Ver pagos"
              variant="secondary"
            />
          </View>
        </View>
      );
    }

    if (isPosted && needsPayment) {
      const totalPaid = payments?.reduce((a, c) => a + c.total, 0) || 0;
      const expectedAmount = isPenalizationMode
        ? (invoice.penalizationAmount ?? 0)
        : invoice.amountResidual;
      const actionLabel = isPenalizationMode ? "Pagar Penalización" : "Confirmar pago";
      const actionHandler = isPenalizationMode ? handlePayPenalization : handleConfirmPayment;

      return (
        <View className="gap-3 p-3">
          <SaleOrderPaymentActions.Root
            compact
            currencySymbol={currencySymbol}
            isLoading={isLoading}
          >
            <SaleOrderPaymentActions.InlineRow>
              <SaleOrderPaymentActions.TotalDisplay label="Total a pagar" total={totalPaid} />
              <SaleOrderPaymentActions.PrimaryAction
                disabled={totalPaid <= 0 || totalPaid !== expectedAmount}
                label={actionLabel}
                onPress={actionHandler}
              />
            </SaleOrderPaymentActions.InlineRow>
          </SaleOrderPaymentActions.Root>
          <View className="flex-row flex-wrap gap-3">
            <Form.Button
              loading={isLoading}
              onPress={refreshInvoice}
              size="small"
              title="Sincronizar"
              variant="outline"
            />
            <Form.Button
              confirm="¿Desea imprimir el comprobante de esta factura?"
              disabled={isPenalizationMode}
              onPress={handleViewReceipt}
              size="small"
              title="Imprimir"
              variant="outline"
            />
          </View>
        </View>
      );
    }

    return null;
  }, [
    invoice,
    isDraft,
    isPenalizationMode,
    handleConfirmPayment,
    handlePayPenalization,
    handleConfirmAndPostInvoice,
    handleViewReceipt,
    handleViewPaymentHistory,
    payments,
    isLoading,
    currencySymbol,
  ]);

  if (!invoice) return null;

  return (
    <FormViewV2.Root
      description="Pago de factura"
      isLoading={isLoading}
      item={invoice}
      name={invoice.name}
      onBack={handleBackToOverview}
      onRefresh={refreshInvoice}
    >
      <FormViewV2.Header />
      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>{invoiceHeaderInfo}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{invoiceLines}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{paymentManager}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{paymentSummary}</FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>
      <FormViewV2.Footer>{footerActions}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
