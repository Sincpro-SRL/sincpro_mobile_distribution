import { ERemoteState } from "@sincpro/mobile/domain/entity";
import {
  CreditNote,
  ECreditNotePaymentState,
} from "@sincpro/mobile-distribution/domain/credit_note";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { createContext, ReactNode, useContext } from "react";
import { View } from "react-native";

interface CreditNoteCardHeaderContextValue {
  creditNote: CreditNote;
}

const CreditNoteCardHeaderContext = createContext<CreditNoteCardHeaderContextValue | null>(
  null,
);

function useCreditNoteCardHeader() {
  const context = useContext(CreditNoteCardHeaderContext);
  if (!context) {
    throw new Error(
      "CreditNoteCardHeader compound components must be used within CreditNoteCardHeader",
    );
  }
  return context;
}

interface SyncBadgeInfo {
  label: string;
  variant: BadgeVariants;
}

interface PaymentBadgeInfo {
  label: string;
  variant: BadgeVariants;
}

interface StateBadgeInfo {
  label: string;
  variant: BadgeVariants;
}

function getSyncBadge(creditNote: CreditNote): SyncBadgeInfo {
  const isSynced = creditNote.remoteState === ERemoteState.SYNCED;
  if (isSynced) {
    return { label: "Sincronizado", variant: BadgeVariants.SUCCESS };
  }
  return { label: "Pendiente sync", variant: BadgeVariants.WARNING };
}

function getPaymentBadge(creditNote: CreditNote): PaymentBadgeInfo | null {
  const isPaid = creditNote.paymentState === ECreditNotePaymentState.PAID;
  const isPartial = creditNote.paymentState === ECreditNotePaymentState.PARTIAL;

  if (isPaid) {
    return { label: "Pagado", variant: BadgeVariants.SUCCESS };
  }
  if (isPartial) {
    return { label: "Pago parcial", variant: BadgeVariants.INFO_DARK };
  }
  return { label: "Sin pagar", variant: BadgeVariants.WARNING };
}

function getStateBadge(creditNote: CreditNote): StateBadgeInfo {
  const isDraft = creditNote.state === "draft";
  if (isDraft) {
    return { label: "Borrador", variant: BadgeVariants.INFO_DARK };
  }
  return { label: "Publicada", variant: BadgeVariants.SUCCESS };
}

interface CreditNoteCardHeaderProps {
  creditNote: CreditNote;
  backgroundColor?: string;
  children?: ReactNode;
}

function CreditNoteCardHeaderRoot({
  creditNote,
  backgroundColor,
  children,
}: CreditNoteCardHeaderProps) {
  const documentName = creditNote.name || `NC-${creditNote.uuid?.slice(-6)}`;
  const syncBadge = getSyncBadge(creditNote);
  const paymentBadge = getPaymentBadge(creditNote);
  const stateBadge = getStateBadge(creditNote);

  const containerClass = backgroundColor ? undefined : "bg-bg-muted";

  return (
    <CreditNoteCardHeaderContext.Provider value={{ creditNote }}>
      <View
        className={`p-4 gap-4 rounded-xl ${backgroundColor ? "" : containerClass}`.trim()}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 gap-0.5">
            <Typography.Text className="text-text-secondary" variant="caption">
              {`Nota de crédito`}
            </Typography.Text>
            <Typography.Text semibold variant="bodyLarge">
              {documentName}
            </Typography.Text>
          </View>
          <View className="items-end gap-1">
            <Display.Badge label={syncBadge.label} variant={syncBadge.variant} />
            <Display.Badge label={stateBadge.label} variant={stateBadge.variant} />
            {paymentBadge && (
              <Display.Badge label={paymentBadge.label} variant={paymentBadge.variant} />
            )}
          </View>
        </View>

        <View className="flex-row justify-between items-end">
          <View className="flex-1 gap-0.5">
            <Typography.Text className="text-text-secondary" variant="caption">
              {`Cliente`}
            </Typography.Text>
            <Typography.Text semibold variant="bodySmall">
              {creditNote.customerName || `N/A`}
            </Typography.Text>
          </View>
          <View className="flex-row items-center gap-2">{children}</View>
        </View>
      </View>
    </CreditNoteCardHeaderContext.Provider>
  );
}

function ScheduledDate({ value }: { value?: string }) {
  const formattedDate = value
    ? new Date(value).toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A";

  return (
    <View>
      <Typography.Text className="text-text-secondary" variant="caption">
        {`Fecha`}
      </Typography.Text>
      <Typography.Text variant="bodySmall">{formattedDate}</Typography.Text>
    </View>
  );
}

function ProductCount() {
  const { creditNote } = useCreditNoteCardHeader();
  const count = creditNote.creditNoteLines?.length || 0;

  return (
    <View className="flex-row items-center gap-1.5">
      <View className="w-1 h-1 rounded-sm bg-text-tertiary" />
      <Typography.Text semibold variant="body">
        {count} {count === 1 ? "producto" : "productos"}
      </Typography.Text>
    </View>
  );
}

function Amount() {
  const { creditNote } = useCreditNoteCardHeader();

  return (
    <View className="items-end gap-0.5">
      <Typography.Text className="text-text-secondary" variant="caption">
        {`Total`}
      </Typography.Text>
      <Display.Monetary
        currencySymbol={creditNote.currencySymbol}
        semibold
        textVariant="bodyLarge"
        value={creditNote.amountTotal}
      />
    </View>
  );
}

export const CreditNoteCardHeader = Object.assign(CreditNoteCardHeaderRoot, {
  ScheduledDate,
  ProductCount,
  Amount,
});
