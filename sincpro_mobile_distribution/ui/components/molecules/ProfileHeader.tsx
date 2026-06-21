import { getUserInitials } from "@sincpro/mobile/tools/utils/Initials";
import { Display } from "@sincpro/mobile-ui";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ReactNode, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

interface ProfileHeaderProps {
  name: string;
  identification?: string;
  onActivateDebug: () => void;
}

function ProfileHeader({ name, identification, onActivateDebug }: ProfileHeaderProps) {
  const initials = getUserInitials(name || "User");
  return (
    <View className="flex-row items-center rounded-lg px-4 py-4">
      <DevModeActivator onActivate={onActivateDebug}>
        <Display.Avatar initials={initials} size={56} />
      </DevModeActivator>
      <View className="ml-4">
        <Typography.Text semibold variant="subtitle">
          {name}
        </Typography.Text>

        {identification && (
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            {`ID: ${identification}`}
          </Typography.Text>
        )}
      </View>
    </View>
  );
}

interface DevModeActivatorProps {
  children: ReactNode;
  onActivate: () => void;
  tapsRequired?: number;
  tapTimeoutMs?: number;
}

function DevModeActivator({
  children,
  onActivate,
  tapsRequired = 6,
  tapTimeoutMs = 1000,
}: DevModeActivatorProps) {
  const [tapCount, setTapCount] = useState(0);
  const lastTapTimeRef = useRef(0);

  function handleTap() {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap > tapTimeoutMs) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      if (newCount >= tapsRequired) {
        setTapCount(0);
        onActivate();
        Toast.hide();
        Toast.show({
          type: "success",
          text1: "Modo desarrollador activado",
        });
      } else {
        setTapCount(newCount);
        const remaining = tapsRequired - newCount;
        if (remaining <= 3) {
          Toast.hide();
          Toast.show({
            type: "info",
            text1: `Presiona ${remaining} ${remaining === 1 ? "vez" : "veces"} más`,
            text2: "para activar el modo desarrollador",
          });
        }
      }
    }

    lastTapTimeRef.current = now;
  }

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handleTap}>
      <View>{children}</View>
    </TouchableOpacity>
  );
}

export default ProfileHeader;
