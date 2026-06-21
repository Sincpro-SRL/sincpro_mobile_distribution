import type { IPaymentMethod } from "@sincpro/mobile-distribution/domain/payment";
import { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { CREDIT_PAYMENT_METHOD } from "@sincpro/mobile-distribution/domain/settings";
import {
  PaymentBalance,
  SaleOrderCardHeader,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import PaymentMethodSelector from "@sincpro/mobile-distribution/ui/components/molecules/PaymentMethodSelector";
import PaymentReferenceInput from "@sincpro/mobile-distribution/ui/components/molecules/PaymentReferenceInput";
import {
  SaleOrderPaymentActions,
  SaleOrderPaymentList,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { getIcon } from "@sincpro/mobile-ui/icons/icon_getters";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useMemo, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";

import { EPayOrderStep, usePayOrderWizard } from "./context";

enum EInternalStep {
  PAYMENT_LIST = "PAYMENT_LIST",
  CREATE_PAYMENT = "CREATE_PAYMENT",
}

enum EPaymentFormMode {
  EDIT_AMOUNT = "EDIT_AMOUNT",
  SELECT_METHOD = "SELECT_METHOD",
}

interface StepMultiplePaymentsProps {
  wizard: WizardContextValue;
}

export function StepMultiplePayments({ wizard }: StepMultiplePaymentsProps) {
  const {
    order,
    payments,
    amountDiscount,
    isLoading,
    setPayments,
    addPayment,
    removePayment,
    handleBackToOverview,
  } = usePayOrderWizard();

  const [internalStep, setInternalStep] = useState<EInternalStep>(EInternalStep.PAYMENT_LIST);
  const [paymentFormMode, setPaymentFormMode] = useState<EPaymentFormMode>(
    EPaymentFormMode.SELECT_METHOD,
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<IPaymentMethod>();
  const [paymentReference, setPaymentReference] = useState<string>();
  const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null);

  const amountToPay = useMemo(() => {
    if (!order) return 0;
    return order.amountResidual - amountDiscount;
  }, [order, amountDiscount]);

  const amountPayment = useMemo(() => {
    return payments.reduce((sum, payment) => sum + payment.total, 0);
  }, [payments]);

  const remainingAmount = useMemo(() => {
    return amountToPay - amountPayment;
  }, [amountToPay, amountPayment]);

  const goBackToSetup = () => {
    handleBackToOverview();
    wizard.goToStep(EPayOrderStep.PAYMENT_SETUP);
  };

  const confirmPayments = () => {
    goBackToSetup();
  };

  const discardPayments = () => {
    setPayments([]);
    goBackToSetup();
  };

  const openCreatePayment = () => {
    setPaymentAmount(remainingAmount);
    setPaymentMethod(undefined);
    setPaymentReference(undefined);
    setPaymentFormMode(EPaymentFormMode.SELECT_METHOD);
    setEditingPaymentIndex(null);
    setInternalStep(EInternalStep.CREATE_PAYMENT);
  };

  const openEditPayment = (payment: any, index: number) => {
    setPaymentAmount(payment.total);
    setPaymentMethod(payment.paymentMethod);
    setPaymentReference(payment.paymentReference || undefined);
    setPaymentFormMode(EPaymentFormMode.EDIT_AMOUNT);
    setEditingPaymentIndex(index);
    setInternalStep(EInternalStep.CREATE_PAYMENT);
  };

  const handleSelectMethod = (method: IPaymentMethod) => {
    setPaymentMethod(method);
    setPaymentFormMode(EPaymentFormMode.EDIT_AMOUNT);
  };

  const handleChangeMethod = () => {
    setPaymentFormMode(EPaymentFormMode.SELECT_METHOD);
  };

  function renderPaymentIcon(name: string) {
    const iconPayment = getIcon(name);
    if (iconPayment) {
      return <Display.Icon customIcon={iconPayment.icon} size={24} type="custom" />;
    }
    return <Display.Icon name="dollar-sign" size={24} type="feather" />;
  }

  const handleCreatePayment = () => {
    if (!paymentMethod) {
      Alert.alert(
        "Método de pago requerido",
        "Por favor, seleccione un método de pago antes de continuar.",
      );
      return;
    }

    if (paymentAmount <= 0) {
      Alert.alert("Monto inválido", "El monto debe ser mayor a 0.");
      return;
    }

    if (editingPaymentIndex !== null) {
      const updatedPayments = [...payments];
      const existingPayment = updatedPayments[editingPaymentIndex];
      existingPayment.paymentMethod = paymentMethod;
      existingPayment.total = paymentAmount;
      (existingPayment as any).paymentReference = paymentReference;
      setPayments(updatedPayments);
    } else {
      const payment = Payment.obj<Payment>({});
      payment.paymentMethod = paymentMethod;
      payment.total = paymentAmount;
      if (paymentReference) {
        (payment as any).paymentReference = paymentReference;
      }
      addPayment(payment);
    }
    setEditingPaymentIndex(null);
    setInternalStep(EInternalStep.PAYMENT_LIST);
  };

  if (!order) return null;

  if (internalStep === EInternalStep.CREATE_PAYMENT) {
    return (
      <FormViewV2.Root
        description="Cobro con múltiples métodos"
        item={order}
        name={editingPaymentIndex !== null ? "Editar Pago" : "Agregar Pago"}
        onBack={() => setInternalStep(EInternalStep.PAYMENT_LIST)}
      >
        <FormViewV2.Header />
        <FormViewV2.Content>
          <FormViewV2.Content.Groups>
            {paymentFormMode === EPaymentFormMode.EDIT_AMOUNT && paymentMethod && (
              <>
                <FormViewV2.Content.Group>
                  <View className="p-4 gap-3">
                    <Typography.Text semibold variant="body">
                      Monto a pagar
                    </Typography.Text>
                    <Form.MonetaryInput
                      amount={paymentAmount}
                      currencySymbol={order.currencySymbol || "₡"}
                      onChange={setPaymentAmount}
                    />
                    {paymentMethod.id !== CREDIT_PAYMENT_METHOD.id && (
                      <View className="mt-2">
                        <PaymentReferenceInput
                          onChange={setPaymentReference}
                          value={paymentReference}
                        />
                      </View>
                    )}
                  </View>
                </FormViewV2.Content.Group>

                <FormViewV2.Content.Group>
                  <View className="p-4 gap-2">
                    <Typography.Text className="text-text-tertiary" variant="bodySmall">
                      Método de pago seleccionado
                    </Typography.Text>
                    <View className="flex-row justify-between items-center bg-bg-muted p-3 rounded-lg">
                      <View className="flex-row items-center gap-3">
                        {renderPaymentIcon(paymentMethod.name)}
                        <Typography.Text semibold variant="body">
                          {paymentMethod.name}
                        </Typography.Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        className="flex-row items-center gap-1 px-3 py-1.5 rounded-md bg-bg-card border border-orange-500"
                        onPress={handleChangeMethod}
                      >
                        <Display.Icon
                          color="#f97316"
                          name="swap-horizontal"
                          size={16}
                          type="ionicons"
                        />
                        <Typography.Text className="text-orange-500" variant="bodySmall">
                          Cambiar
                        </Typography.Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </FormViewV2.Content.Group>
              </>
            )}

            {paymentFormMode === EPaymentFormMode.SELECT_METHOD && (
              <FormViewV2.Content.Group>
                <View className="p-4">
                  <Typography.Text className="mb-4 text-center" semibold variant="body">
                    Seleccione un método de pago
                  </Typography.Text>
                  <PaymentMethodSelector
                    customer={order.customer || undefined}
                    onSelectPaymentMethod={handleSelectMethod}
                    orderAmount={paymentAmount}
                    selectedPaymentMethodId={paymentMethod?.id}
                  />
                </View>
              </FormViewV2.Content.Group>
            )}
          </FormViewV2.Content.Groups>
        </FormViewV2.Content>
        <FormViewV2.Footer>
          <SaleOrderPaymentActions.Root compact currencySymbol={order.currencySymbol || "₡"}>
            <SaleOrderPaymentActions.InlineRow>
              <SaleOrderPaymentActions.TotalDisplay
                label="Total"
                total={paymentAmount || 0}
              />
              <SaleOrderPaymentActions.PrimaryAction
                disabled={
                  !paymentMethod || paymentFormMode === EPaymentFormMode.SELECT_METHOD
                }
                label={editingPaymentIndex !== null ? "Guardar" : "Agregar"}
                onPress={handleCreatePayment}
              />
            </SaleOrderPaymentActions.InlineRow>
          </SaleOrderPaymentActions.Root>
        </FormViewV2.Footer>
      </FormViewV2.Root>
    );
  }

  return (
    <FormViewV2.Root
      description="Cobro múltiple métodos"
      isLoading={isLoading}
      item={order}
      name="Entrega de orden"
      onBack={goBackToSetup}
    >
      <FormViewV2.Header />
      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>
            <SaleOrderCardHeader saleOrder={order}>
              <SaleOrderCardHeader.ProductCount />
            </SaleOrderCardHeader>
          </FormViewV2.Content.Group>
          <FormViewV2.Content.Group>
            <View className="p-3">
              <View className="border-b border-border-default justify-center items-center py-2">
                <Typography.Text semibold variant="body">
                  Detalle de cobro
                </Typography.Text>
              </View>
              <View className="py-2">
                <Typography.Text className="pb-2" semibold variant="bodySmall">
                  Balance de pago
                </Typography.Text>
                <PaymentBalance.Root
                  currencySymbol={order.currencySymbol || "₡"}
                  remainingToPay={remainingAmount}
                  totalPaid={amountPayment}
                  totalToPay={amountToPay}
                >
                  <PaymentBalance.TotalToPay />
                  <PaymentBalance.TotalPaid />
                  <PaymentBalance.RemainingToPay />
                </PaymentBalance.Root>
              </View>
              <View className="py-2">
                <Typography.Text semibold variant="bodySmall">
                  Métodos de pago
                </Typography.Text>
                <Form.Button
                  className="mt-2.5 mb-4"
                  icon={
                    <Display.Icon color="#f97316" name="plus" size={16} type="antdesign" />
                  }
                  onPress={openCreatePayment}
                  size="small"
                  title="Agregar método de pago"
                  variant="outline"
                />
              </View>
              <SaleOrderPaymentList
                onDelete={(item: any) => item.uuid && removePayment(item.uuid)}
                onPress={openEditPayment}
                payments={payments}
              />
            </View>
          </FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>
      <FormViewV2.Footer>
        <View className="p-2">
          <Form.Button
            className="mb-2"
            icon={
              <Display.Icon
                color={theme.text.inverse}
                name="check-circle"
                size={14}
                type="feather"
              />
            }
            onPress={confirmPayments}
            size="small"
            title="Confirmar pagos"
            variant="accent"
          />
          <Form.Button
            className="border-red-500"
            icon={
              <Display.Icon color="#ef4444" name="return-up-back" size={14} type="ionicons" />
            }
            onPress={discardPayments}
            size="small"
            title="Descartar"
            variant="outlineDanger"
          />
        </View>
      </FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
