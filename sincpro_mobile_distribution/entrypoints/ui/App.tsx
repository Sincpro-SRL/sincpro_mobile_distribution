import DistributionRoutes from "@sincpro/mobile-distribution/entrypoints/ui/AppRoutes";
import { OdooProvider } from "@sincpro/mobile-odoo/entrypoints/ui/context";
import { useEffect } from "react";

import { DistributionGlobalProvider, useDistributionGlobal } from "./context";

function DistributionAppComponent() {
  const { loadServerParams, loadSession, loadSettings, requestGeoPermission } =
    useDistributionGlobal();

  useEffect(() => {
    const init = async () => {
      await loadServerParams();
      await loadSession();
      await loadSettings();
      await requestGeoPermission();
    };
    init();
  }, [loadServerParams, loadSession, loadSettings, requestGeoPermission]);

  return <DistributionRoutes />;
}

export function DistributionApp() {
  return (
    <OdooProvider>
      <DistributionGlobalProvider>
        <DistributionAppComponent />
      </DistributionGlobalProvider>
    </OdooProvider>
  );
}
