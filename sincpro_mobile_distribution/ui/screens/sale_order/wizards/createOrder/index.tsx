import { useRoute } from "@react-navigation/native";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { Product } from "@sincpro/mobile-distribution/domain/product";
import { Wizard } from "@sincpro/mobile-ui/views/Wizard";

import { CreateOrderWizardProvider, ECreateOrderStep } from "./context";
import { StepOverview } from "./step1.overview";
import { StepCustomerSelection } from "./step2.customerSelection";
import { StepCustomerCreate } from "./step3.customerCreate";
import { StepProductCatalog } from "./step4.productCatalog";
import { StepProductDetail } from "./step5.productDetail";

function CreateOrderWizardContent() {
  return (
    <Wizard.Root initialStep={ECreateOrderStep.FORM_OVERVIEW}>
      <Wizard.Step name={ECreateOrderStep.FORM_OVERVIEW}>
        {(wizard) => <StepOverview wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={ECreateOrderStep.CUSTOMER_SELECTION}>
        {(wizard) => <StepCustomerSelection wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={ECreateOrderStep.CUSTOMER_CREATE}>
        {(wizard) => <StepCustomerCreate wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={ECreateOrderStep.PRODUCT_CATALOG}>
        {(wizard) => <StepProductCatalog wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={ECreateOrderStep.PRODUCT_LINE_DETAIL}>
        {(wizard) => <StepProductDetail wizard={wizard} />}
      </Wizard.Step>
    </Wizard.Root>
  );
}

export function SaleOrderCreateOrderWizard() {
  const route = useRoute();
  const initialCustomer = ((route.params as any)?.customer as Customer) || null;
  const initialProduct = ((route.params as any)?.product as Product) || null;

  return (
    <CreateOrderWizardProvider
      initialCustomer={initialCustomer}
      initialProduct={initialProduct}
    >
      <CreateOrderWizardContent />
    </CreateOrderWizardProvider>
  );
}
