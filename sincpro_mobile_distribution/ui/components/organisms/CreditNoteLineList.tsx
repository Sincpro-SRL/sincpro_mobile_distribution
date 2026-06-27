import type {
  CreditNote,
  CreditNoteLine,
} from "@sincpro/mobile-distribution/domain/credit_note";
import { Display } from "@sincpro/mobile-ui";
import { cn, tv } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { View } from "react-native";

const statusIndicator = tv({
  base: "w-2 h-2 rounded-full",
  variants: {
    status: {
      paid: "bg-success",
      partial: "bg-warning",
      pending: "bg-text-tertiary",
    },
  },
});

interface CreditNoteLineRowProps {
  line: CreditNoteLine;
  currencySymbol?: string;
  isLast?: boolean;
}

function CreditNoteLineRow({
  line,
  currencySymbol = "₡",
  isLast = false,
}: CreditNoteLineRowProps) {
  const lineTotal = line.priceUnit * line.quantity * (1 - (line.discount || 0) / 100);

  return (
    <View
      className={cn(
        "flex-row justify-between items-center py-3",
        !isLast && "border-b border-border-default",
      )}
    >
      <View className="flex-1 mr-3 gap-1">
        <Typography.Text numberOfLines={2} semibold variant="body">
          {line.name}
        </Typography.Text>
        <View className="flex-row gap-2">
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            {line.quantity} x {currencySymbol}
            {line.priceUnit.toFixed(2)}
          </Typography.Text>
          {(line.discount ?? 0) > 0 && (
            <Typography.Text className="text-green-500" variant="bodySmall">
              -{line.discount}%
            </Typography.Text>
          )}
        </View>
      </View>
      <Display.Monetary currencySymbol={currencySymbol} value={lineTotal} />
    </View>
  );
}

interface CreditNoteLineListProps {
  lines: CreditNoteLine[];
  currencySymbol?: string;
  title?: string;
}

export function CreditNoteLineList({
  lines,
  currencySymbol = "₡",
  title,
}: CreditNoteLineListProps) {
  if (!lines || lines.length === 0) {
    return null;
  }

  return (
    <View className="p-0">
      <View className="px-4 pt-4 pb-3 border-b border-border-default">
        {title && (
          <Typography.Text className="mb-2" semibold variant="subtitle">
            {title}
          </Typography.Text>
        )}
        <Display.CountRecords count={lines.length} name="productos" withPadding={false} />
      </View>
      <View className="px-4 py-3">
        {lines.map((line, index) => (
          <CreditNoteLineRow
            currencySymbol={currencySymbol}
            isLast={index === lines.length - 1}
            key={line.uuid || index}
            line={line}
          />
        ))}
      </View>
    </View>
  );
}

interface CreditNoteHeaderCardProps {
  creditNote: CreditNote;
}

export function CreditNoteHeaderCard({ creditNote }: CreditNoteHeaderCardProps) {
  const isPaid = creditNote.paymentState === "paid";
  const isPartial = creditNote.paymentState === "partial";
  const isDone = creditNote.status === "done";

  function getStatusText(): string {
    if (isPaid) return "Devuelto";
    if (isPartial) return "Parcial";
    return "Pendiente";
  }

  function getStatusVariant(): "paid" | "partial" | "pending" {
    if (isPaid) return "paid";
    if (isPartial) return "partial";
    return "pending";
  }

  function getStatusTextClass(): string {
    if (isPaid) return "text-success";
    if (isPartial) return "text-warning";
    return "text-text-tertiary";
  }

  return (
    <View className="p-4 bg-gradient-to-br from-bg-secondary to-bg-secondary rounded-xl border border-border-default">
      <View className="flex-row justify-between items-start gap-3">
        <View className="flex-1 gap-2">
          <Typography.Text semibold variant="h3">
            Nota de Crédito
          </Typography.Text>
          <View className="bg-bg-card px-3 py-2 rounded-lg border border-border-default">
            <Typography.Text className="text-text-secondary" variant="bodySmall">
              Ref: {creditNote.reversedEntryName || "N/A"}
            </Typography.Text>
          </View>
          <View className="flex-row items-center gap-1.5 pt-1">
            <View className={statusIndicator({ status: getStatusVariant() })} />
            <Typography.Text className={getStatusTextClass()} semibold variant="bodySmall">
              {getStatusText()}
            </Typography.Text>
            {isDone && (
              <View className="ml-2 px-2 py-1 bg-orange-100 rounded">
                <Typography.Text className="text-orange-700" variant="caption">
                  Publicada
                </Typography.Text>
              </View>
            )}
          </View>
        </View>
        <View className="items-end gap-1 min-w-24">
          <Typography.Text semibold variant="subtitle">
            {creditNote.name || `NC-${creditNote.uuid?.slice(-6)}`}
          </Typography.Text>
          <Typography.Text className="text-text-tertiary" variant="bodySmall">
            {creditNote.scheduledDate
              ? new Date(creditNote.scheduledDate).toLocaleDateString("es-CR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Sin fecha"}
          </Typography.Text>
          {isPaid && (
            <View className="mt-1 px-2 py-1 bg-green-100 rounded">
              <Typography.Text className="text-green-700" variant="caption">
                Procesado
              </Typography.Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
