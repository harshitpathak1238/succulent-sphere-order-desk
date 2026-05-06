"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FilePlus2, Loader2 } from "lucide-react";
import { getFirebaseConfigState } from "@/lib/firebase/config";
import { getOrders } from "@/lib/firebase/orders";
import type { OrderRecord } from "@/lib/types";
import { formatOrderDate } from "@/lib/utils";

export function OrdersList() {
  const firebaseReady = getFirebaseConfigState();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(firebaseReady);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const loadOrders = async () => {
      setLoading(true);

      try {
        const nextOrders = await getOrders();
        setOrders(nextOrders);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load orders.",
        );
      } finally {
        setLoading(false);
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
              Orders List
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              All saved orders in one clean queue.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Open any order to copy a packing slip, print it, or double-check
              the items before dispatch.
            </p>
          </div>

          <Link
            href="/orders/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 sm:w-auto"
          >
            <FilePlus2 className="size-4" />
            Create Order
          </Link>
        </div>

        {!firebaseReady ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
            Add your Firebase env values to load live orders from Firestore.
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="surface-card rounded-[2rem] border border-white/60 p-8 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <Loader2 className="size-4 animate-spin" />
              Loading orders...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50/90 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="surface-card rounded-[2rem] border border-white/60 p-8 text-sm text-slate-500">
            No orders yet. Create your first order to start building the packing
            history.
          </div>
        ) : (
          orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link
                href={`/orders/${encodeURIComponent(order.id)}`}
                className="surface-card block rounded-[2rem] border border-white/60 p-5 hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      Order #{order.orderId}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.paymentType} | {order.totalItems} items |{" "}
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    Open packing slip
                    <ArrowRight className="size-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </section>
    </div>
  );
}
