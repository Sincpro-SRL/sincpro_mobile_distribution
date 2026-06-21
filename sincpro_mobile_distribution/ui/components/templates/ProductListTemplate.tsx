import { Product } from "@sincpro/mobile-distribution/domain/product";
import { PriceListID } from "@sincpro/mobile-distribution/domain/product/price_list";
import { ProductRow } from "@sincpro/mobile-distribution/ui/components/organisms";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { Children, isValidElement, ReactElement, ReactNode } from "react";

interface ProductListTemplateProps {
  products: Product[];
  isLoading: boolean;
  priceListId?: PriceListID;
  title: string;
  description?: string;
  onSearch: (query: string) => void;
  onRefresh: () => void | Promise<void>;
  onSelect: (product: Product) => void;
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

function ProductListTemplateRoot({
  products,
  isLoading,
  title,
  description,
  onSearch,
  onRefresh,
  onSelect,
  onBack,
  children,
}: ProductListTemplateProps) {
  let headerActionsSlot: ReactNode = null;
  let filtersSlot: ReactNode = null;
  let footerSlot: ReactNode = null;
  let floatingButtonSlot: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const element = child as ReactElement<SlotProps>;
    if (child.type === HeaderActions) {
      headerActionsSlot = element.props.children;
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
      items={products}
      name={title}
      onBack={onBack}
      onRefresh={async () => {
        await onRefresh();
      }}
      onSearch={onSearch}
    >
      <ListViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER}>
        <ListViewV2.Header.Search />
        {filtersSlot && <ListViewV2.Header.Filters>{filtersSlot}</ListViewV2.Header.Filters>}
        {headerActionsSlot && (
          <ListViewV2.Header.Actions>{headerActionsSlot}</ListViewV2.Header.Actions>
        )}
      </ListViewV2.Header>

      <ListViewV2.Content>
        {(product: Product) => (
          <ProductRow onPress={() => onSelect(product)} product={product} />
        )}
      </ListViewV2.Content>

      {footerSlot && <ListViewV2.Footer>{footerSlot}</ListViewV2.Footer>}

      {floatingButtonSlot && (
        <ListViewV2.FloatingButton>{floatingButtonSlot}</ListViewV2.FloatingButton>
      )}
    </ListViewV2.Root>
  );
}

export const ProductListTemplate = Object.assign(ProductListTemplateRoot, {
  HeaderActions,
  Filters,
  Footer,
  FloatingButton,
});
