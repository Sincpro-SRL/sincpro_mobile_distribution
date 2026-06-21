import type { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import type { Payment } from "@sincpro/mobile-distribution/domain/payment";
import { Wizard } from "@sincpro/mobile-ui/views/Wizard";
import { useLocation } from "react-router-native";

import {
  EPayCreditNoteStep,
  PayCreditNoteWizardProvider,
  usePayCreditNoteWizard,
} from "./context";
import { StepOverview } from "./step1.overview";
import { StepMultiplePayments } from "./step2.multiplePayments";

function PayCreditNoteWizardContent() {
  const { isLoading } = usePayCreditNoteWizard();

  return (
    <Wizard.Root
      initialStep={EPayCreditNoteStep.PAYMENT_SETUP}
      isLoading={isLoading}
      loadingMessage="Procesando pago de nota de crédito..."
    >
      <Wizard.Step name={EPayCreditNoteStep.PAYMENT_SETUP}>
        {(wizard) => <StepOverview wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={EPayCreditNoteStep.MULTIPLE_PAYMENTS}>
        {(wizard) => <StepMultiplePayments wizard={wizard} />}
      </Wizard.Step>
    </Wizard.Root>
  );
}

interface PayCreditNoteWizardProps {
  creditNote?: CreditNote;
  customer?: Customer;
  payments?: Payment[];
}

export function PayCreditNoteWizard({
  creditNote,
  customer,
  payments,
}: PayCreditNoteWizardProps) {
  const location = useLocation();
  const creditNoteFromState = location.state?.creditNote as CreditNote | undefined;
  const customerFromState = location.state?.customer as Customer | undefined;
  const paymentsFromState = location.state?.payments as Payment[] | undefined;

  const resolvedCreditNote = creditNote ?? creditNoteFromState;
  const resolvedCustomer = customer ?? customerFromState ?? null;
  const resolvedPayments = payments ?? paymentsFromState ?? [];

  if (!resolvedCreditNote) {
    return null;
  }

  return (
    <PayCreditNoteWizardProvider
      creditNote={resolvedCreditNote}
      customer={resolvedCustomer}
      initialPayments={resolvedPayments}
    >
      <PayCreditNoteWizardContent />
    </PayCreditNoteWizardProvider>
  );
}
