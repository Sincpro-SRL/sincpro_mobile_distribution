import { StackActions, useNavigation } from "@react-navigation/native";
import { UIEventBus } from "@sincpro/mobile/infrastructure/ui/UIEventBus";
import { ERouteStatusType, Route } from "@sincpro/mobile-distribution/domain/route";
import {
  RemoteRouteChangedEvent,
  RoutePlanFetchedEvent,
} from "@sincpro/mobile-distribution/domain/route/events";
import { routeService } from "@sincpro/mobile-distribution/services/route.service";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";

interface IRouteContext {
  route: Route | null;
  isLoading: boolean;
  error: string | null;
  loadActiveRoute: () => Promise<void>;
  refreshFromBackend: () => Promise<void>;
  startRoute: () => Promise<void>;
  finishRoute: () => Promise<void>;
  reset: () => void;
  handleBack: () => void;
}

const RouteContext = createContext<IRouteContext | null>(null);

interface RouteProviderProps {
  children: React.ReactNode;
  onBack?: () => void;
}

export function RouteProvider({ children, onBack }: RouteProviderProps) {
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveRoute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await routeService.getActiveRoute();
      setRoute(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFromBackend = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await routeService.loadActiveRoutes();
      await loadActiveRoute();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [loadActiveRoute]);

  const startRoute = useCallback(async () => {
    if (!route) {
      Alert.alert("Error", "No hay una ruta disponible para iniciar.");
      return;
    }

    if (route.status !== ERouteStatusType.CONFIRMED) {
      Alert.alert("Error", "Solo puedes iniciar una ruta que esté en estado 'Confirmada'.");
      return;
    }

    Alert.alert("Iniciar Ruta", "¿Estás seguro que deseas iniciar esta ruta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Iniciar",
        onPress: async () => {
          try {
            await routeService.startRoute(route.uuid);
            await loadActiveRoute();
          } catch (e) {
            Alert.alert("Error", (e as Error).message);
          }
        },
      },
    ]);
  }, [route, loadActiveRoute]);

  const finishRoute = useCallback(async () => {
    if (!route) {
      Alert.alert("Error", "No hay una ruta disponible para finalizar.");
      return;
    }

    if (route.status !== ERouteStatusType.IN_PROGRESS) {
      Alert.alert(
        "Error",
        "No puedes finalizar una ruta que no esté en estado 'En Progreso'.",
      );
      return;
    }

    Alert.alert("Finalizar Ruta", "¿Estás seguro que deseas finalizar esta ruta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Finalizar",
        onPress: async () => {
          try {
            await routeService.finishRoute(route.uuid);
            await loadActiveRoute();
          } catch (e) {
            Alert.alert("Error", (e as Error).message);
          }
        },
      },
    ]);
  }, [route, loadActiveRoute]);

  const reset = useCallback(() => {
    setRoute(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const navigation = useNavigation();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigation.dispatch(StackActions.popToTop());
    }
  }, [onBack, navigation]);

  useEffect(() => {
    const reload = () => void loadActiveRoute();

    UIEventBus.on(RoutePlanFetchedEvent.name, reload);
    UIEventBus.on(RemoteRouteChangedEvent.name, reload);

    return () => {
      UIEventBus.off(RoutePlanFetchedEvent.name, reload);
      UIEventBus.off(RemoteRouteChangedEvent.name, reload);
    };
  }, [loadActiveRoute]);

  const value = useMemo<IRouteContext>(
    () => ({
      route,
      isLoading,
      error,
      loadActiveRoute,
      refreshFromBackend,
      startRoute,
      finishRoute,
      reset,
      handleBack,
    }),
    [
      route,
      isLoading,
      error,
      loadActiveRoute,
      refreshFromBackend,
      startRoute,
      finishRoute,
      reset,
      handleBack,
    ],
  );

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRoute must be used within RouteProvider");
  return ctx;
}
