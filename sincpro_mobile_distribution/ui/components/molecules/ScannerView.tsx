import { Form } from "@sincpro/mobile-ui";
import { theme } from "@sincpro/mobile-ui/theme";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { CameraView } from "expo-camera";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScannerViewProps {
  handleClose: () => void;
  handleScan: ({ data }: { data: string }) => void;
  permission: { granted: boolean; canAskAgain: boolean } | null;
  requestPermission: () => void;
}

function ScannerView({
  handleClose,
  handleScan,
  permission,
  requestPermission,
}: ScannerViewProps) {
  const insets = useSafeAreaInsets();

  if (!permission) return <View className="flex-1" />;

  if (!permission.granted) {
    return (
      <View
        className="flex-1 justify-center items-center p-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="absolute left-4 z-20" style={{ top: insets.top + 8 }}>
          <Form.IconButton
            className="bg-bg-card border border-brand-primary"
            icon="close"
            onPress={handleClose}
            size="medium"
            type="antdesign"
            variant="secondary"
          />
        </View>
        <View className="items-center justify-center">
          <Typography.Text className="text-center mb-4" variant="bodyLarge">
            {`Necesitas permisos para acceder a la cámara.`}
          </Typography.Text>
          <Form.Button
            onPress={requestPermission}
            size="small"
            title={`Conceder permiso`}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-text-primary">
      <CameraView
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code128"],
        }}
        className="flex-1"
        onBarcodeScanned={handleScan}
      >
        <View className="absolute left-4 z-20" style={{ top: insets.top + 8 }}>
          <Form.IconButton
            className="bg-black/30 border border-text-inverse"
            icon="close"
            onPress={handleClose}
            size="medium"
            type="antdesign"
            variant="secondary"
          />
        </View>

        <View className="flex-1 flex-col" pointerEvents="none">
          <View className="flex-1 bg-black/55" />
          <View className="flex-row items-center">
            <View className="flex-1 bg-black/55" />
            <View className="w-[260px] h-[260px] border-2 border-text-inverse rounded-[18px] items-center justify-center" />
            <View className="flex-1 bg-black/55" />
          </View>
          <View className="flex-1 bg-black/55" />
        </View>

        <View
          className="absolute bottom-[60px] left-0 right-0 px-6 items-center"
          pointerEvents="none"
        >
          <Typography.Text
            className="text-center text-text-inverse bg-black/35 px-3 py-2 rounded-[12px]"
            variant="bodySmall"
          >
            {`Alinea el código dentro del recuadro para escanear automáticamente`}
          </Typography.Text>
        </View>
      </CameraView>
    </View>
  );
}

export default ScannerView;
