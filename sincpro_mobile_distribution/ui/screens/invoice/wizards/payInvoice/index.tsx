import { Wizard } from "@sincpro/mobile-ui/views/Wizard";

import { EPayInvoiceStep, PayInvoiceWizardProvider, usePayInvoiceWizard } from "./context";
import { StepOverview } from "./step1.overview";
import { StepMultiplePayments } from "./step2.multiplePayments";

function PayInvoiceWizardContent() {
  const { isLoading } = usePayInvoiceWizard();

  return (
    <Wizard.Root
      initialStep={EPayInvoiceStep.PAYMENT_SETUP}
      isLoading={isLoading}
      loadingMessage="Procesando pago de factura..."
    >
      <Wizard.Step name={EPayInvoiceStep.PAYMENT_SETUP}>
        {(wizard) => <StepOverview wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={EPayInvoiceStep.MULTIPLE_PAYMENTS}>
        {(wizard) => <StepMultiplePayments wizard={wizard} />}
      </Wizard.Step>
    </Wizard.Root>
  );
}

export function InvoicePaymentWizard() {
  return (
    <PayInvoiceWizardProvider>
      <PayInvoiceWizardContent />
    </PayInvoiceWizardProvider>
  );
}
