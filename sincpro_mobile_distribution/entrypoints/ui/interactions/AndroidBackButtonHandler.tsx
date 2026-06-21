import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { useEffect, useRef } from "react";
import { Alert, BackHandler, Platform, ToastAndroid } from "react-native";
import { useLocation, useNavigate } from "react-router-native";

interface Props {
  children: React.ReactNode;
}

export default function AndroidBackButtonHandler({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const backPressedOnce = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showExitMessage = () => {
    if (Platform.OS === "android") {
      ToastAndroid.show("Presiona atrás nuevamente para salir", ToastAndroid.SHORT);
    } else {
      Alert.alert("Salir de la app", "Presiona atrás nuevamente para salir");
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (location.pathname === AppScreen.LOGIN) {
        return true;
      }
      if (location.pathname !== AppScreen.MAIN) {
        navigate(-1);
        return true;
      }

      if (backPressedOnce.current) {
        BackHandler.exitApp();
        return true;
      }

      backPressedOnce.current = true;
      showExitMessage();

      timeoutRef.current = setTimeout(() => {
        backPressedOnce.current = false;
      }, 2000);

      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      backHandler.remove();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location, navigate]);

  return children;
}
