import type { CreditNote } from "@sincpro/mobile-distribution/domain/credit_note";
import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import {
  CreditNoteCardHeader,
  CustomerInfoCard,
  ReferenceDocumentCard,
} from "@sincpro/mobile-distribution/ui/components/molecules";
import {
  CreditNoteLineList,
  SaleOrderPaymentActions,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { Form } from "@sincpro/mobile-ui/Form";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { useMemo } from "react";
import { View } from "react-native";
import { useLocation } from "react-router-native";

import { CreditNoteDetailProvider, useCreditNoteDetail } from "./credit_note.detail.context";

function CreditNoteDetailContent() {
  const {
    creditNote,
    customer,
    isLoading,
    isPosting,
    isPaid,
    isPartial,
    canPost,
    canPay,
    hasNumericKey,
    refreshCreditNote,
    postCreditNote,
    handlePayCreditNote,
    handleViewReceipt,
    handleBack,
  } = useCreditNoteDetail();

  const creditNoteHeaderSection = useMemo(() => {
    return (
      <CreditNoteCardHeader creditNote={creditNote}>
        <CreditNoteCardHeader.ScheduledDate value={creditNote.scheduledDate} />
      </CreditNoteCardHeader>
    );
  }, [creditNote]);

  const referenceDocumentSection = useMemo(() => {
    return <ReferenceDocumentCard creditNote={creditNote} />;
  }, [creditNote]);

  const customerSection = useMemo(() => {
    if (!customer) return null;
    return <CustomerInfoCard customer={customer} />;
  }, [customer]);

  const creditNoteLinesSection = useMemo(() => {
    if (!creditNote.creditNoteLines || creditNote.creditNoteLines.length === 0) return null;

    return (
      <CreditNoteLineList
        currencySymbol={creditNote.currencySymbol}
        lines={creditNote.creditNoteLines}
        title="Productos a devolver"
      />
    );
  }, [creditNote.creditNoteLines, creditNote.currencySymbol]);

  const footerActions = useMemo(() => {
    function getPaymentButtonText(): string {
      if (isPaid) return "Ver Historial de Pagos";
      if (isPartial) return "Completar pago";
      return "Pagar devolución";
    }

    return (
      <View className="p-4 gap-3">
        <SaleOrderPaymentActions.Root
          compact
          currencySymbol={creditNote.currencySymbol}
          isLoading={isLoading || isPosting}
        >
          <SaleOrderPaymentActions.InlineRow>
            <SaleOrderPaymentActions.TotalDisplay
              label="Total devolución"
              total={creditNote.amountResidual || 0}
            />
            <SaleOrderPaymentActions.PrimaryAction
              disabled={false}
              label={getPaymentButtonText()}
              onPress={handlePayCreditNote}
            />
          </SaleOrderPaymentActions.InlineRow>
        </SaleOrderPaymentActions.Root>

        <View className="flex-row gap-3">
          <Form.Button
            loading={isLoading}
            onPress={refreshCreditNote}
            size="small"
            title="Sincronizar"
            variant="outline"
          />

          {canPost && (
            <Form.Button
              confirm="¿Está seguro que desea publicar esta nota de crédito?"
              disabled={isPosting}
              loading={isPosting}
              onPress={postCreditNote}
              size="small"
              title={isPosting ? "Publicando..." : "Publicar"}
              variant="secondary"
            />
          )}

          {hasNumericKey && (
            <Form.Button
              confirm="¿Desea imprimir el ticket de esta nota de crédito?"
              onPress={handleViewReceipt}
              size="small"
              title="Imprimir"
              variant="outline"
            />
          )}
        </View>
      </View>
    );
  }, [
    creditNote,
    isPaid,
    isPartial,
    canPost,
    canPay,
    hasNumericKey,
    isLoading,
    isPosting,
    postCreditNote,
    handleViewReceipt,
    handlePayCreditNote,
  ]);

  return (
    <FormViewV2.Root
      description="Revisar y procesar devolución"
      isEmpty={!creditNote}
      isLoading={isLoading}
      item={creditNote}
      name="Nota de Crédito"
      onBack={handleBack}
      onRefresh={refreshCreditNote}
    >
      <FormViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER} />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>{creditNoteHeaderSection}</FormViewV2.Content.Group>
          <FormViewV2.Content.Group>{referenceDocumentSection}</FormViewV2.Content.Group>
          {customerSection && (
            <FormViewV2.Content.Group>{customerSection}</FormViewV2.Content.Group>
          )}
          {creditNoteLinesSection && (
            <FormViewV2.Content.Group>{creditNoteLinesSection}</FormViewV2.Content.Group>
          )}
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      <FormViewV2.Footer>{footerActions}</FormViewV2.Footer>
    </FormViewV2.Root>
  );
}

interface CreditNoteDetailScreenProps {
  creditNote?: CreditNote;
  customer?: Customer;
}

export function CreditNoteDetailScreen({
  creditNote,
  customer,
}: CreditNoteDetailScreenProps) {
  const location = useLocation();
  const creditNoteFromState = location.state?.creditNote as CreditNote | undefined;
  const customerFromState = location.state?.customer as Customer | undefined;

  const resolvedCreditNote = creditNote ?? creditNoteFromState;
  const resolvedCustomer = customer ?? customerFromState ?? null;

  if (!resolvedCreditNote) {
    return null;
  }

  return (
    <CreditNoteDetailProvider creditNote={resolvedCreditNote} customer={resolvedCustomer}>
      <CreditNoteDetailContent />
    </CreditNoteDetailProvider>
  );
}
