import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import { Wizard } from "@sincpro/mobile-ui/views/Wizard";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-native";

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
  const location = useLocation();
  const navigate = useNavigate();
  const { show, hide } = useConfirmationContext();

  const state = location.state as { order?: SaleOrder } | undefined;
  const order = state?.order || null;

  useEffect(() => {
    if (!order) {
      navigate(AppScreen.SALE_ORDER_LIST, { replace: true });
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
          navigate(AppScreen.SALE_ORDER_DETAIL, {
            replace: true,
            state: { saleOrder: order },
          });
        },
      });
    }
  }, [order, navigate, show, hide]);

  if (!order || !order.canBeUpdated()) {
    return null;
  }

  return (
    <UpdateOrderWizardProvider initialOrder={order}>
      <UpdateOrderWizardContent />
    </UpdateOrderWizardProvider>
  );
}
