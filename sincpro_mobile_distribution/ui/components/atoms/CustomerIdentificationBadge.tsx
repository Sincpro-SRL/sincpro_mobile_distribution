import {
  IDENTIFICATION_TYPE_LABEL,
  type IdentificationType,
} from "@sincpro/mobile-distribution/domain/customer";
import { Display } from "@sincpro/mobile-ui/Display";

interface CustomerIdentificationBadgeProps {
  identificationType?: IdentificationType;
}

export function CustomerIdentificationBadge({
  identificationType,
}: CustomerIdentificationBadgeProps) {
  if (!identificationType) return null;

  const label = IDENTIFICATION_TYPE_LABEL[identificationType];

  return <Display.Badge label={label} variant="INFO" />;
}
