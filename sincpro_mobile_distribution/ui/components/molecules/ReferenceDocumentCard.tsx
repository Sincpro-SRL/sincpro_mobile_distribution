import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import { Display } from "@sincpro/mobile-ui/Display";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

interface ReferenceDocumentCardProps {
  creditNote: CreditNote;
}

export function ReferenceDocumentCard({ creditNote }: ReferenceDocumentCardProps) {
  const hasReference = Boolean(creditNote.reversedEntryName);

  return (
    <View className="p-4 gap-3">
      <View className="flex-row items-center gap-2">
        <Typography.Text semibold variant="body">
          {`Documento de referencia`}
        </Typography.Text>
      </View>

      <View className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 gap-3 border border-amber-200">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 gap-0.5">
            <Typography.Text className="text-text-tertiary" variant="caption">
              {`Factura original`}
            </Typography.Text>
            <Typography.Text semibold variant="body">
              {hasReference ? creditNote.reversedEntryName : `Sin referencia`}
            </Typography.Text>
          </View>

          <View className="items-end gap-0.5">
            <Typography.Text className="text-text-tertiary" variant="caption">
              {`Monto`}
            </Typography.Text>
            <Display.Monetary
              currencySymbol={creditNote.currencySymbol}
              semibold
              textVariant="body"
              value={creditNote.amountTotal}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
