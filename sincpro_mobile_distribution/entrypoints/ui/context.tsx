import { NewAppSettingsEvent } from "@sincpro/mobile/domain/events";
import { useCommon } from "@sincpro/mobile/entrypoints/ui/common_provider";
import { orchestrator } from "@sincpro/mobile/framework/orchestrator";
import logger from "@sincpro/mobile/infrastructure/logger";
import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import {
  formatDate,
  getCurrentDateInTimezone,
  getCurrentDateTimeInTimezone,
} from "@sincpro/mobile/tools/utils/date";
import type { IPaymentMethod } from "@sincpro/mobile-distribution/domain/payment";
import {
  EDistributionSetting,
  IInvoiceJournal,
  SettingsFetchedEvent,
  TimezoneLocale,
} from "@sincpro/mobile-distribution/domain/settings";
import { distributionSettingFeature } from "@sincpro/mobile-distribution/services/settings.feature";
import { OdooSession } from "@sincpro/mobile-odoo/domain/auth";
import { OdooLoggedInEvent } from "@sincpro/mobile-odoo/domain/auth/events";
import { IServer } from "@sincpro/mobile-odoo/domain/server";
import { useOdoo } from "@sincpro/mobile-odoo/entrypoints/ui/context";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppStateStatus } from "react-native";

