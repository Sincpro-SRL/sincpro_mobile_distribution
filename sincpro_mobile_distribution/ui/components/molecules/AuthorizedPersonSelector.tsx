import type { IAuthorizedPerson } from "@sincpro/mobile-distribution/domain/customer/credit";
import { Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { useState } from "react";
import {
  FlatList,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface AuthorizedPersonSelectorProps {
  authorizedPersons: IAuthorizedPerson[];
  selectedPerson?: IAuthorizedPerson;
  onSelectPerson: (person?: IAuthorizedPerson) => void;
}

function AuthorizedPersonSelector({
  authorizedPersons,
  selectedPerson,
  onSelectPerson,
}: AuthorizedPersonSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  function handleOpenModal() {
    setModalVisible(true);
  }

  function handleCloseModal() {
    setModalVisible(false);
  }

  function handleSelectPerson(person: IAuthorizedPerson) {
    onSelectPerson(person);
    handleCloseModal();
  }

  if (!authorizedPersons || authorizedPersons.length === 0) {
    return null;
  }

  return (
    <View className="flex-row items-center bg-bg-card rounded-lg px-3 py-2 border border-border-default gap-2">
      <View className="justify-center items-center">
        <Display.Icon name="user-check" size={20} type="feather" />
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-1 flex-row justify-between items-center"
        onPress={handleOpenModal}
      >
        <Typography.Text variant="bodySmall">
          {selectedPerson?.name || `Seleccione persona autorizada`}
        </Typography.Text>
        <Display.Icon name="chevron-down" size={20} type="feather" />
      </TouchableOpacity>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View className="flex-1 bg-black/50 justify-center items-center">
            <TouchableWithoutFeedback>
              <View className="bg-bg-card rounded-xl w-[85%] max-h-[70%] overflow-hidden">
                <View className="flex-row justify-between items-center p-4 border-b border-border-default">
                  <Typography.Text variant="bodySmall">
                    {`Seleccione persona autorizada`}
                  </Typography.Text>
                  <TouchableOpacity onPress={handleCloseModal}>
                    <Display.Icon name="x" size={24} type="feather" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={authorizedPersons}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={cn(
                        "flex-row justify-between items-center p-4 border-b border-border-default",
                        selectedPerson?.id === item.id && "bg-bg-muted",
                      )}
                      onPress={() => handleSelectPerson(item)}
                    >
                      <View className="flex-1 gap-1">
                        <Typography.Text variant="body">{item.name}</Typography.Text>
                        <Typography.Text
                          className="text-text-secondary"
                          variant="bodySmall"
                        >{`ID: ${item.partnerId}`}</Typography.Text>
                      </View>
                      {selectedPerson?.id === item.id && (
                        <Display.Icon
                          color={theme.warning}
                          name="check"
                          size={20}
                          type="feather"
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

export default AuthorizedPersonSelector;
