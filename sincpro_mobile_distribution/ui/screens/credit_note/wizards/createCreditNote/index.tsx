import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import type { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { Wizard } from "@sincpro/mobile-ui/views/Wizard";
import { useLocation } from "react-router-native";

import {
  CreateCreditNoteWizardProvider,
  ECreateCreditNoteStep,
  useCreateCreditNoteWizard,
} from "./context";
import { StepOverview } from "./step1.overview";
import { StepItemSelection } from "./step2.itemSelection";
import { StepItemReview } from "./step3.itemReview";

function CreateCreditNoteWizardContent() {
  const { isLoading } = useCreateCreditNoteWizard();

  return (
    <Wizard.Root
      initialStep={ECreateCreditNoteStep.OVERVIEW}
      isLoading={isLoading}
      loadingMessage="Creando nota de crédito..."
    >
      <Wizard.Step name={ECreateCreditNoteStep.OVERVIEW}>
        {(wizard) => <StepOverview wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={ECreateCreditNoteStep.ITEM_SELECTION}>
        {(wizard) => <StepItemSelection wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={ECreateCreditNoteStep.ITEM_REVIEW}>
        {(wizard) => <StepItemReview wizard={wizard} />}
      </Wizard.Step>
    </Wizard.Root>
  );
}

interface CreateCreditNoteWizardProps {
  originalOrder?: SaleOrder;
  customer?: Customer;
}

export function CreateCreditNoteWizard({
  originalOrder,
  customer,
}: CreateCreditNoteWizardProps) {
  const location = useLocation();
  const orderFromState = location.state?.originalOrder as SaleOrder | undefined;
  const customerFromState = location.state?.customer as Customer | undefined;

  const resolvedOrder = originalOrder ?? orderFromState;
  const resolvedCustomer = customer ?? customerFromState ?? null;

  if (!resolvedOrder) {
    return null;
  }

  return (
    <CreateCreditNoteWizardProvider customer={resolvedCustomer} originalOrder={resolvedOrder}>
      <CreateCreditNoteWizardContent />
    </CreateCreditNoteWizardProvider>
  );
}
