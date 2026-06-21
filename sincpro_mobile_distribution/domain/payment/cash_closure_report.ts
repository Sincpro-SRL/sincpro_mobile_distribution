import {
  IReceiptExporter,
  LabelMap,
  ReceiptPrintableResponse,
} from "@sincpro/mobile/domain/receipt";
import { groupBy } from "@sincpro/mobile/tools/utils/collections";
import { formatDate } from "@sincpro/mobile/tools/utils/date";
import { formatTwoDecimals } from "@sincpro/mobile/tools/utils/monetary";

import { EPaymentTargetType, Payment } from "./payment";

const DEFAULT_TIMEZONE = "America/Costa_Rica";
const DEFAULT_LOCALE = "es-CR";

export interface ICashClosureReportData {
  startDate?: string;
  endDate?: string;
  payments: Payment[];
  routeId?: number;
}

function getPaymentContextLabel(targetType?: EPaymentTargetType): string {
  const contextMap: Record<EPaymentTargetType, string> = {
    [EPaymentTargetType.SALE_ORDER]: "Ventas",
    [EPaymentTargetType.INVOICE]: "Pagos de factura",
    [EPaymentTargetType.CREDIT_NOTE]: "Pagos de nota de crédito",
  };

  return contextMap[targetType!] || "Otros pagos";
}

function getPaymentContextShort(targetType?: EPaymentTargetType): string {
  const contextMap: Record<EPaymentTargetType, string> = {
    [EPaymentTargetType.SALE_ORDER]: "Venta",
    [EPaymentTargetType.INVOICE]: "Factura",
    [EPaymentTargetType.CREDIT_NOTE]: "Nota crédito",
  };

  return contextMap[targetType!] || "Otro";
}

export class CashClosureReport implements IReceiptExporter {
  constructor(
    private data: ICashClosureReportData,
    private closureDate: string = new Date().toISOString(),
  ) {}

  static fromPayments(
    payments: Payment[],
    startDate?: string,
    endDate?: string,
    routeId?: number,
  ): CashClosureReport {
    return new CashClosureReport({
      startDate,
      endDate,
      payments,
      routeId,
    });
  }

  exportReceiptDefinition(userName?: string): ReceiptPrintableResponse {
    return {
      data: this.generateReceiptData(userName),
      labels: this.getLabels(userName),
    };
  }

  private generateReceiptData(userName?: string): Record<string, any> {
    const totalAmount = this.data.payments.reduce((acc, payment) => acc + payment.value, 0);

    const groupedByMethod = groupBy(
      this.data.payments,
      (payment) => payment.paymentMethod?.name || "Sin método",
    );

    const paymentMethodBreakdown = Object.entries(groupedByMethod).map(
      ([method, payments]) => ({
        Método: method,
        Cantidad: payments.length.toString(),
        Total: "₡" + formatTwoDecimals(payments.reduce((sum, p) => sum + p.value, 0)),
      }),
    );

    const groupedByTargetType = groupBy(
      this.data.payments,
      (payment) => payment.targetType || "unknown",
    );

    const paymentSections: Record<string, any> = {};
    const sectionLabels: Record<string, any> = {};

    Object.entries(groupedByTargetType).forEach(([targetType, payments], index) => {
      const sectionKey = `paymentSection${index}`;
      const separatorKey = `separator${index + 7}`;

      const contextLabel = getPaymentContextLabel(targetType as EPaymentTargetType);
      const sectionTotal = payments.reduce((sum, p) => sum + p.value, 0);

      const sectionHeaderKey = `sectionHeader${index}`;
      paymentSections[sectionHeaderKey] =
        `${contextLabel} (${payments.length} transacciones - ₡${formatTwoDecimals(sectionTotal)})`;
      sectionLabels[sectionHeaderKey] = false as const;

      const sectionPayments = payments.map((payment) => ({
        Hora: payment.date
          ? formatDate(payment.date, DEFAULT_TIMEZONE, {
              locale: DEFAULT_LOCALE,
              showTime: true,
            }).split(", ")[1] || ""
          : "",
        Cliente: payment.customerName || payment.targetName || "N/A",
        Contexto: getPaymentContextShort(payment.targetType),
        Método: payment.paymentMethod?.name || "Sin método",
        Monto: "₡" + formatTwoDecimals(payment.value),
      }));

      paymentSections[sectionKey] = sectionPayments;
      sectionLabels[sectionKey] = {
        label: `Detalle - ${contextLabel}`,
        renderAs: "table" as const,
      };

      if (index < Object.keys(groupedByTargetType).length - 1) {
        paymentSections[separatorKey] = null;
        sectionLabels[separatorKey] = "separator" as const;
      }
    });

    return {
      companyName:
        "Cooperativa de Servicios Multiples de Santa Rosa de Zarcero Coopebrisas R.L.",
      companyVat: "Ced. 3-004-051156-17",
      phone: "Tels.: 24633044 | 0",
      separator1: null,
      reportTitle: "REPORTE DE CIERRE DE CAJA",
      closureDate: formatDate(this.closureDate, DEFAULT_TIMEZONE, {
        locale: DEFAULT_LOCALE,
        showTime: true,
      }),
      routeInfo: this.data.routeId ? `Ruta: ${this.data.routeId}` : "Sin ruta asignada",
      separator2: null,
      periodInfo: this.getPeriodInfo(),
      separator3: null,
      paymentCount: `Total de transacciones: ${this.data.payments.length}`,
      totalAmount: "₡" + formatTwoDecimals(totalAmount),
      separator4: null,
      paymentMethodBreakdown,
      separator5: null,
      ...paymentSections,
      separator6: null,
      closureTime: formatDate(this.closureDate, DEFAULT_TIMEZONE, {
        locale: DEFAULT_LOCALE,
        showTime: true,
      }),
      ...(userName && {
        separator7: null,
        userName: `Generado por: ${userName}`,
      }),
    };
  }

