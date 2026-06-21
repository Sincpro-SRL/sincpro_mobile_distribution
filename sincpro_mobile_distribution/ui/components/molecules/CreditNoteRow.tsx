import {
  CreditNote,
  ECreditNotePaymentState,
} from "@sincpro/mobile-distribution/domain/credit_note";
import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import { Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { tv } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";
import { useNavigate } from "react-router-native";

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

const statusText = tv({
  variants: {
    status: {
      paid: "text-success",
      partial: "text-warning",
      pending: "text-text-tertiary",
    },
  },
});

interface CreditNoteRowProps {
  creditNote: CreditNote;
  customer?: Customer;
  onPress?: () => void;
  showNavigateToDetail?: boolean;
}

export function CreditNoteRow({
  creditNote,
  customer,
  onPress,
  showNavigateToDetail = true,
}: CreditNoteRowProps) {
  const navigate = useNavigate();

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (showNavigateToDetail) {
      let resolvedCustomer = customer;
      if (!resolvedCustomer && creditNote.customerId) {
        resolvedCustomer =
          (await customerService.getCustomerByRemoteId(creditNote.customerId)) ?? undefined;
      }
      navigate(AppScreen.CREDIT_NOTE_DETAIL, {
        state: {
          creditNote,
          customer: resolvedCustomer,
        },
      });
    }
  };

  const isPaid = creditNote.paymentState === ECreditNotePaymentState.PAID;
  const isPartial = creditNote.paymentState === ECreditNotePaymentState.PARTIAL;

  function getStatusText(): string {
    if (isPaid) return `Devuelto`;
    if (isPartial) return `Parcial`;
    return `Pendiente`;
  }

  function getStatusVariant() {
    if (isPaid) return "paid";
    if (isPartial) return "partial";
    return "pending";
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-bg-card p-4 mx-4 my-2 rounded-xl border border-border-default shadow-md"
      disabled={!showNavigateToDetail && !onPress}
      onPress={handlePress}
    >
      <View className="flex-row justify-between items-center mb-3">
        <Typography.Text semibold variant="body">
          {creditNote.name || `NC-${creditNote.uuid?.slice(-6)}`}
        </Typography.Text>
        <Typography.Text className="text-text-tertiary" variant="caption">
          {creditNote.scheduledDate
            ? new Date(creditNote.scheduledDate).toLocaleDateString("es-CR")
            : `Sin fecha`}
        </Typography.Text>
      </View>

      <View className="mb-3 gap-1.5 pb-3 border-b border-border-default">
        <Typography.Text className="text-text-secondary" variant="bodySmall">
          {creditNote.customerName}
        </Typography.Text>
        {creditNote.reversedEntryName && (
          <Typography.Text className="text-text-tertiary" variant="caption">
            {`Ref: ${creditNote.reversedEntryName}`}
          </Typography.Text>
        )}
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-1.5">
          <View className={statusIndicator({ status: getStatusVariant() })} />
          <Typography.Text
            className={statusText({ status: getStatusVariant() })}
            semibold
            variant="bodySmall"
          >
            {getStatusText()}
          </Typography.Text>
        </View>
        <Display.Monetary
          currencySymbol={creditNote.currencySymbol}
          semibold
          value={creditNote.amountTotal}
        />
      </View>
    </TouchableOpacity>
  );
}
