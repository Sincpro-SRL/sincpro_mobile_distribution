import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { EPaymentType, Payment } from "@sincpro/mobile-distribution/domain/payment";
import { CREDIT_PAYMENT_METHOD } from "@sincpro/mobile-distribution/domain/settings";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import AddItemIcon from "@sincpro/mobile-ui/icons/AddItemIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

import PaymentMethodSelector from "../molecules/PaymentMethodSelector";
import PaymentReferenceInput from "../molecules/PaymentReferenceInput";
import SaleOrderPaymentList from "./SaleOrderPaymentList";

interface SaleOrderPaymentManagerProps {
  totalToPay: number;
  payments: any[];
  setPayments: (payments: any[]) => void;
  customer?: Customer;
  backgroundColor?: string;
  manyPayments?: boolean;
  goToMultiplePayments?: () => void;
}

function SaleOrderPaymentManager({
  totalToPay,
  payments,
  setPayments,
  customer,
  backgroundColor,
  manyPayments = false,
  goToMultiplePayments,
}: SaleOrderPaymentManagerProps) {
  const isCreditPaymentSelected =
    payments.length > 0 &&
    payments[0].paymentMethod?.id === CREDIT_PAYMENT_METHOD.id &&
    payments[0].isCreditPayment === true;

  function handleSelectPaymentMethod(paymentMethod: any) {
    const draftPayment = Payment.obj<Payment>({});
    draftPayment.total = totalToPay;
    draftPayment.paymentMethod = paymentMethod;
    if (paymentMethod.id === CREDIT_PAYMENT_METHOD.id) {
      draftPayment.paymentType = EPaymentType.CREDIT_PAYMENT;
    }
    setPayments([draftPayment]);
  }

  function handleChangeReference(reference: string) {
    if (payments.length > 0) {
      const currentPayment = payments[0] as any;
      currentPayment.paymentReference = reference;
      setPayments([currentPayment]);
    }
  }

  function renderEditPaymentsLink() {
    if (manyPayments) {
      return (
        <Typography.Text
          onPress={() => goToMultiplePayments?.()}
          underline
          variant="captionSmall"
        >
          Editar métodos
        </Typography.Text>
      );
    }
    return null;
  }

  function renderMultiplePaymentButton() {
    if (manyPayments || isCreditPaymentSelected) {
      return null;
    }
    return (
      <Form.Button
        className="mb-1"
        icon={<Display.Icon customIcon={AddItemIcon} size={25} type="custom" />}
        onPress={() => goToMultiplePayments?.()}
        size="small"
        title="Cobrar con múltiples métodos"
        variant="outline"
      />
    );
  }

  function renderPaymentForm() {
    if (manyPayments) {
      return <SaleOrderPaymentList payments={payments} readonly />;
    }

    return (
      <>
        <PaymentMethodSelector
          customer={customer}
          onSelectPaymentMethod={handleSelectPaymentMethod}
          orderAmount={totalToPay}
          selectedPaymentMethodId={payments[0]?.paymentMethod?.id}
        />

        {payments.length > 0 && !isCreditPaymentSelected && (
          <PaymentReferenceInput
            onChange={handleChangeReference}
            value={(payments[0] as any)?.paymentReference}
          />
        )}
      </>
    );
  }

  return (
    <View className="p-4 gap-3" style={backgroundColor ? { backgroundColor } : undefined}>
      <View className="flex-row justify-between items-center">
        <Typography.Text semibold variant="body">
          Métodos de pago
        </Typography.Text>
        {renderEditPaymentsLink()}
      </View>
      <View>
        {renderMultiplePaymentButton()}
        {renderPaymentForm()}
      </View>
    </View>
  );
}

export default SaleOrderPaymentManager;
