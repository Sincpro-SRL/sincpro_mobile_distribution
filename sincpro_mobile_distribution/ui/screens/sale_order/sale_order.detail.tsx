import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import {
  SaleOrderDetailContent,
  SaleOrderDetailFooter,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useLocation } from "react-router-native";

import { SaleOrderDetailProvider, useSaleOrderDetail } from "./sale_order.detail.context";

function SaleOrderDetailScreenComponent() {
  const {
    selectedSaleOrder,
    isLoading,
    canEditSaleOrder,
    refreshSaleOrder,
    handleBack,
    handlePay,
    handleSelectInvoice,
    handleViewReceipt,
    handleViewInvoice,
    handleViewReceiptFromInvoice,
    handleDeliver,
    handleEdit,
    handleConfirmQuotation,
  } = useSaleOrderDetail();

  return (
    <FormViewV2.Root
      description="Detalle de orden"
      isEmpty={!selectedSaleOrder}
      isLoading={isLoading}
      item={selectedSaleOrder}
      name="Entrega de orden"
      onBack={handleBack}
      onRefresh={refreshSaleOrder}
    >
      <FormViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER} />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          {selectedSaleOrder && (
            <SaleOrderDetailContent
              onViewInvoice={handleViewInvoice}
              onViewReceipt={handleViewReceiptFromInvoice}
              saleOrder={selectedSaleOrder}
            />
          )}
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>
        {selectedSaleOrder && (
          <SaleOrderDetailFooter
            canEdit={canEditSaleOrder}
            onConfirmQuotation={handleConfirmQuotation}
            onDeliver={handleDeliver}
            onEdit={canEditSaleOrder ? handleEdit : undefined}
            onPay={handlePay}
            onSelectInvoice={handleSelectInvoice}
            onViewReceipt={handleViewReceipt}
            saleOrder={selectedSaleOrder}
          />
        )}
      </FormViewV2.Footer>
    </FormViewV2.Root>
  );
}

interface SaleOrderDetailScreenProps {
  saleOrder?: SaleOrder;
  saleOrderId?: string | number;
  onBack?: () => void;
}

export function SaleOrderDetailScreen(props: SaleOrderDetailScreenProps) {
  const location = useLocation();
  const navigationSaleOrder = location.state?.saleOrder;
  const rawSaleOrder = props.saleOrder ?? navigationSaleOrder;

  const saleOrderFromProps = rawSaleOrder
    ? rawSaleOrder instanceof SaleOrder
      ? rawSaleOrder
      : SaleOrder.fromJSON(rawSaleOrder)
    : undefined;

  return (
    <SaleOrderDetailProvider
      initialSaleOrder={saleOrderFromProps}
      onBack={props.onBack}
      saleOrderId={props.saleOrderId}
    >
      <SaleOrderDetailScreenComponent />
    </SaleOrderDetailProvider>
  );
}
