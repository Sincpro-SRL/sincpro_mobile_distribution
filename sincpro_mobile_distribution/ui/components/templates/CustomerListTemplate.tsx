import { Customer } from "@sincpro/mobile-distribution/domain/customer";
import { CustomerRow } from "@sincpro/mobile-distribution/ui/components/organisms";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { Children, isValidElement, ReactElement, ReactNode } from "react";

interface CustomerListTemplateProps {
  customers: Customer[];
  isLoading: boolean;
  title: string;
  description?: string;
  onSearch: (query: string) => void;
  onRefresh: () => void | Promise<void>;
  onSelect: (customer: Customer) => void;
  onViewDetail?: (customer: Customer) => void;
  onBack: () => void;
  children?: ReactNode;
}

interface SlotProps {
  children: ReactNode;
}

function HeaderActions({ children }: SlotProps) {
  return <>{children}</>;
}

function Filters({ children }: SlotProps) {
  return <>{children}</>;
}

function Footer({ children }: SlotProps) {
  return <>{children}</>;
}

function FloatingButton({ children }: SlotProps) {
  return <>{children}</>;
}

function AppBarActions({ children }: SlotProps) {
  return <>{children}</>;
}

function CustomerListTemplateRoot({
  customers,
  isLoading,
  title,
  description,
  onSearch,
  onRefresh,
  onSelect,
  onViewDetail,
  onBack,
  children,
}: CustomerListTemplateProps) {
  let headerActionsSlot: ReactNode = null;
  let appBarActionsSlot: ReactNode = null;
  let filtersSlot: ReactNode = null;
  let footerSlot: ReactNode = null;
  let floatingButtonSlot: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const element = child as ReactElement<SlotProps>;
    if (child.type === HeaderActions) {
      headerActionsSlot = element.props.children;
    } else if (child.type === AppBarActions) {
      appBarActionsSlot = element.props.children;
    } else if (child.type === Filters) {
      filtersSlot = element.props.children;
    } else if (child.type === Footer) {
      footerSlot = element.props.children;
    } else if (child.type === FloatingButton) {
      floatingButtonSlot = element.props.children;
    }
  });

  return (
    <ListViewV2.Root
      description={description}
      isLoading={isLoading}
      items={customers}
      name={title}
      onBack={onBack}
      onRefresh={async () => {
        await onRefresh();
      }}
      onSearch={onSearch}
    >
      <ListViewV2.Header actions={appBarActionsSlot ?? undefined} variant="default">
        <ListViewV2.Header.Search />
        {headerActionsSlot && (
          <ListViewV2.Header.Actions>{headerActionsSlot}</ListViewV2.Header.Actions>
        )}
        {filtersSlot && <ListViewV2.Header.Filters>{filtersSlot}</ListViewV2.Header.Filters>}
      </ListViewV2.Header>

      <ListViewV2.Content>
        {(customer: Customer) => (
          <CustomerRow
            customer={customer}
            onPress={() => onSelect(customer)}
            onViewDetail={onViewDetail ? () => onViewDetail(customer) : undefined}
            readonly={false}
          />
        )}
      </ListViewV2.Content>

      {footerSlot && <ListViewV2.Footer>{footerSlot}</ListViewV2.Footer>}

      {floatingButtonSlot && (
        <ListViewV2.FloatingButton>{floatingButtonSlot}</ListViewV2.FloatingButton>
      )}
    </ListViewV2.Root>
  );
}

export const CustomerListTemplate = Object.assign(CustomerListTemplateRoot, {
  HeaderActions,
  AppBarActions,
  Filters,
  Footer,
  FloatingButton,
});
