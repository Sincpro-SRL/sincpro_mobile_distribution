import type { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";

import { CustomerAvatar, CustomerCreditBadge, CustomerStatusIcon } from "../atoms";

interface CustomerReadOnlyRowProps {
  customer: Customer;
}

export function CustomerReadOnlyRow({ customer }: CustomerReadOnlyRowProps) {
  return (
    <ListViewV2.Content.Row>
      <ListViewV2.Content.Row.Avatar>
        <CustomerAvatar customer={customer} size={40} />
      </ListViewV2.Content.Row.Avatar>

      <ListViewV2.Content.Row.Content>
        <ListViewV2.Content.Row.Title
          badge={
            customer.routeStatus && <CustomerStatusIcon routeStatus={customer.routeStatus} />
          }
        >
          {customer.name}
        </ListViewV2.Content.Row.Title>

        <ListViewV2.Content.Row.Subtitle>
          {customer.vat || "Sin cédula"}
        </ListViewV2.Content.Row.Subtitle>

        {customer.availableCredit > 0 && (
          <ListViewV2.Content.Row.Footer>
            <CustomerCreditBadge availableCredit={customer.availableCredit} />
          </ListViewV2.Content.Row.Footer>
        )}
      </ListViewV2.Content.Row.Content>
    </ListViewV2.Content.Row>
  );
}