  private getPeriodInfo(): string {
    if (this.data.startDate && this.data.endDate) {
      const start = formatDate(this.data.startDate, DEFAULT_TIMEZONE, {
        locale: DEFAULT_LOCALE,
      });
      const end = formatDate(this.data.endDate, DEFAULT_TIMEZONE, { locale: DEFAULT_LOCALE });
      return `Período: ${start} - ${end}`;
    }
    if (this.data.startDate) {
      const start = formatDate(this.data.startDate, DEFAULT_TIMEZONE, {
        locale: DEFAULT_LOCALE,
      });
      return `Desde: ${start}`;
    }
    return `Fecha: ${formatDate(this.closureDate, DEFAULT_TIMEZONE, { locale: DEFAULT_LOCALE })}`;
  }

  private getLabels(userName?: string): LabelMap {
    const groupedByTargetType = groupBy(
      this.data.payments,
      (payment) => payment.targetType || "unknown",
    );

    const dynamicLabels: Record<string, any> = {};
    Object.entries(groupedByTargetType).forEach(([targetType, payments], index) => {
      const sectionHeaderKey = `sectionHeader${index}`;
      const sectionKey = `paymentSection${index}`;
      const separatorKey = `separator${index + 7}`;

      const contextLabel = getPaymentContextLabel(targetType as EPaymentTargetType);

      dynamicLabels[sectionHeaderKey] = false as const;
      dynamicLabels[sectionKey] = {
        label: `Detalle - ${contextLabel}`,
        renderAs: "table" as const,
      };

      if (index < Object.keys(groupedByTargetType).length - 1) {
        dynamicLabels[separatorKey] = "separator" as const;
      }
    });

    return {
      companyName: false as const,
      companyVat: false as const,
      phone: false as const,
      separator1: "separator" as const,
      reportTitle: false as const,
      closureDate: "Fecha de cierre",
      routeInfo: false as const,
      separator2: "separator" as const,
      periodInfo: false as const,
      separator3: "separator" as const,
      paymentCount: false as const,
      totalAmount: "TOTAL RECAUDADO",
      separator4: "separator" as const,
      paymentMethodBreakdown: {
        label: "Resumen por método de pago",
        renderAs: "table" as const,
      },
      separator5: "separator" as const,
      ...dynamicLabels,
      separator6: "separator" as const,
      closureTime: "Hora de cierre",
      ...(userName && {
        separator7: "separator" as const,
        userName: false as const,
      }),
    };
  }
}
