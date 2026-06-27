import { IconType } from "@sincpro/mobile/domain/icon";
import { Display } from "@sincpro/mobile-ui/Display";
import { ComponentType } from "react";

export interface MenuItem {
  id: string;
  title: string;
  iconType?: IconType;
  onPress?: () => void;
  customIcon?: ComponentType<{ size?: number; color?: string }>;
}

interface MenuGridProps {
  readonly items: MenuItem[];
}

export function MenuGrid({ items }: MenuGridProps) {
  return <Display.MenuGrid items={items} />;
}
