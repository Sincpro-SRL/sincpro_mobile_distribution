import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { SaleOrder, SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";
import { SaleOrderRecordCard } from "@sincpro/mobile-distribution/ui/components/atoms";
import {
  CustomerSelectorButton,
  PaymentSummary,
  ProductSelectorButton,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import { SaleOrderLineList } from "@sincpro/mobile-distribution/ui/components/organisms";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { ReactNode } from "react";

export interface ISaleOrderAllowedOperations {
  canChangeCustomer: boolean;
  canAddLines: boolean;
  canRemoveLines: boolean;
  canEditLines: boolean;
}

interface SaleOrderFormEditableProps {
  title: string;
  description: string;
  order: SaleOrder;
  customer: Customer | null;
  isLoading: boolean;
  allowedOperations: ISaleOrderAllowedOperations;
  headerSecondLabel?: string;
  headerSecondValue?: string;
  onBack: () => void;
  onCustomerSelect?: () => void;
  onProductSelect?: () => void;
  onEditLine: (line: SaleOrderLine) => void;
  onDeleteLine?: (line: SaleOrderLine) => void;
  footer: ReactNode;
}

export function SaleOrderFormEditable({
  title,
  description,
  order,
  customer,
  isLoading,
  allowedOperations,
  headerSecondLabel = "Fecha de orden",
  headerSecondValue,
  onBack,
  onCustomerSelect,
  onProductSelect,
  onEditLine,
  onDeleteLine,
  footer,
}: SaleOrderFormEditableProps) {
  const paid = order.amountUntaxed + order.amountTax - order.amountResidual;
  const isCustomerReadonly = !allowedOperations.canChangeCustomer || !onCustomerSelect;
  const canAddProducts = allowedOperations.canAddLines && !!onProductSelect;
  const canDeleteLines = allowedOperations.canRemoveLines && !!onDeleteLine;
  const canEditLines = allowedOperations.canEditLines;

  return (
    <FormViewV2.Root
      description={description}
      isLoading={isLoading}
      item={order}
      name={title}
      onBack={onBack}
    >
      <FormViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER} />

      <FormViewV2.Content>
        <FormViewV2.Content.Group>
          <SaleOrderRecordCard
            orderName={order.name || title}
            scheduledDate={order.scheduledDate}
            secondLabel={headerSecondLabel}
            secondValue={headerSecondValue}
          />
        </FormViewV2.Content.Group>

        <FormViewV2.Content.Group>
          <CustomerSelectorButton
            customerId={customer?.remoteId ?? null}
            customerName={customer?.name ?? null}
            customerVat={customer?.vat ?? null}
            onChange={isCustomerReadonly ? undefined : onCustomerSelect}
            onSelect={isCustomerReadonly ? () => {} : onCustomerSelect!}
            readonly={isCustomerReadonly}
          />
        </FormViewV2.Content.Group>

        <FormViewV2.Content.Group>
          {canAddProducts && <ProductSelectorButton onPress={onProductSelect!} />}
          <SaleOrderLineList
            lines={order.orderLines}
            onDeleteLine={canDeleteLines ? onDeleteLine : undefined}
            onPressLine={canEditLines ? onEditLine : undefined}
            readonly={!canEditLines}
          />
        </FormViewV2.Content.Group>

        <FormViewV2.Content.Group>
          <PaymentSummary.Root>
            <PaymentSummary.Subtotal value={order.amountUntaxed || 0} />
            <PaymentSummary.Taxes value={order.amountTax || 0} />
            <PaymentSummary.Discount
              value={order.totalLineDiscounts + (order.discount || 0)}
            />
            <PaymentSummary.Exemptions value={0} />
            <PaymentSummary.Paid value={paid} />
            <PaymentSummary.Total value={order.amountResidual || 0} />
          </PaymentSummary.Root>
        </FormViewV2.Content.Group>
      </FormViewV2.Content>

      <FormViewV2.Footer>{footer}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}
