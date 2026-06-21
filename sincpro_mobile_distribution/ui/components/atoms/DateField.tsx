import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface DateFieldProps {
  label: string;
  date: string | null;
  showTime?: boolean;
}

export function DateField({ label, date, showTime = true }: DateFieldProps) {
  const { formatDate } = useDistributionGlobal();
  const formattedDate = date ? formatDate(date, { showTime }) : "--/--/--";

  return (
    <View className="flex-row items-center my-2">
      <View>
        <Typography.Text className="text-text-secondary" variant="body">
          {label}
        </Typography.Text>
        <Typography.Text semibold variant="bodyLarge">
          {formattedDate}
        </Typography.Text>
      </View>
    </View>
  );
}
