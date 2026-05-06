import type { Product } from "@/lib/types";

export const GIFT_PRODUCT_ID = "gift-complimentary";

export const GIFT_PRODUCT: Product = {
  id: GIFT_PRODUCT_ID,
  name: "Complimentary Gift",
  image: "/gift-product.svg",
  price: null,
  availableForSale: true,
  kind: "gift",
};
