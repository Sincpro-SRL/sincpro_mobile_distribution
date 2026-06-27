import { useNavigation } from "@react-navigation/native";
import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { ScannerView } from "@sincpro/mobile-distribution/ui/components/molecules";
import { useCameraPermissions } from "expo-camera";
import { useState } from "react";

export function ScannerScreen() {
  const navigation = useNavigation();
  const { setScannerText } = useDistributionGlobal();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  function handleClose() {
    setScanned(false);
    navigation.goBack();
  }

  function handleScan({ data }: { data: string }) {
    if (!scanned) {
      setScanned(true);
      setTimeout(() => setScanned(false), 3000);
      setScannerText(data);
      navigation.goBack();
    }
  }

  return (
    <ScannerView
      handleClose={handleClose}
      handleScan={handleScan}
      permission={permission}
      requestPermission={requestPermission}
    />
  );
}
