import {
  ERouteStatusType,
  MAP_ROUTE_STATUS,
} from "@sincpro/mobile-distribution/domain/route";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";

const Badge = Display.Badge;

const MAP_VARIANTS: Record<ERouteStatusType, BadgeVariants> = {
  [ERouteStatusType.CONFIRMED]: BadgeVariants.INFO,
  [ERouteStatusType.IN_PROGRESS]: BadgeVariants.WARNING,
  [ERouteStatusType.DISTRIBUTED]: BadgeVariants.SUCCESS,
  [ERouteStatusType.DONE]: BadgeVariants.SUCCESS,
};

interface RouteStatusBadgeProps {
  readonly status: ERouteStatusType;
}

export function RouteStatusBadge({ status }: RouteStatusBadgeProps) {
  const label = MAP_ROUTE_STATUS[status] || "Estado desconocido";
  const variant = MAP_VARIANTS[status] || BadgeVariants.INFO_DARK;

  return <Badge label={label} variant={variant} />;
}
