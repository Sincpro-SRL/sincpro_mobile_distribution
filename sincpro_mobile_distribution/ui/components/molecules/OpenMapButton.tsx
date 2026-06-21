import { openMapWithRoute } from "@sincpro/mobile/tools/utils/maps";
import { Display } from "@sincpro/mobile-ui/Display";
import { Form } from "@sincpro/mobile-ui/Form";

interface OpenMapButtonProps {
  destination: { latitude: number; longitude: number };
  title?: string;
  className?: string;
  variant?: "outline" | "transparent";
}

export function OpenMapButton({
  destination,
  title = "Ver ruta",
  className,
  variant = "outline",
}: OpenMapButtonProps) {
  function handlePress() {
    openMapWithRoute(destination);
  }

  return (
    <Form.Button
      className={className}
      icon={<Display.Icon name="map-pin" size={16} type="feather" />}
      onPress={handlePress}
      size="small"
      title={title}
      variant={variant}
    />
  );
}
