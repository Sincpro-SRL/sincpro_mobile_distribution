import { ECustomerRouteStatus } from "@sincpro/mobile-distribution/domain/customer";
import { Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";

interface CustomerStatusIconProps {
  routeStatus?: ECustomerRouteStatus;
  size?: number;
}

const STATUS_COLORS = {
  [ECustomerRouteStatus.PLANNED]: theme.warning,
  [ECustomerRouteStatus.FETCHED]: theme.success,
  [ECustomerRouteStatus.CREATED_IN_ROUTE]: theme.primary,
};

export function CustomerStatusIcon({ routeStatus, size = 20 }: CustomerStatusIconProps) {
  if (!routeStatus) return null;

  const getIconConfig = () => {
    switch (routeStatus) {
      case ECustomerRouteStatus.PLANNED:
        return { name: "clock", color: STATUS_COLORS[ECustomerRouteStatus.PLANNED] };
      case ECustomerRouteStatus.FETCHED:
        return { name: "check-circle", color: STATUS_COLORS[ECustomerRouteStatus.FETCHED] };
      case ECustomerRouteStatus.CREATED_IN_ROUTE:
        return {
          name: "plus-circle",
          color: STATUS_COLORS[ECustomerRouteStatus.CREATED_IN_ROUTE],
        };
      default:
        return null;
    }
  };

  const iconConfig = getIconConfig();
  if (!iconConfig) return null;

  return (
    <Display.Icon
      color={iconConfig.color}
      name={iconConfig.name}
      size={size}
      type="feather"
    />
  );
}
