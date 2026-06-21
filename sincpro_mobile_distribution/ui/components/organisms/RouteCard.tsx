import { DomainEvent } from "@sincpro/mobile/domain/event_sourcing";
import { useCommon } from "@sincpro/mobile/entrypoints/ui/common_provider";
import { EventTimelineItem } from "@sincpro/mobile/ui/components/molecules";
import { Route } from "@sincpro/mobile-distribution/domain/route";
import {
  DateField,
  RouteStatusBadge,
} from "@sincpro/mobile-distribution/ui/components/atoms";
import { Display } from "@sincpro/mobile-ui/Display";
import CalendarIcon from "@sincpro/mobile-ui/icons/CalendarIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";

export type RouteCardProps = {
  item: Route;
};

function EventsSection({ route }: { route: Route }) {
  const [expanded, setExpanded] = useState(false);
  const rawEvents = route.events;
  const eventsArray: DomainEvent[] = rawEvents
    ? Array.isArray(rawEvents)
      ? rawEvents
      : []
    : [];

  if (eventsArray.length === 0) return null;

  return (
    <View className="bg-bg-card rounded-lg p-4 mx-4 mt-5 shadow-sm">
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row justify-between items-center"
        onPress={() => setExpanded(!expanded)}
      >
        <View className="flex-row items-center gap-2">
          <Display.Icon color={theme.warning} name="activity" size={18} type="feather" />
          <Typography.Text semibold variant="bodyLarge">
            Historial de eventos
          </Typography.Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="bg-accent px-2.5 py-1 rounded-xl">
            <Typography.Text className="text-text-inverse" semibold variant="caption">
              {eventsArray.length}
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
          {eventsArray.map((event: DomainEvent, index: number) => (
            <EventTimelineItem
              event={event}
              isLast={index === eventsArray.length - 1}
              key={event.uuid}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function RouteCard({ item }: RouteCardProps) {
  const { debugMode } = useCommon();
  return (
    <View>
      <View className="bg-bg-card rounded-lg p-4 mx-4 mt-5 shadow-sm">
        <View className="flex-row justify-between items-center mb-2">
          <Typography.Text semibold variant="h4">
            Ruta {item.distributionCenter}
          </Typography.Text>
        </View>

        <RouteStatusBadge status={item.status} />

        <View className="my-3">
          <Typography.Text variant="body">Nombre de hoja de ruta</Typography.Text>
          <Typography.Text semibold variant="body">
            {item.name}
          </Typography.Text>
        </View>
      </View>
      <View className="bg-bg-card rounded-lg p-4 mx-4 mt-5 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Display.Icon customIcon={CalendarIcon} type="custom" />
          <Typography.Text className="ml-2 mt-0.5" semibold variant="bodyLarge">
            Bitácora de ruta
          </Typography.Text>
        </View>

        <DateField date={item.startDate} label="Fecha de inicio" />
        <DateField date={item.endDate} label="Fecha de finalización" />
      </View>
      {debugMode && <EventsSection route={item} />}
    </View>
  );
}
