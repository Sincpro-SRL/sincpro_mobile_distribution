import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";
import { useCommon } from "@sincpro/mobile/entrypoints/ui/common_provider";
import { EventTimelineItem } from "@sincpro/mobile/ui/components/molecules";
import {
  Customer,
  IDENTIFICATION_TYPE_LABEL,
} from "@sincpro/mobile-distribution/domain/customer";
import {
  CustomerAvatar,
  CustomerCreditBadge,
  CustomerExemptBadge,
  CustomerStatusIcon,
} from "@sincpro/mobile-distribution/ui/components/atoms";
import { Display } from "@sincpro/mobile-ui/Display";
import { Feedback } from "@sincpro/mobile-ui/Feedback";
import { Form } from "@sincpro/mobile-ui/Form";
import Container from "@sincpro/mobile-ui/layouts/Container";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import ScreenHeader, { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useLocation } from "react-router-native";

import { CustomerDetailProvider, useCustomerDetail } from "./customer.detail.context";

function InfoField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="mb-3">
      <Typography.Text className="text-text-tertiary" variant="bodySmall">
        {label}
      </Typography.Text>
      <Typography.Text variant="body">{value}</Typography.Text>
    </View>
  );
}

function CustomerHeader({ customer }: { customer: Customer }) {
  return (
    <View className="bg-bg-card rounded-xl p-4 mx-4 mt-4 shadow-sm">
      <View className="flex-row items-center gap-4">
        <CustomerAvatar customer={customer} size={64} />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Typography.Text semibold variant="h4">
              {customer.name}
            </Typography.Text>
            {customer.routeStatus && (
              <CustomerStatusIcon routeStatus={customer.routeStatus} />
            )}
          </View>
          <Typography.Text className="text-text-tertiary" variant="body">
            {customer.vat || "Sin cédula"}
          </Typography.Text>
          <View className="flex-row flex-wrap gap-2">
            {customer.availableCredit > 0 && (
              <CustomerCreditBadge availableCredit={customer.availableCredit} />
            )}
            {customer.isExemptCustomer && (
              <CustomerExemptBadge isExempt={customer.isExemptCustomer} />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function CustomerBasicInfo({ customer }: { customer: Customer }) {
  return (
    <View className="bg-bg-card rounded-xl p-4 mx-4 mt-4 shadow-sm">
      <Typography.Text className="mb-3" semibold variant="body">
        Información básica
      </Typography.Text>
      <InfoField
        label="Tipo de identificación"
        value={
          customer.identificationType
            ? IDENTIFICATION_TYPE_LABEL[customer.identificationType]
            : undefined
        }
      />
      <InfoField label="Identificación" value={customer.vat} />
      <InfoField label="Referencia" value={customer.ref} />
      <InfoField label="Lista de precios" value={customer.priceListName} />
      <InfoField label="Término de pago" value={customer.paymentTermDisplay} />
      {customer.maxDiscountApk > 0 && (
        <InfoField label="Descuento máximo" value={`${customer.maxDiscountApk}%`} />
      )}
    </View>
  );
}

function CustomerContactInfo({ customer }: { customer: Customer }) {
  const hasContactInfo = customer.email || customer.phone || customer.address;
  if (!hasContactInfo) return null;

  return (
    <View className="bg-bg-card rounded-xl p-4 mx-4 mt-4 shadow-sm">
      <Typography.Text className="mb-3" semibold variant="body">
        Información de contacto
      </Typography.Text>
      <InfoField label="Email" value={customer.email} />
      <InfoField label="Teléfono" value={customer.phone} />
      <InfoField label="Dirección" value={customer.address} />
      <InfoField label="Ciudad" value={customer.city} />
      <InfoField label="Estado/Provincia" value={customer.state} />
      <InfoField label="Código postal" value={customer.zipCode} />
    </View>
  );
}

function CustomerCreditInfo({ customer }: { customer: Customer }) {
  const hasCreditInfo = customer.creditLimit > 0 || customer.availableCredit > 0;
  if (!hasCreditInfo) return null;

  return (
    <View className="bg-bg-card rounded-xl p-4 mx-4 mt-4 shadow-sm">
      <Typography.Text className="mb-3" semibold variant="body">
        Información de crédito
      </Typography.Text>
      <InfoField label="Límite de crédito" value={`₡${customer.creditLimit.toFixed(2)}`} />
      <InfoField
        label="Crédito disponible"
        value={`₡${customer.availableCredit.toFixed(2)}`}
      />
      {customer.economicActivityCode && (
        <InfoField label="Actividad económica" value={customer.economicActivityCode} />
      )}
    </View>
  );
}

function EventsSection({ customer }: { customer: Customer }) {
  const [expanded, setExpanded] = useState(false);
  const events: DomainEvent[] = Array.isArray(customer.events) ? customer.events : [];

  if (events.length === 0) return null;

  return (
    <View className="bg-bg-card rounded-xl p-4 mx-4 mt-4 shadow-sm">
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
          <View className="bg-accent rounded-full px-2 py-0.5">
            <Typography.Text className="text-white" semibold variant="caption">
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

function CustomerDetailContent() {
  const { debugMode } = useCommon();
  const { customer, isLoading, error, handleBack, handleCreateOrder } = useCustomerDetail();

  if (isLoading) {
    return (
      <Container>
        <Feedback.Loading />
      </Container>
    );
  }

  if (error || !customer) {
    return (
      <Container>
        <Feedback.Error message={error || "Cliente no encontrado"} />
      </Container>
    );
  }

  return (
    <Container>
      <ScreenHeader
        onBack={handleBack}
        subtitle="Información del cliente"
        title={customer.name}
        variant={EVariantScreenHeader.FLAT_HEADER}
      />
      <ScrollView className="pb-8" showsVerticalScrollIndicator={false}>
        <CustomerHeader customer={customer} />
        <CustomerBasicInfo customer={customer} />
        <CustomerContactInfo customer={customer} />
        <CustomerCreditInfo customer={customer} />
        {debugMode && <EventsSection customer={customer} />}

        <View className="p-4 mt-2">
          <Form.Button onPress={handleCreateOrder} title="Crear orden" variant="primary" />
        </View>
      </ScrollView>
    </Container>
  );
}

export function CustomerDetailScreen() {
  const location = useLocation();
  const customerUuid = location.state?.customer?.uuid as string | undefined;

  if (!customerUuid) {
    return (
      <Container>
        <Feedback.Error message="UUID del cliente no proporcionado" />
      </Container>
    );
  }

  return (
    <CustomerDetailProvider customerUuid={customerUuid}>
      <CustomerDetailContent />
    </CustomerDetailProvider>
  );
}
