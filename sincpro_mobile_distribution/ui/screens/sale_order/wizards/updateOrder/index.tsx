import { StackActions, useNavigation, useRoute } from "@react-navigation/native";
import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import { Wizard } from "@sincpro/mobile-ui/views/Wizard";
import { useEffect } from "react";

import { EUpdateOrderStep, UpdateOrderWizardProvider } from "./context";
import { StepOverview } from "./step1.overview";
import { StepCustomerSelection } from "./step2.customerSelection";
import { StepProductCatalog } from "./step3.productCatalog";
import { StepProductDetail } from "./step4.productDetail";

function UpdateOrderWizardContent() {
  return (
    <Wizard.Root initialStep={EUpdateOrderStep.FORM_OVERVIEW}>
      <Wizard.Step name={EUpdateOrderStep.FORM_OVERVIEW}>
        {(wizard) => <StepOverview wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={EUpdateOrderStep.CUSTOMER_SELECTION}>
        {(wizard) => <StepCustomerSelection wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={EUpdateOrderStep.PRODUCT_CATALOG}>
        {(wizard) => <StepProductCatalog wizard={wizard} />}
      </Wizard.Step>

      <Wizard.Step name={EUpdateOrderStep.PRODUCT_LINE_DETAIL}>
        {(wizard) => <StepProductDetail wizard={wizard} />}
      </Wizard.Step>
    </Wizard.Root>
  );
}

export function SaleOrderUpdateWizard() {
  const route = useRoute();
  const navigation = useNavigation();
  const { show, hide } = useConfirmationContext();

  const order = ((route.params as any)?.order as SaleOrder) || null;

  useEffect(() => {
    if (!order) {
      navigation.dispatch(StackActions.replace(AppScreen.SALE_ORDER_LIST));
      return;
    }

    const canEdit = order.canBeUpdated();
    if (!canEdit) {
      show({
        title: "Orden no editable",
        message:
          "Esta orden no puede ser editada. Solo las cotizaciones y órdenes confirmadas no pagadas pueden modificarse.",
        confirmText: "Entendido",
        onConfirm: () => {
          hide();
          navigation.dispatch(
            StackActions.replace(AppScreen.SALE_ORDER_DETAIL, { saleOrder: order }),
          );
        },
      });
    }
  }, [order, navigation, show, hide]);

  if (!order || !order.canBeUpdated()) {
    return null;
  }

  return (
    <UpdateOrderWizardProvider initialOrder={order}>
      <UpdateOrderWizardContent />
    </UpdateOrderWizardProvider>
  );
}
