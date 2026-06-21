import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";
import { tv } from "tailwind-variants";

interface CashierStatusBadgeProps {
  openedAt?: string;
  closedAt?: string;
  formatDate: (date: string, options?: { showTime?: boolean }) => string;
}

const dotVariants = tv({
  base: "w-2 h-2 rounded-full",
  variants: {
    closed: {
      true: "bg-text-secondary",
      false: "bg-success",
    },
  },
});

const textVariants = tv({
  variants: {
    closed: {
      true: "text-text-secondary",
      false: "text-success",
    },
  },
});

function CashierStatusBadge({ openedAt, closedAt, formatDate }: CashierStatusBadgeProps) {
  if (!openedAt && !closedAt) {
    return null;
  }

  function getMessage(): string {
    if (closedAt) {
      return `Cerrado el ${formatDate(closedAt, { showTime: true })}`;
    }
    if (openedAt) {
      return `Abierto el ${formatDate(openedAt, { showTime: true })}`;
    }
    return "";
  }

  const isClosed = Boolean(closedAt);

  return (
    <View className="flex-1 flex-row justify-center items-center p-2 gap-2">
      <View className={dotVariants({ closed: isClosed })} />
      <Typography.Text className={textVariants({ closed: isClosed })} variant="bodySmall">
        {getMessage()}
      </Typography.Text>
    </View>
  );
}

export default CashierStatusBadge;
