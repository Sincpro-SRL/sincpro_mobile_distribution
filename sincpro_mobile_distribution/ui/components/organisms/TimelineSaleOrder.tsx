import {
  ITimelineStep,
  SaleOrder,
  SaleOrderInvoice,
} from "@sincpro/mobile-distribution/domain/sale_order";
import { BadgeVariants, Display } from "@sincpro/mobile-ui/Display";
import { theme } from "@sincpro/mobile-ui/theme";
import { cn, tv } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { TouchableOpacity, View } from "react-native";

const invoiceBorder = tv({
  base: "border-l-[3px]",
  variants: {
    status: {
      cancelled: "border-l-red-500",
      creditNote: "border-l-orange-500",
      normal: "border-l-orange-500",
    },
  },
});

const invoiceTextVariants = tv({
  variants: {
    cancelled: {
      true: "text-text-tertiary",
      false: "",
    },
  },
});

const stepTextVariants = tv({
  variants: {
    completed: {
      true: "text-text-inverse",
      false: "text-text-tertiary",
    },
  },
});

const statusTextVariants = tv({
  variants: {
    current: {
      true: "text-success",
      false: "",
    },
  },
});

const dateTextVariants = tv({
  variants: {
    current: {
      true: "text-success",
      false: "text-text-tertiary",
    },
  },
});

interface TimelineSaleOrderProps {
  saleOrder: SaleOrder;
  onViewInvoice?: (invoice: SaleOrderInvoice) => void;
  onViewReceipt?: (invoice: SaleOrderInvoice) => void;
}

function getBadgeVariant(
  variant: "success" | "warning" | "info" | "error" | "default",
): BadgeVariants {
  switch (variant) {
    case "success":
      return BadgeVariants.SUCCESS;
    case "warning":
      return BadgeVariants.WARNING;
    case "info":
      return BadgeVariants.INFO;
    case "error":
      return BadgeVariants.WARNING;
    default:
      return BadgeVariants.INFO_DARK;
  }
}

function getInvoiceBorderVariant(
  invoice: SaleOrderInvoice,
): "cancelled" | "creditNote" | "normal" {
  if (invoice.isCancelled()) return "cancelled";
  if (invoice.isOutRefund) return "creditNote";
  return "normal";
}

interface TimelineInvoiceItemProps {
  invoice: SaleOrderInvoice;
  currencySymbol: string;
  onViewInvoice?: (invoice: SaleOrderInvoice) => void;
  onViewReceipt?: (invoice: SaleOrderInvoice) => void;
}

