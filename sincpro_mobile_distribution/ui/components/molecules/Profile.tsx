import type { OdooSession } from "@sincpro/mobile-odoo/domain/auth";
import { View } from "react-native";

import ProfileHeader from "./ProfileHeader";

interface ProfileProps {
  item: OdooSession;
  onActivateDebug: () => void;
}

function Profile({ item: session, onActivateDebug }: ProfileProps) {
  return (
    <View className="bg-bg-card rounded-xl overflow-hidden">
      <ProfileHeader
        identification={session?.vat || ""}
        name={session?.name || `Usuario`}
        onActivateDebug={onActivateDebug}
      />
    </View>
  );
}

export default Profile;