interface IDistributionGlobalContext {
  reset: () => void;
  session: OdooSession | null;
  authIsLoading: boolean;
  authError: string | null;
  login: (user: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  hasGeoPermission: boolean;
  geoIsLoading: boolean;
  geoError: string | null;
  checkGeoPermission: () => Promise<void>;
  requestGeoPermission: () => Promise<boolean>;
  paymentMethods: IPaymentMethod[];
  activeRoute: number | null;
  startDateRoute: string | null;
  endDateRoute: string | null;
  invoiceJournal: IInvoiceJournal | null;
  timezone: string | null;
  locale: string | null;
  settingsIsLoading: boolean;
  settingsError: string | null;
  loadSettings: () => Promise<void>;
  updateTimezone: (tz: TimezoneLocale) => Promise<void>;
  formatDate: (input: string | Date, options?: { showTime?: boolean }) => string;
  getCurrentDate: () => string;
  getCurrentDateTime: () => string;
  scannerText: string | null;
  setScannerText: (text: string) => void;
  clearScannerText: () => void;
  serverParams: IServer | null;
  serverIsLoading: boolean;
  loadServerParams: () => Promise<void>;
  setServerParams: (server: IServer) => Promise<void>;
  deleteServerParams: () => Promise<void>;
}

const DistributionGlobalContext = createContext<IDistributionGlobalContext | null>(null);

export function DistributionGlobalProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const odooContext = useOdoo();
  const commonContext = useCommon();

  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [activeRoute, setActiveRoute] = useState<number | null>(null);
  const [startDateRoute, setStartDateRoute] = useState<string | null>(null);
  const [endDateRoute, setEndDateRoute] = useState<string | null>(null);
  const [invoiceJournal, setInvoiceJournal] = useState<IInvoiceJournal | null>(null);
  const [locale, setLocale] = useState<string | null>(null);
  const [settingsIsLoading, setSettingsIsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [scannerText, setScannerTextState] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setSettingsIsLoading(true);
    setSettingsError(null);
    try {
      const [
        paymentMethodsResult,
        invoiceJournalResult,
        activeRouteResult,
        startDateRouteResult,
        endDateRouteResult,
        localeResult,
      ] = await Promise.all([
        distributionSettingFeature.getSetting(EDistributionSetting.PAYMENT_METHODS),
        distributionSettingFeature.getSetting(EDistributionSetting.INVOICE_JOURNAL),
        distributionSettingFeature.getSetting(EDistributionSetting.ACTIVE_ROUTE),
        distributionSettingFeature.getSetting(EDistributionSetting.START_DATE_ROUTE),
        distributionSettingFeature.getSetting(EDistributionSetting.END_DATE_ROUTE),
        distributionSettingFeature.getSetting(EDistributionSetting.LOCALE),
      ]);

      setPaymentMethods(paymentMethodsResult ?? []);
      setInvoiceJournal(invoiceJournalResult);
      setActiveRoute(activeRouteResult);
      setStartDateRoute(startDateRouteResult);
      setEndDateRoute(endDateRouteResult);
      setLocale(localeResult);
    } catch (error) {
      logger.warn(error);
      setSettingsError((error as Error).message);
    } finally {
      setSettingsIsLoading(false);
    }
  }, []);

  const updateTimezone = useCallback(
    async (tz: TimezoneLocale) => {
      setSettingsIsLoading(true);
      setSettingsError(null);
      try {
        await commonContext.updateTimezone(tz);
        await distributionSettingFeature.setSetting(EDistributionSetting.LOCALE, tz.locale);
        setLocale(tz.locale);
      } catch (error) {
        logger.warn(error);
        setSettingsError((error as Error).message);
      } finally {
        setSettingsIsLoading(false);
      }
    },
    [commonContext],
  );

  const formatDateWithTimezone = useCallback(
    (input: string | Date, options?: { showTime?: boolean }): string => {
      return formatDate(input, commonContext.timezone, {
        locale,
        showTime: options?.showTime,
      });
    },
    [commonContext.timezone, locale],
  );

  const getCurrentDateWithTimezone = useCallback((): string => {
    return getCurrentDateInTimezone(commonContext.timezone);
  }, [commonContext.timezone]);

  const getCurrentDateTimeWithTimezone = useCallback((): string => {
    return getCurrentDateTimeInTimezone(commonContext.timezone);
  }, [commonContext.timezone]);

  const setScannerText = useCallback((text: string) => {
    setScannerTextState(text);
  }, []);

  const clearScannerText = useCallback(() => {
    setScannerTextState(null);
  }, []);

  useEffect(() => {
    const handleOdooLoggedIn = async (event: OdooLoggedInEvent) => {
      await odooContext.loadSession();
    };

    UIEventBus.on(OdooLoggedInEvent.name, handleOdooLoggedIn);
    return () => UIEventBus.off(OdooLoggedInEvent.name, handleOdooLoggedIn);
  }, [odooContext.loadSession]);

  useEffect(() => {
    const unsubscribe = orchestrator.subscribeToAppState((state: AppStateStatus) => {
      if (state === "active") {
        commonContext.checkGeoPermission();
      }
    });
    return unsubscribe;
  }, [commonContext]);

  useEffect(() => {
    const handleReloadSettings = () => {
      loadSettings();
    };

    UIEventBus.on(SettingsFetchedEvent.name, handleReloadSettings);
    UIEventBus.on(OdooLoggedInEvent.name, handleReloadSettings);
    UIEventBus.on(NewAppSettingsEvent.name, handleReloadSettings);

    return () => {
      UIEventBus.off(SettingsFetchedEvent.name, handleReloadSettings);
      UIEventBus.off(OdooLoggedInEvent.name, handleReloadSettings);
      UIEventBus.off(NewAppSettingsEvent.name, handleReloadSettings);
    };
  }, [loadSettings]);

  const reset = useCallback(() => {
    odooContext.reset();
    setPaymentMethods([]);
    setActiveRoute(null);
    setStartDateRoute(null);
    setEndDateRoute(null);
    setInvoiceJournal(null);
    setLocale(null);
    setSettingsIsLoading(false);
    setSettingsError(null);
    setScannerTextState(null);
  }, [odooContext]);

  const value = useMemo<IDistributionGlobalContext>(
    () => ({
      reset,
      session: odooContext.session,
      login: odooContext.login,
      logout: odooContext.logout,
      authIsLoading: odooContext.authIsLoading,
      authError: odooContext.authError,
      loadSession: odooContext.loadSession,
      hasGeoPermission: commonContext.hasGeoPermission,
      geoIsLoading: commonContext.geoIsLoading,
      geoError: commonContext.geoError,
      checkGeoPermission: commonContext.checkGeoPermission,
      requestGeoPermission: commonContext.requestGeoPermission,
      paymentMethods,
      activeRoute,
      startDateRoute,
      endDateRoute,
      invoiceJournal,
      timezone: commonContext.timezone,
      locale,
      settingsIsLoading,
      settingsError,
      loadSettings,
      updateTimezone,
      formatDate: formatDateWithTimezone,
      getCurrentDate: getCurrentDateWithTimezone,
      getCurrentDateTime: getCurrentDateTimeWithTimezone,
      scannerText,
      setScannerText,
      clearScannerText,
      serverParams: odooContext.serverParams,
      serverIsLoading: odooContext.serverIsLoading,
      loadServerParams: odooContext.loadServerParams,
      setServerParams: odooContext.setServerParams,
      deleteServerParams: odooContext.deleteServerParams,
    }),
    [
      reset,
      odooContext.session,
      odooContext.login,
      odooContext.logout,
      odooContext.authIsLoading,
      odooContext.authError,
      odooContext.loadSession,
      odooContext.serverParams,
      odooContext.serverIsLoading,
      odooContext.loadServerParams,
      odooContext.setServerParams,
      odooContext.deleteServerParams,
      commonContext.hasGeoPermission,
      commonContext.geoIsLoading,
      commonContext.geoError,
      commonContext.checkGeoPermission,
      commonContext.requestGeoPermission,
      commonContext.timezone,
      commonContext.timezone,
      paymentMethods,
      activeRoute,
      startDateRoute,
      endDateRoute,
      invoiceJournal,
      locale,
      settingsIsLoading,
      settingsError,
      loadSettings,
      updateTimezone,
      formatDateWithTimezone,
      getCurrentDateWithTimezone,
      getCurrentDateTimeWithTimezone,
      scannerText,
      setScannerText,
      clearScannerText,
    ],
  );

  return (
    <DistributionGlobalContext.Provider value={value}>
      {children}
    </DistributionGlobalContext.Provider>
  );
}

export function useDistributionGlobal() {
  const ctx = useContext(DistributionGlobalContext);
  if (!ctx)
    throw new Error("useDistributionGlobal must be used within DistributionGlobalProvider");
  return ctx;
}
