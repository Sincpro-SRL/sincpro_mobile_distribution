import { Display } from "@sincpro/mobile-ui";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ComponentType, ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";

interface ProfileMenuItemProps {
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  rightComponent?: ReactNode;
}

function ProfileMenuItem({
  icon,
  label,
  onPress,
  isLast = false,
  rightComponent,
}: ProfileMenuItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={cn(
        "flex-row items-center py-4 px-4 border-b border-border-default",
        isLast && "border-b-0",
      )}
      disabled={!onPress}
      onPress={onPress}
    >
      <View className="mr-4">
        <Display.Icon customIcon={icon} type="custom" />
      </View>
      <Typography.Text className="flex-1" variant="bodyLarge">
        {label}
      </Typography.Text>
      {rightComponent && <View className="ml-4">{rightComponent}</View>}
    </TouchableOpacity>
  );
}

export default ProfileMenuItem;
