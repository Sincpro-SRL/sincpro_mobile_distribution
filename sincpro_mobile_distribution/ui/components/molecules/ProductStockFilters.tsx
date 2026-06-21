import { EProductStockFilter } from "@sincpro/mobile-distribution/domain/product";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";

interface ProductStockFiltersProps {
  activeFilter: EProductStockFilter;
  onFilterChange: (filter: EProductStockFilter) => void;
}

const FILTER_OPTIONS = [
  { key: EProductStockFilter.ALL, label: "Todos" },
  { key: EProductStockFilter.IN_STOCK, label: "En Stock" },
  { key: EProductStockFilter.OUT_OF_STOCK, label: "Sin Stock" },
];

export function ProductStockFilters({
  activeFilter,
  onFilterChange,
}: ProductStockFiltersProps) {
  return (
    <ListViewV2.Header.Filters.Chips>
      {FILTER_OPTIONS.map((option) => (
        <ListViewV2.Header.Filters.Chip
          active={activeFilter === option.key}
          key={option.key}
          label={option.label}
          onPress={() => onFilterChange(option.key)}
        />
      ))}
    </ListViewV2.Header.Filters.Chips>
  );
}
