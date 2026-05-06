"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FilePlus2 } from "lucide-react";
import {
  SESSION_ORDER_HISTORY_KEY,
  downloadCsv,
  readJsonStorage,
} from "@/lib/shipping-config";
import { getFirebaseConfigState } from "@/lib/firebase/config";
import { getOrders } from "@/lib/firebase/orders";
import type { OrderRecord, SessionOrderRecord } from "@/lib/types";
import { formatOrderDate } from "@/lib/utils";

export function OrdersList() {
  const firebaseReady = getFirebaseConfigState();
  const [orders] = useState<SessionOrderRecord[]>(() =>
    readJsonStorage<SessionOrderRecord[]>(
      SESSION_ORDER_HISTORY_KEY,
      [],
      "session",
    ),
  );
  const [legacyOrders, setLegacyOrders] = useState<OrderRecord[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(firebaseReady);
  const [legacyError, setLegacyError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const loadOrders = async () => {
      try {
        const nextOrders = await getOrders();
        setLegacyOrders(nextOrders);
        setLegacyError(null);
      } catch (error) {
        setLegacyError(
          error instanceof Error ? error.message : "Unable to load legacy orders.",
        );
      } finally {
        setLegacyLoading(false);
      }
    };

    void loadOrders();
  }, [firebaseReady]);

  return (
    <div className="space-y-8">
      <section className="surface-card rounded-[2rem] border border-white/60 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Orders History
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Shipping and legacy orders in one place.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Session shipments from the dashboard and Firebase orders from the
              Legacy Builder are shown separately below.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() =>
                downloadCsv(orders, `session-orders-${new Date().toISOString()}.csv`)
              }
              disabled={orders.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Download className="size-4" />
              Download CSV
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 sm:w-auto"
            >
              <FilePlus2 className="size-4" />
              Create Order
            </Link>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden rounded-[2rem] border border-white/60">
        <div className="border-b border-slate-200/70 px-6 py-5">
          <p className="text-sm font-semibold text-slate-900">Shipping Dashboard Orders</p>
          <p className="mt-1 text-sm text-slate-500">
            Orders created from the main dashboard in this browser session.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">
            No session orders yet. Create an order from the dashboard to see it
            here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-950 text-white">
                <tr>
                  {[
                    "Order ID",
                    "Customer",
                    "Pincode",
                    "Product",
                    "Amount",
                    "Payment",
                    "AWB Number",
                    "Status",
                    "Created At",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-4 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={index % 2 === 0 ? "bg-white/80" : "bg-white/60"}
                  >
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {order.orderId}
                    </td>
                    <td className="px-4 py-4">{order.customerName}</td>
                    <td className="px-4 py-4">{order.pincode}</td>
                    <td className="max-w-xs px-4 py-4">{order.productSummary}</td>
                    <td className="px-4 py-4">₹{order.amount.toFixed(2)}</td>
                    <td className="px-4 py-4">{order.payment}</td>
                    <td className="px-4 py-4">
                      {order.awbNumber || "Pending"}
                    </td>
                    <td className="px-4 py-4">{order.status}</td>
                    <td className="px-4 py-4">
                      {formatOrderDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface-card overflow-hidden rounded-[2rem] border border-white/60">
        <div className="border-b border-slate-200/70 px-6 py-5">
          <p className="text-sm font-semibold text-slate-900">Legacy Builder Orders</p>
          <p className="mt-1 text-sm text-slate-500">
            Orders saved by the `/orders/new` flow and loaded from Firebase.
          </p>
        </div>

        {!firebaseReady ? (
          <div className="p-8 text-sm text-slate-500">
            Firebase is not configured, so legacy orders cannot be loaded.
          </div>
        ) : legacyLoading ? (
          <div className="p-8 text-sm text-slate-500">Loading legacy orders...</div>
        ) : legacyError ? (
          <div className="p-8 text-sm text-rose-600">{legacyError}</div>
        ) : legacyOrders.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">
            No legacy orders found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-950 text-white">
                <tr>
                  {[
                    "Order ID",
                    "Customer",
                    "Payment",
                    "Items",
                    "Created At",
                    "Open",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-4 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {legacyOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={index % 2 === 0 ? "bg-white/80" : "bg-white/60"}
                  >
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {order.orderId}
                    </td>
                    <td className="px-4 py-4">
                      {order.customerName || "Walk-in / Not added"}
                    </td>
                    <td className="px-4 py-4">{order.paymentType}</td>
                    <td className="px-4 py-4">{order.totalItems} items</td>
                    <td className="px-4 py-4">{formatOrderDate(order.createdAt)}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/orders/${encodeURIComponent(order.id)}`}
                        className="font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
