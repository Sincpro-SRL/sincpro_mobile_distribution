import { Product } from "@sincpro/mobile-distribution/domain/product";
import { PriceListID } from "@sincpro/mobile-distribution/domain/product/price_list";
import { ProductInfoCard } from "@sincpro/mobile-distribution/ui/components/molecules";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { EVariantScreenHeader } from "@sincpro/mobile-ui/widgets/ScreenHeader";
import { Children, isValidElement, ReactElement, ReactNode } from "react";

export interface IProductDetailPayload {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface ProductDetailTemplateProps {
  product: Product;
  isLoading: boolean;
  priceListId?: PriceListID;
  title: string;
  description?: string;
  onBack: () => void;
  children?: ReactNode;
}

interface SlotProps {
  children: ReactNode;
}

function Footer({ children }: SlotProps) {
  return <>{children}</>;
}

function ProductDetailTemplateRoot({
  product,
  isLoading,
  priceListId,
  title,
  description,
  onBack,
  children,
}: ProductDetailTemplateProps) {
  let footerSlot: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const element = child as ReactElement<SlotProps>;
    if (child.type === Footer) {
      footerSlot = element.props.children;
    }
  });

  return (
    <FormViewV2.Root
      description={description ?? product?.category ?? ""}
      isEmpty={!product}
      isLoading={isLoading}
      item={product}
      name={title}
      onBack={onBack}
    >
      <FormViewV2.Header variant={EVariantScreenHeader.FLAT_HEADER} />

      <FormViewV2.Content>
        <FormViewV2.Content.Form>
          <ProductInfoCard
            category={product?.category}
            description={product?.description}
            name={product?.name}
            price={product?.price ?? 0}
            priceListId={priceListId}
            priceMap={product?.priceMap}
            quantity={product?.quantity}
            taxFactor={product?.taxFactor}
            uomName={product?.uomName}
          />
        </FormViewV2.Content.Form>
      </FormViewV2.Content>

      {footerSlot && <FormViewV2.Footer>{footerSlot}</FormViewV2.Footer>}
    </FormViewV2.Root>
  );
}

export const ProductDetailTemplate = Object.assign(ProductDetailTemplateRoot, {
  Footer,
});
