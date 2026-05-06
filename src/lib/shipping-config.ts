import type {
  SellerSettings,
  SessionOrderRecord,
  ShipmentDraft,
} from "@/lib/types";

export const SESSION_ORDER_HISTORY_KEY = "succulent-sphere-session-orders";
export const SELLER_SETTINGS_KEY = "succulent-sphere-seller-settings";
export const LAST_ORDER_ID_KEY = "succulent-sphere-last-order-id";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const DEFAULT_SELLER_SETTINGS: SellerSettings = {
  sellerGstTin: "",
  hsnCode: "0602",
  pickupLocationName: "",
  pickupLocationAddress: "",
};

export const DEFAULT_SHIPMENT_DRAFT: ShipmentDraft = {
  customerName: "",
  phone: "",
  email: "",
  address: "",
  pincode: "",
  city: "",
  state: "",
  orderId: "",
  manualAmount: "",
  channel: "Default Channel",
  paymentMode: "Prepaid",
  shippingTarget: "pending_awb_shopify",
  packaging: {
    packageType: "Cardboard Box",
    lengthCm: 14,
    breadthCm: 12,
    heightCm: 12,
    weightGrams: 450,
    fragile: false,
  },
  sellerSettings: DEFAULT_SELLER_SETTINGS,
};

export function getNextOrderId(lastUsedOrderId: string | null) {
  if (!lastUsedOrderId) {
    return "SS-101";
  }

  const match = lastUsedOrderId.match(/^(.*?)(\d+)$/);

  if (!match) {
    return "SS-101";
  }

  const [, prefix, numberPart] = match;
  const nextNumber = String(Number(numberPart) + 1).padStart(numberPart.length, "0");

  return `${prefix}${nextNumber}`;
}

export function toCsv(records: SessionOrderRecord[]) {
  const headers = [
    "Order ID",
    "Customer",
    "Pincode",
    "Product",
    "Amount",
    "Payment",
    "AWB Number",
    "Status",
    "Created At",
  ];

  const rows = records.map((record) => [
    record.orderId,
    record.customerName,
    record.pincode,
    record.productSummary,
    record.amount.toFixed(2),
    record.payment,
    record.awbNumber,
    record.status,
    record.createdAt,
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
}

export function downloadCsv(records: SessionOrderRecord[], filename: string) {
  const blob = new Blob([toCsv(records)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getStorage(storageType: "local" | "session") {
  if (typeof window === "undefined") {
    return null;
  }

  return storageType === "local" ? window.localStorage : window.sessionStorage;
}

export function readJsonStorage<T>(
  key: string,
  fallback: T,
  storageType: "local" | "session" = "local",
) {
  const storage = getStorage(storageType);

  if (!storage) {
    return fallback;
  }

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage<T>(
  key: string,
  value: T,
  storageType: "local" | "session" = "local",
) {
  const storage = getStorage(storageType);

  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}
