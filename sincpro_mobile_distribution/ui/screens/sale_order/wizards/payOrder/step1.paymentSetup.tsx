import {
  PaymentSummary,
  SaleOrderCardHeader,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import AuthorizedPersonSelector from "@sincpro/mobile-distribution/ui/components/molecules/AuthorizedPersonSelector";
import DocumentTypeSelector from "@sincpro/mobile-distribution/ui/components/molecules/DocumentTypeSelector";
import { SaleOrderPaymentActions } from "@sincpro/mobile-distribution/ui/components/organisms";
import SaleOrderPaymentManager from "@sincpro/mobile-distribution/ui/components/organisms/SaleOrderPaymentManager";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useCallback, useMemo } from "react";
import { View } from "react-native";

import { EPaymentMode, EPayOrderStep, usePayOrderWizard } from "./context";

interface StepPaymentSetupProps {
  wizard: WizardContextValue;
}

export function StepPaymentSetup({ wizard }: StepPaymentSetupProps) {
  const {
    order,
    payments,
    documentType,
    selectedAuthorizedPerson,
    paymentMode,
    isLoading,
    hasError,
    isCreditPayment,
    amountDiscount,
    setPayments,
    setDocumentType,
    setSelectedAuthorizedPerson,
    goToMultiplePayments,
    handleConfirmPayment,
    retryFetchOrder,
  } = usePayOrderWizard();

  const handleGoToMultiplePayments = useCallback(() => {
    goToMultiplePayments();
    wizard.goToStep(EPayOrderStep.MULTIPLE_PAYMENTS);
  }, [goToMultiplePayments, wizard]);

  const orderHeaderInfo = useMemo(() => {
    if (!order) return null;
    return (
      <SaleOrderCardHeader saleOrder={order}>
        <SaleOrderCardHeader.ProductCount />
      </SaleOrderCardHeader>
    );
  }, [order]);

  const documentTypeSelector = useMemo(
    () => (
      <DocumentTypeSelector onChange={setDocumentType as any} value={documentType as any} />
    ),
    [documentType, setDocumentType],
  );

  const paymentManager = useMemo(() => {
    if (!order) return null;
    return (
      <SaleOrderPaymentManager
        customer={order.customer || undefined}
        goToMultiplePayments={handleGoToMultiplePayments}
        manyPayments={paymentMode === EPaymentMode.MULTIPLE}
        payments={payments || []}
        setPayments={setPayments}
        totalToPay={order.amountResidual}
      />
    );
  }, [order, payments, setPayments, paymentMode, handleGoToMultiplePayments]);

  const authorizedPersonSelector = useMemo(() => {
    if (!isCreditPayment || !order?.customer?.authorizedPersons) {
      return null;
    }
    return (
      <AuthorizedPersonSelector
        authorizedPersons={order.customer.authorizedPersons}
        onSelectPerson={setSelectedAuthorizedPerson}
        selectedPerson={selectedAuthorizedPerson}
      />
    );
  }, [
    isCreditPayment,
    order?.customer,
    selectedAuthorizedPerson,
    setSelectedAuthorizedPerson,
  ]);

  const paymentSummary = useMemo(() => {
    if (!order) return null;
    return (
      <View className="p-3">
        <PaymentSummary.Root currencySymbol={order.currencySymbol || "₡"}>
          <PaymentSummary.Subtotal value={order.amountUntaxed} />
          <PaymentSummary.Paid value={order.amountTotal - order.amountResidual} />
          <PaymentSummary.Discount value={amountDiscount} />
          <PaymentSummary.Exemptions value={0} />
          <PaymentSummary.Taxes value={order.amountTaxTotal} />
          <PaymentSummary.Total value={order.amountResidual} />
        </PaymentSummary.Root>
      </View>
    );
  }, [order, amountDiscount]);

  const footerActions = useMemo(() => {
    if (!order) return null;
    const total = payments?.reduce((a, c) => a + c.total, 0) || 0;
    return (
      <SaleOrderPaymentActions.Root
        compact
        currencySymbol={order.currencySymbol || "₡"}
        isLoading={isLoading}
      >
        <SaleOrderPaymentActions.InlineRow>
          <SaleOrderPaymentActions.TotalDisplay label="Total a pagar" total={total} />
          <SaleOrderPaymentActions.PrimaryAction
            disabled={total <= 0}
            label="Confirmar pago"
            onPress={handleConfirmPayment}
          />
        </SaleOrderPaymentActions.InlineRow>
      </SaleOrderPaymentActions.Root>
    );
  }, [order, handleConfirmPayment, payments, isLoading]);

  return (
    <FormViewV2.Root
      description="Facturación"
      errorMessage="No se pudo cargar la orden"
      hasError={hasError}
      isLoading={isLoading}
      item={order}
      name="Entregar orden"
      onRetry={retryFetchOrder}
    >
      <FormViewV2.Header />
      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>{orderHeaderInfo}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{documentTypeSelector}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{paymentManager}</FormViewV2.Content.Group>
          {authorizedPersonSelector && (
            <FormViewV2.Content.Group>{authorizedPersonSelector}</FormViewV2.Content.Group>
          )}
          <FormViewV2.Content.Group>{paymentSummary}</FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>
      <FormViewV2.Footer>{footerActions}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
