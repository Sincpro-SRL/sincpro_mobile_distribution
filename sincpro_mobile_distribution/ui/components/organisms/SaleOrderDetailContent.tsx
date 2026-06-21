import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";
import { useCommon } from "@sincpro/mobile/entrypoints/ui/common_provider";
import { EventTimelineItem } from "@sincpro/mobile/ui/components/molecules";
import {
  SaleOrder,
  SaleOrderInvoice,
  SaleOrderLine,
} from "@sincpro/mobile-distribution/domain/sale_order";
import {
  OpenMapButton,
  PaymentSummary,
  SaleOrderCardHeader,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import { Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";

import TimelineSaleOrder from "./TimelineSaleOrder";

interface SaleOrderDetailContentProps {
  saleOrder: SaleOrder;
  onViewInvoice?: (invoice: SaleOrderInvoice) => void;
  onViewReceipt?: (invoice: SaleOrderInvoice) => void;
}

function SaleOrderLines({ saleOrder }: { saleOrder: SaleOrder }) {
  return (
    <View className="p-4">
      <Display.CountRecords
        count={saleOrder.orderLines.length}
        name="productos"
        withPadding={false}
      />
      {saleOrder.orderLines.map((line) => (
        <SaleOrderLineItem
          currencySymbol={saleOrder.currencySymbol}
          key={line.uuid}
          line={line}
        />
      ))}
    </View>
  );
}

function SaleOrderLineItem({
  line,
  currencySymbol,
}: {
  line: SaleOrderLine;
  currencySymbol: string;
}) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-border-default">
      <View className="flex-1 mr-4">
        <Typography.Text semibold variant="body">
          {line.name}
        </Typography.Text>
        <Typography.Text className="text-text-tertiary" variant="bodySmall">
          {line.quantity} {" x "}
          <Display.Monetary
            currencySymbol={currencySymbol}
            semibold={false}
            textVariant="bodySmall"
            value={line.priceUnit}
          />
        </Typography.Text>
      </View>
      <Display.Monetary
        currencySymbol={currencySymbol}
        textVariant="body"
        value={line.priceSubtotal}
      />
    </View>
  );
}

function ClientInfo({ saleOrder }: { saleOrder: SaleOrder }) {
  return (
    <View className="p-4">
      <Typography.Text className="mb-3" semibold variant="body">
        Información de cliente
      </Typography.Text>
      <Typography.Text semibold variant="bodySmall">
        {saleOrder.customerName}
      </Typography.Text>
      <Typography.Text className="text-text-tertiary mt-1" variant="bodySmall">
        Cliente #{saleOrder.customerId}
      </Typography.Text>
      {saleOrder.phone && (
        <Typography.Text className="text-text-tertiary mt-1" variant="bodySmall">
          {saleOrder.phone}
        </Typography.Text>
      )}
    </View>
  );
}

function AddressInfo({ saleOrder }: { saleOrder: SaleOrder }) {
  if (!saleOrder.address) return null;

  return (
    <View className="p-4">
      <Typography.Text className="mb-3" semibold variant="body">
        Dirección de entrega
      </Typography.Text>
      <Typography.Text className="text-text-tertiary" variant="bodySmall">
        {saleOrder.address}
      </Typography.Text>
      {saleOrder.coordinates.latitude !== 0 && (
        <View className="justify-end">
          <OpenMapButton
            className="mt-3 self-end border-orange-500"
            destination={saleOrder.coordinates}
            title="Ver dirección en Maps"
          />
        </View>
      )}
    </View>
  );
}

function SaleOrderPaymentSummary({ saleOrder }: { saleOrder: SaleOrder }) {
  const totalInvoiced = saleOrder.displayTotalInvoicedAmount;
  const totalPaid = saleOrder.displayTotalPaidAmount;
  const totalPending = saleOrder.displayTotalPendingAmount;
  const hasInvoices = saleOrder.hasDisplayInvoices;

  return (
    <View className="p-4">
      <Typography.Text className="mb-3" semibold variant="body">
        Resumen de pago
      </Typography.Text>
      <PaymentSummary.Root currencySymbol={saleOrder.currencySymbol}>
        <PaymentSummary.Subtotal value={saleOrder.amountUntaxed || 0} />
        <PaymentSummary.Taxes value={saleOrder.amountTax || 0} />
        <PaymentSummary.Discount value={saleOrder.discount || 0} />
        <PaymentSummary.Total label="Total del pedido" value={saleOrder.amountTotal} />
        {hasInvoices && (
          <>
            <View className="h-px bg-border-default my-2" />
            <PaymentSummary.Line label="Total facturado" value={totalInvoiced} />
            <PaymentSummary.Line color="#22c55e" label="Total pagado" value={totalPaid} />
            {totalPending > 0 && (
              <PaymentSummary.Line color="#f97316" label="Pendiente" value={totalPending} />
            )}
          </>
        )}
      </PaymentSummary.Root>
    </View>
  );
}

function EventsSection({ saleOrder }: { saleOrder: SaleOrder }) {
  const [expanded, setExpanded] = useState(false);
  const events: DomainEvent[] = Array.isArray(saleOrder.events) ? saleOrder.events : [];

  if (events.length === 0) return null;

  return (
    <View className="p-4">
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row justify-between items-center"
        onPress={() => setExpanded(!expanded)}
      >
        <View className="flex-row items-center gap-2">
          <Display.Icon color={theme.warning} name="activity" size={18} type="feather" />
          <Typography.Text semibold variant="body">
            Historial de eventos
          </Typography.Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="bg-accent px-2.5 py-1 rounded-xl">
            <Typography.Text className="text-text-inverse" semibold variant="caption">
              {events.length}
            </Typography.Text>
          </View>
          <Display.Icon
            color={theme.text.secondary}
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            type="feather"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="mt-4">
          {events.map((event: DomainEvent, index: number) => (
            <EventTimelineItem
              event={event}
              isLast={index === events.length - 1}
              key={event.uuid}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function SaleOrderDetailContent({
  saleOrder,
  onViewInvoice,
  onViewReceipt,
}: SaleOrderDetailContentProps) {
  const { debugMode } = useCommon();

  return (
    <>
      <FormViewV2.Content.Group>
        <SaleOrderCardHeader saleOrder={saleOrder}>
          <SaleOrderCardHeader.AddressButton />
        </SaleOrderCardHeader>
      </FormViewV2.Content.Group>
      <FormViewV2.Content.Group>
        <SaleOrderLines saleOrder={saleOrder} />
      </FormViewV2.Content.Group>
      <FormViewV2.Content.Group>
        <ClientInfo saleOrder={saleOrder} />
      </FormViewV2.Content.Group>
      <FormViewV2.Content.Group>
        <AddressInfo saleOrder={saleOrder} />
      </FormViewV2.Content.Group>
      <FormViewV2.Content.Group>
        <TimelineSaleOrder
          onViewInvoice={onViewInvoice}
          onViewReceipt={onViewReceipt}
          saleOrder={saleOrder}
        />
      </FormViewV2.Content.Group>
      <FormViewV2.Content.Group>
        <SaleOrderPaymentSummary saleOrder={saleOrder} />
      </FormViewV2.Content.Group>
      {debugMode && (
        <FormViewV2.Content.Group>
          <EventsSection saleOrder={saleOrder} />
        </FormViewV2.Content.Group>
      )}
    </>
  );
}
