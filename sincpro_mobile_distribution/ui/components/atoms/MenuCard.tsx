import { IconType } from "@sincpro/mobile/domain/icon";
import { Display } from "@sincpro/mobile-ui/Display";
import { ComponentType } from "react";

interface MenuCardProps {
  title: string;
  iconType?: IconType;
  onPress?: () => void;
  customIcon?: ComponentType<{ size?: number; color?: string }>;
}

export function MenuCard({ title, iconType, onPress, customIcon }: MenuCardProps) {
  return (
    <Display.MenuCard
      customIcon={customIcon}
      iconType={iconType}
      onPress={onPress}
      title={title}
    />
  );
}
