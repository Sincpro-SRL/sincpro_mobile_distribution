import { SaleOrderLine } from "@sincpro/mobile-distribution/domain/sale_order";
import { SaleOrderLineRow } from "@sincpro/mobile-distribution/ui/components/organisms";
import { Form } from "@sincpro/mobile-ui/Form";
import { cn } from "@sincpro/mobile-ui/theme/tw";
import { Typography } from "@sincpro/mobile-ui/Typography";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import type { WizardContextValue } from "@sincpro/mobile-ui/views/Wizard";
import { useCallback, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { useCreateCreditNoteWizard } from "./context";

interface StepItemSelectionProps {
  wizard: WizardContextValue;
}

export function StepItemSelection({ wizard }: StepItemSelectionProps) {
  const {
    originalOrder,
    selectedLines,
    setCurrentEditingLine,
    selectLine,
    goToItemReview,
    goToOverview,
  } = useCreateCreditNoteWizard();

  const [, setSearchQuery] = useState("");
  const [filteredLines, setFilteredLines] = useState(originalOrder.orderLines);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFilteredLines(originalOrder.orderLines);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const filtered = originalOrder.orderLines.filter(
        (line) =>
          line.name.toLowerCase().includes(lowerQuery) ||
          String(line.productId).includes(lowerQuery),
      );
      setFilteredLines(filtered);
    },
    [originalOrder.orderLines],
  );

  const handleSelectLine = useCallback(
    (line: SaleOrderLine) => {
      const alreadySelected = selectedLines.some((l) => l.uuid === line.uuid);
      if (!alreadySelected) {
        selectLine(line);
      }
      const newLine = SaleOrderLine.fromJSON<SaleOrderLine>({ ...line, quantity: 1 });
      setCurrentEditingLine(newLine);
      goToItemReview(wizard);
    },
    [selectedLines, selectLine, setCurrentEditingLine, goToItemReview, wizard],
  );

  const isLineSelected = useCallback(
    (line: SaleOrderLine) => {
      return selectedLines.some((l) => l.uuid === line.uuid);
    },
    [selectedLines],
  );

  const handleContinue = useCallback(() => {
    goToOverview(wizard);
  }, [goToOverview, wizard]);

  const footerContent = useMemo(() => {
    if (selectedLines.length === 0) return null;

    return (
      <View className="p-4">
        <Form.Button
          onPress={handleContinue}
          title={`Continuar con ${selectedLines.length} item${selectedLines.length > 1 ? "s" : ""}`}
          variant="accent"
        />
      </View>
    );
  }, [selectedLines.length, handleContinue]);

  return (
    <ListViewV2.Root
      description={`${selectedLines.length} productos seleccionados`}
      isLoading={false}
      items={filteredLines}
      name="Items de la orden"
      onBack={() => goToOverview(wizard)}
      onSearch={handleSearch}
    >
      <ListViewV2.Header variant="default">
        <ListViewV2.Header.Search />
      </ListViewV2.Header>

      <ListViewV2.Content>
        {(line: SaleOrderLine) => {
          const selected = isLineSelected(line);
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              className="mb-2"
              key={line.uuid}
              onPress={() => handleSelectLine(line)}
            >
              <View
                className={cn(
                  "bg-bg-card rounded-lg p-3 border border-border-default",
                  selected && "bg-orange-50 border-l-4 border-l-orange-500 border-orange-300",
                )}
              >
                <SaleOrderLineRow
                  currencySymbol={originalOrder.currencySymbol}
                  line={line}
                  readonly
                />
                {selected && (
                  <View className="mt-2 pt-2 border-t border-orange-200 items-end">
                    <Typography.Text className="text-orange-500" semibold variant="caption">
                      ✓ Seleccionado
                    </Typography.Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      </ListViewV2.Content>

      {footerContent && <ListViewV2.Footer>{footerContent}</ListViewV2.Footer>}
    </ListViewV2.Root>
  );
}
