import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { ScannerView } from "@sincpro/mobile-distribution/ui/components/molecules";
import { useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { useNavigate } from "react-router-native";

export function ScannerScreen() {
  const navigate = useNavigate();
  const { setScannerText } = useDistributionGlobal();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  function handleClose() {
    setScanned(false);
    navigate(-1);
  }

  function handleScan({ data }: { data: string }) {
    if (!scanned) {
      setScanned(true);
      setTimeout(() => setScanned(false), 3000);
      setScannerText(data);
      navigate(-1);
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
