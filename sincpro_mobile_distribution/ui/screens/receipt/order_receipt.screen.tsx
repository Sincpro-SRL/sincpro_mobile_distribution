import { ReceiptExporterAdapter } from "@sincpro/mobile/adapters/ReceiptExporter.adapter";
import { ISelectedPrinter } from "@sincpro/mobile/domain/print";
import { IReceiptExporter } from "@sincpro/mobile/domain/receipt";
import { printerService } from "@sincpro/mobile/services/printer.service";
import Receipt from "@sincpro/mobile/ui/components/organisms/Receipt";
import { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import { Invoice } from "@sincpro/mobile-distribution/domain/invoice";
import { CashClosureReport } from "@sincpro/mobile-distribution/domain/payment";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { useDistributionGlobal } from "@sincpro/mobile-distribution/entrypoints/ui/context";
import { Form } from "@sincpro/mobile-ui/Form";
import PrinterIcon from "@sincpro/mobile-ui/icons/PrinterIcon";
import { theme } from "@sincpro/mobile-ui/theme";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useLocation, useNavigate } from "react-router-native";

type ReceiptEntity = Invoice | CreditNote | CashClosureReport;

function OrderReceiptScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const receiptRef = useRef<View>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<ISelectedPrinter | null>(null);
  const { session } = useDistributionGlobal();

  useEffect(() => {
    printerService.getSelectedPrinter().then(setSelectedPrinter);
  }, []);

  const entityPayable = (location.state?.entity as IReceiptExporter) || null;

  function isCashClosureReport(): boolean {
    return entityPayable instanceof CashClosureReport;
  }

  function getSuccessMessage(): string {
    if (isCashClosureReport()) {
      return "Reporte de cierre de caja";
    }
    if (entityPayable instanceof CreditNote) {
      return "¡Nota de crédito procesada con éxito!";
    }
    if (entityPayable instanceof Invoice) {
      return "Recibo de dinero aplicado al siguiente documento";
    }
    return "¡Operación realizada con éxito!";
  }

  function getPrintButtonText(): string {
    if (isCashClosureReport()) {
      return "Imprimir reporte";
    }
    if (entityPayable instanceof CreditNote) {
      return "Imprimir nota de crédito";
    }
    return "Imprimir factura";
  }

  function getReturnDestination(): string {
    if (isCashClosureReport()) {
      return AppScreen.CASHIER;
    }
    return AppScreen.MAIN;
  }

  function getReturnButtonText(): string {
    if (isCashClosureReport()) {
      return "Volver a caja";
    }
    return "Volver a principal";
  }

  function getFileName(): string {
    if (isCashClosureReport()) {
      return `cierre_caja_${Date.now()}`;
    }
    return "comprobante";
  }

  function handleReturn() {
    navigate(getReturnDestination());
  }

  async function handlePrint() {
    setIsLoading(true);
    await ReceiptExporterAdapter.captureAndShareAsPdf(receiptRef, {
      fileName: getFileName(),
      dialogTitle: "Compartir comprobante",
    });
    setIsLoading(false);
  }

  async function handlePrintBluetooth() {
    setIsLoading(true);
    await printerService.printFromView(receiptRef);
    setIsLoading(false);
  }

  if (!entityPayable) {
    return null;
  }

  const userName = session?.name || "Usuario desconocido";
  const { labels, data } = entityPayable.exportReceiptDefinition(userName);

  return (
    <FormViewV2.Root
      description=""
      isLoading={isLoading}
      item={entityPayable as ReceiptEntity}
      name={getSuccessMessage()}
    >
      <FormViewV2.Header
        logoSource={require("../../../../assets/DISTRIBUTION/logo.png")}
        variant={EVariantScreenHeader.ONLY_LOGO}
      />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>
            <View className="bg-bg-card" collapsable={false} ref={receiptRef}>
              <Receipt data={data} labels={labels} />
            </View>
          </FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>
        <View className="p-4 gap-3">
          <Form.Button
            loading={isLoading}
            onPress={handleReturn}
            title={getReturnButtonText()}
            variant="accent"
          />
          <Form.Button
            loading={isLoading}
            onPress={handlePrint}
            title={getPrintButtonText()}
            variant="outlineBlack"
          />
          {selectedPrinter && (
            <Form.Button
              icon={<PrinterIcon color={theme.text.secondary} size={20} />}
              loading={isLoading}
              onPress={handlePrintBluetooth}
              title="Imprimir en térmica"
              variant="secondary"
            />
          )}
        </View>
      </FormViewV2.Footer>
    </FormViewV2.Root>
  );
}

export default OrderReceiptScreen;
