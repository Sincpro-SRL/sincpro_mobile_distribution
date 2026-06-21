import {
  CustomerInfoCard,
  PaymentSummary,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import {
  CreditNoteHeaderCard,
  CreditNoteLineList,
  SaleOrderPaymentActions,
  SaleOrderPaymentManager,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import type { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useMemo } from "react";
import { View } from "react-native";

import { EPaymentMode, usePayCreditNoteWizard } from "./context";

interface StepOverviewProps {
  wizard: WizardContextValue;
}

export function StepOverview({ wizard }: StepOverviewProps) {
  const {
    creditNote,
    customer,
    payments,
    paymentMode,
    currencySymbol,
    isLoading,
    totalToPay,
    totalPaid,
    setPayments,
    handleConfirmPayment,
    handleBackToOverview,
    goToMultiplePayments,
  } = usePayCreditNoteWizard();

  const creditNoteHeader = useMemo(() => {
    return <CreditNoteHeaderCard creditNote={creditNote} />;
  }, [creditNote]);

  const customerSection = useMemo(() => {
    if (!customer) return null;
    return <CustomerInfoCard customer={customer} />;
  }, [customer]);

  const creditNoteLinesSection = useMemo(() => {
    if (!creditNote.creditNoteLines || creditNote.creditNoteLines.length === 0) return null;
    return (
      <CreditNoteLineList
        currencySymbol={currencySymbol}
        lines={creditNote.creditNoteLines}
        title="Productos a devolver"
      />
    );
  }, [creditNote.creditNoteLines, currencySymbol]);

  const paymentManager = useMemo(() => {
    return (
      <SaleOrderPaymentManager
        goToMultiplePayments={() => goToMultiplePayments(wizard)}
        manyPayments={paymentMode === EPaymentMode.MULTIPLE}
        payments={payments}
        setPayments={setPayments}
        totalToPay={totalToPay}
      />
    );
  }, [payments, setPayments, paymentMode, totalToPay, goToMultiplePayments, wizard]);

  const paymentSummary = useMemo(() => {
    return (
      <View className="p-3">
        <PaymentSummary.Root currencySymbol={currencySymbol}>
          <PaymentSummary.Subtotal value={creditNote.amountUntaxed} />
          <PaymentSummary.Taxes value={creditNote.amountTax} />
          <PaymentSummary.Total value={totalToPay} />
        </PaymentSummary.Root>
      </View>
    );
  }, [creditNote, currencySymbol, totalToPay]);

  const footerActions = useMemo(() => {
    const isDisabled = totalPaid <= 0 || !customer || payments.length === 0;

    return (
      <SaleOrderPaymentActions.Root
        compact
        currencySymbol={currencySymbol}
        isLoading={isLoading}
      >
        <SaleOrderPaymentActions.InlineRow>
          <SaleOrderPaymentActions.TotalDisplay label="Total devolución" total={totalPaid} />
          <SaleOrderPaymentActions.PrimaryAction
            disabled={isDisabled}
            label="Procesar Devolución"
            onPress={handleConfirmPayment}
          />
        </SaleOrderPaymentActions.InlineRow>
      </SaleOrderPaymentActions.Root>
    );
  }, [totalPaid, customer, payments.length, currencySymbol, isLoading, handleConfirmPayment]);

  return (
    <FormViewV2.Root
      description="Confirmación de devolución"
      isLoading={isLoading}
      item={creditNote}
      name="Devolución de nota de crédito"
      onBack={handleBackToOverview}
    >
      <FormViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER} />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>{creditNoteHeader}</FormViewV2.Content.Group>
          {customerSection && (
            <FormViewV2.Content.Group>{customerSection}</FormViewV2.Content.Group>
          )}
          {creditNoteLinesSection && (
            <FormViewV2.Content.Group>{creditNoteLinesSection}</FormViewV2.Content.Group>
          )}
          <FormViewV2.Content.Group>{paymentManager}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{paymentSummary}</FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>{footerActions}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
