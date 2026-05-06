import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderRecord, ProductPrice } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(price: ProductPrice | null | undefined) {
  if (!price) {
    return null;
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: price.currencyCode || "INR",
      maximumFractionDigits: 2,
    }).format(price.amount);
  } catch {
    return `${price.currencyCode} ${price.amount.toFixed(2)}`;
  }
}

export function normalizeOrderDocumentId(orderId: string) {
  return orderId
    .trim()
    .toLowerCase()
    .replace(/[/.#$[\]]+/g, "-")
    .replace(/\s+/g, "-");
}

export function formatOrderDate(isoDate: string) {
  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function buildPackingSlip(order: OrderRecord) {
  const header = [
    `Order #${order.orderId}`,
    `Customer: ${order.customerName || "Walk-in / Not added"}`,
    `Payment: ${order.paymentType}`,
    "",
  ];

  const items = order.items.map(
    (item, index) => `${index + 1}. ${item.productName} x ${item.quantity}`,
  );

  return [...header, ...items, "", `Total: ${order.totalItems} items`].join(
    "\n",
  );
}
