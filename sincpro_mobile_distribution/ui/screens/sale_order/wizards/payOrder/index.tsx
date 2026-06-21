import { Wizard } from "@sincpro/mobile-ui/views/Wizard";

import { EPayOrderStep, PayOrderWizardProvider, usePayOrderWizard } from "./context";
import { StepPaymentSetup } from "./step1.paymentSetup";
import { StepMultiplePayments } from "./step2.multiplePayments";

function PayOrderWizardContent() {
  const { isLoading } = usePayOrderWizard();

  return (
    <Wizard.Root
      initialStep={EPayOrderStep.PAYMENT_SETUP}
      isLoading={isLoading}
      loadingMessage="Procesando pagos..."
    >
      <Wizard.Step name={EPayOrderStep.PAYMENT_SETUP}>
        {(wizard) => <StepPaymentSetup wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={EPayOrderStep.MULTIPLE_PAYMENTS}>
        {(wizard) => <StepMultiplePayments wizard={wizard} />}
      </Wizard.Step>
    </Wizard.Root>
  );
}

export function SaleOrderPaymentWizard() {
  return (
    <PayOrderWizardProvider>
      <PayOrderWizardContent />
    </PayOrderWizardProvider>
  );
}
