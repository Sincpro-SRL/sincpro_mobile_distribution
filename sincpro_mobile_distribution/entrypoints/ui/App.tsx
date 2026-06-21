import DistributionRoutes from "@sincpro/mobile-distribution/entrypoints/ui/AppRoutes";
import { OdooProvider } from "@sincpro/mobile-odoo/entrypoints/ui/context";
import { Feedback } from "@sincpro/mobile-ui/Feedback";
import { useEffect, useState } from "react";

import { DistributionGlobalProvider, useDistributionGlobal } from "./context";
import AndroidBackButtonHandler from "./interactions/AndroidBackButtonHandler";

function DistributionAppComponent() {
  const { loadServerParams, loadSession, loadSettings, requestGeoPermission } =
    useDistributionGlobal();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadServerParams();
      await loadSession();
      await loadSettings();
      await requestGeoPermission();
    };
    init();
  }, [loadServerParams, loadSession, loadSettings, requestGeoPermission]);

  return (
    <Feedback.DomainSplashScreen
      domainName="Distribution"
      isLoading={showSplash}
      onComplete={() => setShowSplash(false)}
    >
      <AndroidBackButtonHandler>
        <DistributionRoutes />
      </AndroidBackButtonHandler>
    </Feedback.DomainSplashScreen>
  );
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
