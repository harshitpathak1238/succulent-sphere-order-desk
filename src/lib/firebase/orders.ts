import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/config";
import type { CreateOrderInput, OrderItem, OrderRecord } from "@/lib/types";
import { normalizeOrderDocumentId } from "@/lib/utils";

function serializeOrderItems(items: OrderItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    image: item.image,
  }));
}

function mapOrderSnapshot(id: string, data: Record<string, unknown>): OrderRecord {
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : null;

  return {
    id,
    orderId: String(data.orderId ?? id),
    customerName: String(data.customerName ?? ""),
    paymentType: data.paymentType === "COD" ? "COD" : "Prepaid",
    items: Array.isArray(data.items) ? (data.items as OrderItem[]) : [],
    totalItems: Number(data.totalItems ?? 0),
    createdAt: createdAt
      ? createdAt.toDate().toISOString()
      : new Date().toISOString(),
  };
}

export async function createOrder(input: CreateOrderInput) {
  const db = getFirestoreDb();

  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const cleanOrderId = input.orderId.trim();

  if (!cleanOrderId) {
    throw new Error("Order ID is required.");
  }

  const items = serializeOrderItems(
    input.items.filter((item) => item.quantity > 0),
  );

  if (items.length === 0) {
    throw new Error("Select at least one product.");
  }

  const documentId = normalizeOrderDocumentId(cleanOrderId);
  const orderRef = doc(db, "orders", documentId);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  await runTransaction(db, async (transaction) => {
    const existingOrder = await transaction.get(orderRef);

    if (existingOrder.exists()) {
      throw new Error(`Order ID "${cleanOrderId}" already exists.`);
    }

    transaction.set(orderRef, {
      orderId: cleanOrderId,
      customerName: input.customerName?.trim() ?? "",
      paymentType: input.paymentType,
      items,
      totalItems,
      createdAt: Timestamp.now(),
    });
  });

  return documentId;
}

export async function getOrders() {
  const db = getFirestoreDb();

  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs.map((orderDoc) =>
    mapOrderSnapshot(orderDoc.id, orderDoc.data() as Record<string, unknown>),
  );
}

export async function getOrderById(orderDocumentId: string) {
  const db = getFirestoreDb();

  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const snapshot = await getDoc(doc(db, "orders", orderDocumentId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapOrderSnapshot(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}
