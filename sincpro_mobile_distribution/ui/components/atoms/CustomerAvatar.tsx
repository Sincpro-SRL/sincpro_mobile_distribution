import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { Display } from "@sincpro/mobile-ui/Display";

type ColorScheme = "default" | "primary" | "secondary" | "success" | "warning";

const colorSchemes: ColorScheme[] = ["primary", "secondary", "success", "warning", "default"];

function getColorScheme(initial: string): ColorScheme {
  const index = initial.charCodeAt(0) % colorSchemes.length;
  return colorSchemes[index];
}

export function CustomerAvatar({
  customer,
  size = 40,
}: {
  customer: Customer;
  size?: number;
}) {
  const initials = customer.name?.charAt(0).toUpperCase() || "?";
  const colorScheme = getColorScheme(initials);

  return <Display.Avatar colorScheme={colorScheme} initials={initials} size={size} />;
}
