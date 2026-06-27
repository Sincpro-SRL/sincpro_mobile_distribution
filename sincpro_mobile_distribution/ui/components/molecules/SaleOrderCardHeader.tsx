import { formatTwoDecimals } from "@sincpro/mobile/tools/utils/monetary";
import { SaleOrder } from "@sincpro/mobile-distribution/domain/sale_order";
import {
  CustomerCreditBadge,
  CustomerExemptBadge,
} from "@sincpro/mobile-distribution/ui/components/atoms";
import { OpenMapButton } from "@sincpro/mobile-distribution/ui/components/molecules/OpenMapButton";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { createContext, ReactNode, useContext } from "react";
import { Text, View } from "react-native";

interface SaleOrderCardHeaderContextValue {
  saleOrder: SaleOrder;
}

const SaleOrderCardHeaderContext = createContext<SaleOrderCardHeaderContextValue | null>(
  null,
);

function useSaleOrderCardHeader() {
  const context = useContext(SaleOrderCardHeaderContext);
  if (!context) {
    throw new Error(
      "SaleOrderCardHeader compound components must be used within SaleOrderCardHeader",
    );
  }
  return context;
}

interface OrderBadgeInfo {
  label: string;
  variant: BadgeVariants;
}

interface PaymentBadgeInfo {
  label: string;
  variant: BadgeVariants;
}

function getOrderTypeBadge(saleOrder: SaleOrder): OrderBadgeInfo {
  if (saleOrder.isCancelled) {
    return { label: `Cancelada`, variant: BadgeVariants.WARNING };
  }
  if (saleOrder.isQuotation) {
    return { label: `Cotización`, variant: BadgeVariants.WARNING };
  }
  return { label: `Orden`, variant: BadgeVariants.INFO_DARK };
}

function getPaymentBadge(saleOrder: SaleOrder): PaymentBadgeInfo | null {
  if (saleOrder.isQuotation || saleOrder.isCancelled) {
    return null;
  }

  if (saleOrder.isPaid) {
    return { label: `Pagado`, variant: BadgeVariants.SUCCESS };
  }
  if (saleOrder.isPartiallyPaid) {
    return { label: `Pago parcial`, variant: BadgeVariants.INFO_DARK };
  }
  return { label: `Sin pagar`, variant: BadgeVariants.WARNING };
}

interface SaleOrderCardHeaderProps {
  saleOrder: SaleOrder;
  className?: string;
  children?: ReactNode;
}

function SaleOrderCardHeaderRoot({
  saleOrder,
  className,
  children,
}: SaleOrderCardHeaderProps) {
  const saleOrderName = saleOrder.metaOrder?.sourceRefName || saleOrder.name;
  const orderBadge = getOrderTypeBadge(saleOrder);
  const paymentBadge = getPaymentBadge(saleOrder);

  return (
    <SaleOrderCardHeaderContext.Provider value={{ saleOrder }}>
      <View className={cn("rounded-2xl p-4 gap-3", className)}>
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Typography.Text className="text-text-secondary" variant="caption">
              {`Nro orden`}
            </Typography.Text>
            <Typography.Text semibold variant="bodyLarge">
              {saleOrderName}
            </Typography.Text>
          </View>
          <View className="flex-col items-end gap-1">
            <Display.Badge label={orderBadge.label} variant={orderBadge.variant} />
            {paymentBadge && (
              <Display.Badge label={paymentBadge.label} variant={paymentBadge.variant} />
            )}
          </View>
        </View>

        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-3">
            <Typography.Text className="text-text-secondary" variant="caption">
              {`Cliente`}
            </Typography.Text>
            <Text className="text-text-primary font-semibold text-sm">
              {saleOrder.customerName}
            </Text>
            {saleOrder.customer && (
              <View className="flex-row flex-wrap gap-1.5 mt-1">
                {saleOrder.customer.availableCredit > 0 && (
                  <CustomerCreditBadge availableCredit={saleOrder.customer.availableCredit} />
                )}
                {saleOrder.customer.isExemptCustomer && (
                  <CustomerExemptBadge isExempt={saleOrder.customer.isExemptCustomer} />
                )}
              </View>
            )}
          </View>
          <View className="flex-shrink-0">{children}</View>
        </View>
      </View>
    </SaleOrderCardHeaderContext.Provider>
  );
}

function ScheduledDate({ value }: { value?: string }) {
  return (
    <View>
      <Typography.Text className="text-text-secondary" variant="bodySmall">
        {`Fecha programada`}
      </Typography.Text>
      <Typography.Text variant="bodySmall">{value || `N/A`}</Typography.Text>
    </View>
  );
}

function AddressButton() {
  const { saleOrder } = useSaleOrderCardHeader();
  const hasCoordinates =
    saleOrder.coordinates.latitude !== 0 && saleOrder.coordinates.longitude !== 0;

  if (!hasCoordinates) return null;

  return (
    <OpenMapButton
      className="w-[140px] h-10 rounded"
      destination={saleOrder.coordinates}
      title="Ver Dirección"
    />
  );
}

function ProductCount() {
  const { saleOrder } = useSaleOrderCardHeader();
  const count = saleOrder.orderLines.length;

  return (
    <View className="flex-row items-center">
      <View className="w-2 h-2 rounded-full mr-2 bg-primary" />
      <Typography.Text semibold variant="body">
        {`${count} ${count === 1 ? "producto" : "productos"}`}
      </Typography.Text>
    </View>
  );
}

function Amount() {
  const { saleOrder } = useSaleOrderCardHeader();

  return (
    <View className="flex-row items-center">
      <View className="w-2 h-2 rounded-full mr-2 bg-primary" />
      <Typography.Text semibold variant="body">
        {`${saleOrder.currencySymbol}${formatTwoDecimals(saleOrder.amountResidual)}`}
      </Typography.Text>
    </View>
  );
}

export const SaleOrderCardHeader = Object.assign(SaleOrderCardHeaderRoot, {
  ScheduledDate,
  AddressButton,
  ProductCount,
  Amount,
});
