import { ERouteStatusType } from "@sincpro/mobile-distribution/domain/route";
import { Form } from "@sincpro/mobile-ui";
import React from "react";
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
  if (!status || [ERouteStatusType.DONE, ERouteStatusType.DISTRIBUTED].includes(status)) {
    return null;
  }

  const isConfirmed = status === ERouteStatusType.CONFIRMED;

  return (
    <View className="p-4 mt-auto">
      <Form.Button
        onPress={isConfirmed ? onStartRoute : onFinishRoute}
        title={isConfirmed ? "Iniciar hoja de ruta" : "Finalizar hoja de ruta"}
        variant="accent"
      />
    </View>
  );
}
