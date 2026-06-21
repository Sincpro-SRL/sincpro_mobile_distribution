import { Product } from "@sincpro/mobile-distribution/domain/product";
import { Display } from "@sincpro/mobile-ui/Display";
import BoxIcon from "@sincpro/mobile-ui/icons/BoxIcon";
import { ListViewV2 } from "@sincpro/mobile-ui/views/ListViewV2";
import { View } from "react-native";

import { ProductStockBadge } from "../molecules";

interface ProductRowProps {
  product: Product;
  onPress?: () => void;
  currencySymbol?: string;
}

export function ProductRow({ product, onPress, currencySymbol }: ProductRowProps) {
  return (
    <ListViewV2.Content.Row onPress={onPress}>
      <ListViewV2.Content.Row.Avatar>
        <View className="justify-center items-center p-2 rounded-lg bg-bg-muted">
          <Display.Icon customIcon={BoxIcon} size={40} type="custom" />
        </View>
      </ListViewV2.Content.Row.Avatar>

      <ListViewV2.Content.Row.Content>
        <ListViewV2.Content.Row.Title
          numberOfLines={2}
          rightComponent={
            <ProductStockBadge inStock={product.inStock} showOnlyOutOfStock={false} />
          }
        >
          {product.name}
        </ListViewV2.Content.Row.Title>

        <ListViewV2.Content.Row.Subtitle>
          {product.code || "N/A"}
        </ListViewV2.Content.Row.Subtitle>

        <ListViewV2.Content.Row.Subtitle>
          Cantidad: {product.quantity} {product.getUnitOfMeasure}
        </ListViewV2.Content.Row.Subtitle>

        <ListViewV2.Content.Row.Footer>
          <Display.Monetary currencySymbol={currencySymbol} value={product.price} />
        </ListViewV2.Content.Row.Footer>
      </ListViewV2.Content.Row.Content>
    </ListViewV2.Content.Row>
  );
}
