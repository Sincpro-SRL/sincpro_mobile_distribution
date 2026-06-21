import { RouteActionButton } from "@sincpro/mobile-distribution/ui/components/molecules";
import { RouteCard } from "@sincpro/mobile-distribution/ui/components/organisms";
import { Form } from "@sincpro/mobile-ui/Form";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useEffect } from "react";
import { View } from "react-native";

import { RouteProvider, useRoute } from "./route.context";

interface RouteScreenProps {
  onBack?: () => void;
}

function RouteScreenComponent() {
  const {
    route,
    isLoading,
    loadActiveRoute,
    refreshFromBackend,
    startRoute,
    finishRoute,
    reset,
    handleBack,
  } = useRoute();

  useEffect(() => {
    loadActiveRoute();
    return () => reset();
  }, [loadActiveRoute, reset]);

  const emptyState = (
    <View className="items-center flex-1 justify-center px-6">
      <Typography.Text className="text-text-secondary mb-2 text-center" variant="subtitle">
        No hay una ruta activa
      </Typography.Text>
      <Typography.Text className="text-text-secondary mb-6 text-center" variant="body">
        No se encontró ninguna ruta asignada. Por favor, sincroniza o contacta con el
        administrador.
      </Typography.Text>
      <Form.Button
        className="min-w-[200px]"
        loading={isLoading}
        onPress={refreshFromBackend}
        size="medium"
        title="Sincronizar rutas"
        variant="primary"
      />
    </View>
  );

  return (
    <FormViewV2.Root
      description="Hoja de ruta para la distribución de productos"
      isLoading={isLoading}
      item={route}
      name="Hoja de ruta"
      onBack={handleBack}
      onRefresh={refreshFromBackend}
      withContainer={false}
    >
      <FormViewV2.Header
        logoSource={require("../../../../assets/DISTRIBUTION/logo.png")}
        variant={EVariantScreenHeader.LOGO_WITH_BACK_BUTTON}
      />

      <FormViewV2.Content>
        {route ? <RouteCard item={route} /> : !isLoading && emptyState}
      </FormViewV2.Content>

      <FormViewV2.Footer>
        {route && (
          <RouteActionButton
            onFinishRoute={finishRoute}
            onStartRoute={startRoute}
            status={route.status}
          />
        )}
      </FormViewV2.Footer>
    </FormViewV2.Root>
  );
}

export function RouteScreen(props: RouteScreenProps) {
  return (
    <RouteProvider {...props}>
      <RouteScreenComponent />
    </RouteProvider>
  );
}
