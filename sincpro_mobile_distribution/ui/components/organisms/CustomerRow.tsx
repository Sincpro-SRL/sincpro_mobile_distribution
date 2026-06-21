import type { Customer } from "@sincpro/mobile-distribution/domain/customer";

import { CustomerEditableRow, CustomerReadOnlyRow } from "../molecules";

interface CustomerRowProps {
  customer: Customer;
  readonly?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetail?: () => void;
}

export function CustomerRow({
  customer,
  readonly,
  onPress,
  onEdit,
  onDelete,
  onViewDetail,
}: CustomerRowProps) {
  return readonly ? (
    <CustomerReadOnlyRow customer={customer} />
  ) : (
    <CustomerEditableRow
      customer={customer}
      onDelete={onDelete}
      onEdit={onEdit}
      onPress={onPress}
      onViewDetail={onViewDetail}
    />
  );
}
