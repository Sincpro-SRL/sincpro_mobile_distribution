import { ERouteStatusType } from "@sincpro/mobile-distribution/domain/route";
import { BottomInsetContext, Form } from "@sincpro/mobile-ui";
import { useContext } from "react";
import { View } from "react-native";

type RouteActionButtonProps = {
  readonly status?: ERouteStatusType;
  readonly onStartRoute: () => void;
  readonly onFinishRoute: () => void;
};

export function RouteActionButton({
  status,
  onStartRoute,
  onFinishRoute,
}: RouteActionButtonProps) {
  const bottomInset = useContext(BottomInsetContext);

  if (!status || [ERouteStatusType.DONE, ERouteStatusType.DISTRIBUTED].includes(status)) {
    return null;
  }

  const isConfirmed = status === ERouteStatusType.CONFIRMED;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomInset + 16 }}>
      <Form.Button
        onPress={isConfirmed ? onStartRoute : onFinishRoute}
        title={isConfirmed ? "Iniciar hoja de ruta" : "Finalizar hoja de ruta"}
        variant="accent"
      />
    </View>
  );
}
