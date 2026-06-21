import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import {
  CreditNoteRow,
  CustomerInfoCard,
  SaleOrderSelectableRow,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useLocation } from "react-router-native";

import {
  CustomerOrdersDetailProvider,
  useCustomerOrdersDetail,
} from "./customer_orders.detail.context";

function CustomerOrdersDetailContent() {
  const {
    customer,
    saleOrders,
    creditNotes,
    selectedOrder,
    isLoading,
    loadCustomerData,
    refreshFromBackend,
    fetchMoreCreditNotes,
    fetchMoreSaleOrders,
    reset,
    handleSelectOrder,
    handleSelectCreditNote,
    handleCreateCreditNote,
    handleBack,
  } = useCustomerOrdersDetail();

  useEffect(() => {
    loadCustomerData();
    return () => reset();
  }, [loadCustomerData, reset]);

  const customerInfoSection = useMemo(() => {
    return <CustomerInfoCard customer={customer} />;
  }, [customer]);

  const ordersSection = useMemo(() => {
    if (saleOrders.length === 0) {
      return (
        <View className="p-4">
          <Typography.Text className="text-text-tertiary" variant="body">
            No se encontraron órdenes facturadas para este cliente
          </Typography.Text>
          <Typography.Text className="text-text-tertiary mt-2" variant="caption">
            Solo se pueden crear notas de crédito para órdenes que ya tienen facturas
            asociadas
          </Typography.Text>
        </View>
      );
    }

    return (
      <View className="pb-4">
        <Typography.Text className="px-4 pt-4 pb-2" semibold variant="subtitle">
          Órdenes facturadas ({saleOrders.length})
        </Typography.Text>
        <Typography.Text className="text-text-tertiary px-4 pb-4" variant="caption">
          Seleccione una orden para crear una nota de crédito
        </Typography.Text>
        {saleOrders.map((order) => (
          <SaleOrderSelectableRow
            isSelected={selectedOrder?.uuid === order.uuid}
            key={order.uuid}
            onSelect={handleSelectOrder}
            saleOrder={order}
          />
        ))}
      </View>
    );
  }, [saleOrders, selectedOrder?.uuid]);

  const creditNotesSection = useMemo(() => {
    if (creditNotes.length === 0) {
      return (
        <View className="p-4">
          <Typography.Text className="px-4 pt-4 pb-2" semibold variant="subtitle">
            Notas de crédito (0)
          </Typography.Text>
          <Typography.Text className="text-text-tertiary" variant="body">
            No se han generado notas de crédito para este cliente
          </Typography.Text>
        </View>
      );
    }

    return (
      <View className="pb-4">
        <Typography.Text className="px-4 pt-4 pb-2" semibold variant="subtitle">
          Notas de crédito ({creditNotes.length})
        </Typography.Text>
        <Typography.Text className="text-text-tertiary px-4 pb-4" variant="caption">
          Toque una nota de crédito para ver sus detalles
        </Typography.Text>
        {creditNotes.map((creditNote) => (
          <CreditNoteRow
            creditNote={creditNote}
            customer={customer}
            key={creditNote.uuid}
            onPress={() => handleSelectCreditNote(creditNote)}
          />
        ))}
      </View>
    );
  }, [creditNotes, customer, handleSelectCreditNote]);

  const footerActions = useMemo(() => {
    return (
      <View className="p-4">
        <Form.Button
          disabled={!selectedOrder}
          onPress={handleCreateCreditNote}
          title={
            selectedOrder
              ? `Crear nota de crédito para ${selectedOrder.name}`
              : "Seleccione una orden"
          }
          variant="accent"
        />
      </View>
    );
  }, [selectedOrder, handleCreateCreditNote]);

  return (
    <FormViewV2.Root
      description={customer?.name || "Cliente"}
      isEmpty={!customer}
      isLoading={isLoading}
      item={customer}
      name="Lista de órdenes de venta"
      onBack={handleBack}
      onRefresh={refreshFromBackend}
    >
      <FormViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER}>
        <FormViewV2.Header.ActionsBar>
          <Form.Button
            className="flex-1"
            icon={<Display.Icon color="#f97316" name="download" size={14} type="antdesign" />}
            onPress={() => fetchMoreSaleOrders(20)}
            size="small"
            title="Órdenes"
            variant="outline"
          />
          <Form.Button
            className="flex-1"
            icon={<Display.Icon color="#f97316" name="download" size={14} type="antdesign" />}
            onPress={() => fetchMoreCreditNotes(20)}
            size="small"
            title="N. Crédito"
            variant="outline"
          />
        </FormViewV2.Header.ActionsBar>
      </FormViewV2.Header>

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>{customerInfoSection}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{ordersSection}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{creditNotesSection}</FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>{footerActions}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}

interface CustomerOrdersDetailScreenProps {
  customer?: Customer;
}

export function CustomerOrdersDetailScreen({ customer }: CustomerOrdersDetailScreenProps) {
  const location = useLocation();
  const customerFromState = location.state?.customer as Customer | undefined;
  const resolvedCustomer = customer ?? customerFromState;

  if (!resolvedCustomer) {
    return null;
  }

  return (
    <CustomerOrdersDetailProvider customer={resolvedCustomer}>
      <CustomerOrdersDetailContent />
    </CustomerOrdersDetailProvider>
  );
}
