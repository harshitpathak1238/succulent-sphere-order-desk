export type ProductPrice = {
  amount: number;
  currencyCode: string;
};

export type Product = {
  id: string;
  name: string;
  image: string | null;
  price: ProductPrice | null;
  availableForSale: boolean;
};

export type ProductsResponse = {
  products: Product[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  source: "shopify" | "fallback";
};

export type PaymentType = "Prepaid" | "COD";

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  image: string;
};

export type CreateOrderInput = {
  orderId: string;
  customerName?: string;
  paymentType: PaymentType;
  items: OrderItem[];
};

export type OrderRecord = {
  id: string;
  orderId: string;
  customerName: string;
  paymentType: PaymentType;
  items: OrderItem[];
  totalItems: number;
  createdAt: string;
};
