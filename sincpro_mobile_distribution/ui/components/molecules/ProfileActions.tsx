import { Display } from "@sincpro/mobile-ui";
import BoxIcon from "@sincpro/mobile-ui/icons/BoxIcon";
import HomeIconOutlined from "@sincpro/mobile-ui/icons/HomeIconOutlined";
import SettingsIcon from "@sincpro/mobile-ui/icons/SettingsIcon";
import ToggleOffIcon from "@sincpro/mobile-ui/icons/ToggleOffIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { Switch, View } from "react-native";

interface ProfileActionsProps {
  goToSettings: () => void;
  goToDatabase: () => void;
  goToAssignedEquipment: () => void;
  logout: () => Promise<void>;
  isDebug: boolean;
  setDebug: (val: boolean) => void;
}

function ProfileActions({
  goToSettings,
  goToDatabase,
  goToAssignedEquipment,
  logout,
  isDebug,
  setDebug,
}: ProfileActionsProps) {
  return (
    <View className="bg-bg-card rounded-xl overflow-hidden">
      <Display.MenuButton
        description={`Configuración de la aplicación`}
        icon={SettingsIcon}
        label={`Ajustes`}
        onPress={goToSettings}
      />
      <Display.MenuButton
        description={`Ver equipos asignados`}
        icon={HomeIconOutlined}
        label={`Equipos Asignados`}
        onPress={goToAssignedEquipment}
      />
      {isDebug && (
        <Display.MenuButton
          icon={SettingsIcon}
          label={`Modo Debug`}
          rightComponent={
            <Switch
              onValueChange={setDebug}
              thumbColor={isDebug ? theme.warning : theme.text.tertiary}
              trackColor={{
                false: theme.border.default,
                true: theme.warning + "33",
              }}
              value={isDebug}
            />
          }
        />
      )}
      {isDebug && (
        <Display.MenuButton
          description={`Explorar datos locales`}
          icon={BoxIcon}
          label={`Ver base de datos`}
          onPress={goToDatabase}
        />
      )}
      <Display.MenuButton
        icon={ToggleOffIcon}
        label={`Cerrar Sesión`}
        onPress={logout}
        showDivider={false}
        variant="danger"
      />
    </View>
  );
}

export default ProfileActions;
