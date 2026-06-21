import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface ProfileInfoProps {
  vehicleId: number;
  vehicleModel: string;
}

function ProfileInfo({ vehicleId, vehicleModel }: ProfileInfoProps) {
  return (
    <View className="px-4 pb-3">
      <View className="flex-row items-center gap-2 bg-bg-muted px-3 py-2 rounded-lg ml-[68px]">
        <Typography.Text className="text-text-tertiary" variant="bodySmall">
          {`Veh\u00edculo`}
        </Typography.Text>
        <Typography.Text semibold variant="bodySmall">
          {`${vehicleId} - ${vehicleModel}`}
        </Typography.Text>
      </View>
    </View>
  );
}

export default ProfileInfo;