function TimelineInvoiceItem({
  invoice,
  currencySymbol,
  onViewInvoice,
  onViewReceipt,
}: TimelineInvoiceItemProps) {
  const canViewInvoice = invoice.canViewInvoice && onViewInvoice;
  const canViewReceipt = invoice.hasReceipt && onViewReceipt;

  return (
    <View
      className={cn(
        "flex-row items-center justify-between bg-bg-muted rounded-lg p-2.5",
        invoiceBorder({ status: getInvoiceBorderVariant(invoice) }),
        invoice.isCancelled() && "opacity-60",
      )}
    >
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Typography.Text
            className={invoiceTextVariants({ cancelled: invoice.isCancelled() })}
            variant="bodySmall"
          >
            {invoice.isOutRefund ? "NC: " : ""}
            {invoice.name}
          </Typography.Text>
          <View className="flex-row gap-1">
            <Display.Badge
              label={invoice.stateLabel}
              variant={getBadgeVariant(invoice.stateVariant)}
            />
            <Display.Badge
              label={invoice.paymentStateLabel}
              variant={getBadgeVariant(invoice.paymentStateVariant)}
            />
          </View>
        </View>
        <Display.Monetary
          color={invoice.isOutRefund ? "#f97316" : undefined}
          currencySymbol={currencySymbol}
          textVariant="bodySmall"
          value={invoice.isOutRefund ? -invoice.amountTotal : invoice.amountTotal}
        />
      </View>
      <View className="flex-row gap-1">
        {canViewReceipt && (
          <TouchableOpacity
            className="p-2 rounded-full bg-bg-card"
            onPress={() => onViewReceipt(invoice)}
          >
            <Display.Icon color="#22c55e" name="printer" size={16} type="feather" />
          </TouchableOpacity>
        )}
        {canViewInvoice && (
          <TouchableOpacity
            className="p-2 rounded-full bg-bg-card"
            onPress={() => onViewInvoice(invoice)}
          >
            <Display.Icon color="#f97316" name="eye" size={16} type="feather" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface TimelineStepsProps {
  steps: ITimelineStep[];
  currencySymbol: string;
  onViewInvoice?: (invoice: SaleOrderInvoice) => void;
  onViewReceipt?: (invoice: SaleOrderInvoice) => void;
}

function TimelineSteps({
  steps,
  currencySymbol,
  onViewInvoice,
  onViewReceipt,
}: TimelineStepsProps) {
  return (
    <View className="mt-2">
      {steps.map((step, index) => {
        const hasInvoices = step.invoices && step.invoices.length > 0;
        const isLastStep = index === steps.length - 1;

        return (
          <View className="flex-row mb-6" key={step.id}>
            <View className="items-center w-10">
              {step.current ? (
                <View className="w-10 h-10 rounded-full border-2 border-success justify-center items-center">
                  <View
                    className={cn(
                      "w-[30px] h-[30px] rounded-full justify-center items-center z-[1] m-[2px]",
                      step.completed ? "bg-success" : "bg-border-default",
                      step.current && "bg-success",
                    )}
                  >
                    <Typography.Text className="text-text-inverse" semibold variant="body">
                      {index + 1}
                    </Typography.Text>
                  </View>
                </View>
              ) : (
                <View
                  className={cn(
                    "w-[30px] h-[30px] rounded-full justify-center items-center z-[1] m-[2px]",
                    step.completed ? "bg-success" : "bg-border-default",
                  )}
                >
                  <Typography.Text
                    className={stepTextVariants({ completed: step.completed })}
                    semibold
                    variant="body"
                  >
                    {index + 1}
                  </Typography.Text>
                </View>
              )}
              {!isLastStep && (
                <View
                  className={cn(
                    "w-[2px] flex-1 bg-border-default absolute",
                    hasInvoices && "bottom-[-100px]",
                  )}
                  style={{ top: 30, bottom: -28, left: 20 }}
                />
              )}
            </View>
            <View className={cn("flex-1 pl-3 relative", hasInvoices && "pb-2")}>
              <Typography.Text
                className={statusTextVariants({ current: step.current })}
                semibold
                variant="body"
              >
                {step.status}
              </Typography.Text>
              <Typography.Text
                className={dateTextVariants({ current: step.current })}
                variant="bodySmall"
              >
                {step.date}
              </Typography.Text>
              {hasInvoices && (
                <View className="mt-3 gap-2">
                  {step.invoices!.map((invoice) => (
                    <TimelineInvoiceItem
                      currencySymbol={currencySymbol}
                      invoice={invoice}
                      key={invoice.uuid}
                      onViewInvoice={onViewInvoice}
                      onViewReceipt={onViewReceipt}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TimelineSaleOrder({
  saleOrder,
  onViewInvoice,
  onViewReceipt,
}: TimelineSaleOrderProps) {
  const steps = saleOrder.buildTimelineSteps();

  return (
    <View className="p-4">
      <Typography.Text className="mb-3" semibold variant="body">
        Estado de orden
      </Typography.Text>
      <TimelineSteps
        currencySymbol={saleOrder.currencySymbol}
        onViewInvoice={onViewInvoice}
        onViewReceipt={onViewReceipt}
        steps={steps}
      />
    </View>
  );
}

export default TimelineSaleOrder;
