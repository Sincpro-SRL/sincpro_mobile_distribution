import type { IPaymentMethod } from "@sincpro/mobile-distribution/domain/payment";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import {
  InvoiceCardHeader,
  PaymentBalance,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import PaymentMethodSelector from "@sincpro/mobile-distribution/ui/components/molecules/PaymentMethodSelector";
import PaymentReferenceInput from "@sincpro/mobile-distribution/ui/components/molecules/PaymentReferenceInput";
import { SaleOrderPaymentList } from "@sincpro/mobile-distribution/ui/components/organisms";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import type { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useMemo, useState } from "react";
import { Alert, View } from "react-native";

import { usePayInvoiceWizard } from "./context";

interface StepMultiplePaymentsProps {
  wizard: WizardContextValue;
}

export function StepMultiplePayments({ wizard }: StepMultiplePaymentsProps) {
  const {
    invoice,
    payments,
    currencySymbol,
    isLoading,
    setPayments,
    removePayment,
    goBackToOverview,
  } = usePayInvoiceWizard();

  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<IPaymentMethod>();
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>();

  const totalToPay = invoice?.amountResidual || 0;
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.total, 0), [payments]);
  const remainingToPay = totalToPay - totalPaid;

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

  function handleRemovePayment(uuid: string) {
    removePayment(uuid);
  }

  if (!invoice) return null;
  const customer = invoice.customer;
  if (!customer) return null;

  return (
    <FormViewV2.Root
      description="Múltiples métodos de pago"
      isLoading={isLoading}
      item={invoice}
      name={invoice.name}
      onBack={() => goBackToOverview(wizard)}
    >
      <FormViewV2.Header />
      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>
            <InvoiceCardHeader
              currencySymbol={currencySymbol}
              customer={customer}
              invoices={[invoice]}
            >
              <InvoiceCardHeader.TotalAmount />
            </InvoiceCardHeader>
          </FormViewV2.Content.Group>

          <FormViewV2.Content.Group>
            <View className="p-3 gap-3">
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
          </FormViewV2.Content.Group>

          <FormViewV2.Content.Group>
            <View className="p-3 gap-3">
              <View className="flex-row justify-between items-center">
                <Typography.Text semibold variant="body">
                  Métodos de pago
                </Typography.Text>
                <Form.Button
                  disabled={remainingToPay <= 0}
                  onPress={openAddForm}
                  size="small"
                  title="+ Agregar"
                  variant="outline"
                />
              </View>

              {showAddForm && (
                <View className="bg-bg-muted p-3 rounded-lg gap-3">
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
                  <PaymentReferenceInput
                    onChange={setPaymentReference}
                    value={paymentReference}
                  />
                  <View className="flex-row justify-end gap-2">
                    <Form.Button
                      onPress={closeAddForm}
                      size="small"
                      title="Cancelar"
                      variant="outline"
                    />
                    <Form.Button
                      disabled={!paymentMethod || paymentAmount <= 0}
                      onPress={handleAddPayment}
                      size="small"
                      title="Agregar"
                      variant="primary"
                    />
                  </View>
                </View>
              )}

              <SaleOrderPaymentList
                onDelete={(item: any) => item.uuid && handleRemovePayment(item.uuid)}
                payments={payments}
              />
            </View>
          </FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>
        <View className="p-2">
          <Form.Button
            icon={
              <Display.Icon
                color={theme.text.inverse}
                name="check-circle"
                size={14}
                type="feather"
              />
            }
            onPress={() => goBackToOverview(wizard)}
            title="Confirmar pagos"
            variant="accent"
          />
        </View>
      </FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
