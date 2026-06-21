import {
  DOCUMENT_TYPE_LABEL,
  EDocumentType,
  ENABLED_DOCUMENT_TYPES,
} from "@sincpro/mobile-distribution/domain/electronic_invoice";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";
import { tv } from "tailwind-variants";

const textVariants = tv({
  variants: {
    active: {
      true: "text-text-inverse",
      false: "text-warning",
    },
  },
});

interface DocumentTypeSelectorProps {
  value: EDocumentType;
  onChange: (type: EDocumentType) => void;
  allowedTypes?: EDocumentType[];
}

function DocumentTypeSelector({ value, onChange, allowedTypes }: DocumentTypeSelectorProps) {
  const types = allowedTypes || ENABLED_DOCUMENT_TYPES;

  return (
    <View className="gap-2 py-1.5 px-4 my-2">
      <Typography.Text semibold variant="body">
        {`Tipo de documento`}
      </Typography.Text>
      <View className="flex-row flex-wrap gap-2">
        {types.map((type) => {
          const isActive = type === value;
          return (
            <TouchableOpacity
              className={cn(
                "py-2.5 px-3.5 rounded-3xl border border-accent bg-bg-card",
                isActive && "bg-accent",
              )}
              key={type}
              onPress={() => onChange(type)}
            >
              <Typography.Text
                className={textVariants({ active: isActive })}
                semibold={isActive}
                variant="bodySmall"
              >
                {DOCUMENT_TYPE_LABEL[type]}
              </Typography.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default DocumentTypeSelector;
