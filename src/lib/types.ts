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
  kind?: "catalog" | "gift";
  sku?: string | null;
  category?: string | null;
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
  deletedAt: string | null;
};

export type ShippingTarget = "pending_awb_shopify" | "ready_to_ship";

export type ShippingChannel = "Default Channel" | "Shopify" | "Manual";

export type SubmissionStatus =
  | "Pending AWB via Shopify"
  | "Ready to Ship"
  | "Failed";

export type ParsedWhatsAppMessage = {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  amountHint: number | null;
  rawText: string;
};

export type PackagingDetails = {
  packageType: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  weightGrams: number;
  fragile: boolean;
};

export type SellerSettings = {
  sellerGstTin: string;
  hsnCode: string;
  pickupLocationName: string;
  pickupLocationAddress: string;
};

export type ShipmentDraft = {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  orderId: string;
  manualAmount: string;
  channel: ShippingChannel;
  paymentMode: PaymentType;
  shippingTarget: ShippingTarget;
  packaging: PackagingDetails;
  sellerSettings: SellerSettings;
};

export type SessionOrderRecord = {
  id: string;
  orderId: string;
  customerName: string;
  pincode: string;
  productSummary: string;
  amount: number;
  payment: PaymentType;
  awbNumber: string;
  status: SubmissionStatus;
  createdAt: string;
  destination: ShippingTarget;
};
