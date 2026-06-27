import { type IPaymentMethod, Payment } from "@sincpro/mobile-distribution/domain/payment";
import {
  CustomerInfoCard,
  PaymentBalance,
  PaymentMethodSelector,
  PaymentReferenceInput,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import {
  CreditNoteHeaderCard,
  SaleOrderPaymentList,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { Form } from "@sincpro/mobile-ui/Form";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import type { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useMemo, useState } from "react";
import { Alert, View } from "react-native";

import { usePayCreditNoteWizard } from "./context";

interface StepMultiplePaymentsProps {
  wizard: WizardContextValue;
}

export function StepMultiplePayments({ wizard }: StepMultiplePaymentsProps) {
  const {
    creditNote,
    customer,
    payments,
    currencySymbol,
    isLoading,
    totalToPay,
    totalPaid,
    remainingToPay,
    setPayments,
    removePayment,
    goBackToOverview,
  } = usePayCreditNoteWizard();

  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<IPaymentMethod>();
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>();

  function openAddForm() {
    setPaymentMethod(undefined);
    setPaymentAmount(remainingToPay);
    setPaymentReference(undefined);
    setShowAddForm(true);
  }

  function closeAddForm() {
    setShowAddForm(false);
  }

  function handleAddPayment() {
    if (!paymentMethod) {
      Alert.alert("Error", "Seleccione un método de pago.");
      return;
    }
    if (paymentAmount <= 0) {
      Alert.alert("Error", "El monto debe ser mayor a 0.");
      return;
    }

    const payment = Payment.obj<Payment>({});
    payment.paymentMethod = paymentMethod;
    payment.total = paymentAmount;
    if (paymentReference) {
      (payment as any).paymentReference = paymentReference;
    }

    setPayments([...payments, payment]);
    closeAddForm();
  }

  function handleRemovePayment(payment: Payment) {
    removePayment(payment.uuid);
  }

  const creditNoteHeader = useMemo(() => {
    return <CreditNoteHeaderCard creditNote={creditNote} />;
  }, [creditNote]);

  const customerSection = useMemo(() => {
    if (!customer) return null;
    return <CustomerInfoCard customer={customer} />;
  }, [customer]);

  const balanceSection = useMemo(() => {
    return (
      <View className="p-4">
        <PaymentBalance.Root
          currencySymbol={currencySymbol}
          remainingToPay={remainingToPay}
          totalPaid={totalPaid}
          totalToPay={totalToPay}
        >
          <PaymentBalance.TotalToPay />
          <PaymentBalance.TotalPaid />
          <PaymentBalance.RemainingToPay />
        </PaymentBalance.Root>
      </View>
    );
  }, [currencySymbol, totalToPay, totalPaid, remainingToPay]);

  const paymentsSection = useMemo(() => {
    return (
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <Typography.Text semibold variant="body">
            Métodos de devolución
          </Typography.Text>
          <Form.Button
            disabled={remainingToPay <= 0}
            onPress={openAddForm}
            size="small"
            title="+ Agregar"
            variant="outline"
          />
        </View>

        {showAddForm && customer && (
          <View className="bg-bg-muted p-4 rounded-xl mb-4 gap-3">
            <PaymentMethodSelector
              customer={customer}
              hideCreditOption
              onSelectPaymentMethod={setPaymentMethod}
              orderAmount={paymentAmount}
              selectedPaymentMethodId={paymentMethod?.id}
            />
            <Form.MonetaryInput
              amount={paymentAmount}
              currencySymbol={currencySymbol}
              onChange={setPaymentAmount}
            />
            <PaymentReferenceInput onChange={setPaymentReference} value={paymentReference} />
            <View className="flex-row justify-end gap-2">
              <Form.Button
                onPress={closeAddForm}
                size="small"
                title="Cancelar"
                variant="outline"
              />
              <Form.Button
                onPress={handleAddPayment}
                size="small"
                title="Agregar"
                variant="accent"
              />
            </View>
          </View>
        )}

        <SaleOrderPaymentList onDelete={handleRemovePayment} payments={payments} />
      </View>
    );
  }, [
    customer,
    payments,
    currencySymbol,
    paymentMethod,
    paymentAmount,
    paymentReference,
    remainingToPay,
    showAddForm,
  ]);

  const footerActions = useMemo(() => {
    return (
      <View className="p-4">
        <Form.Button
          onPress={() => goBackToOverview(wizard)}
          title="Confirmar métodos de pago"
          variant="accent"
        />
      </View>
    );
  }, [goBackToOverview, wizard]);

  return (
    <FormViewV2.Root
      description="Múltiples métodos de devolución"
      isLoading={isLoading}
      item={creditNote}
      name="Devolución de nota de crédito"
      onBack={() => goBackToOverview(wizard)}
    >
      <FormViewV2.Header variant="default" />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>{creditNoteHeader}</FormViewV2.Content.Group>
          {customerSection && (
            <FormViewV2.Content.Group>{customerSection}</FormViewV2.Content.Group>
          )}
          <FormViewV2.Content.Group>{balanceSection}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{paymentsSection}</FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>{footerActions}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
