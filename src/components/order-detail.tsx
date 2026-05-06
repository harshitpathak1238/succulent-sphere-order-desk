"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clipboard, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { getFirebaseConfigState } from "@/lib/firebase/config";
import { getOrderById } from "@/lib/firebase/orders";
import type { OrderRecord } from "@/lib/types";
import { buildPackingSlip, formatOrderDate } from "@/lib/utils";

type OrderDetailProps = {
  orderDocumentId: string;
};

export function OrderDetail({ orderDocumentId }: OrderDetailProps) {
  const firebaseReady = getFirebaseConfigState();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(firebaseReady);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const loadOrder = async () => {
      setLoading(true);

      try {
        const nextOrder = await getOrderById(orderDocumentId);

        if (!nextOrder) {
          setError("Order not found.");
          setOrder(null);
          return;
        }

        setOrder(nextOrder);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the order.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [firebaseReady, orderDocumentId]);

  const copySlip = async () => {
    if (!order) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildPackingSlip(order));
      toast.success("Packing slip copied to clipboard.");
    } catch {
      toast.error("Unable to copy right now.");
    }
  };

  const printOrder = () => {
    window.print();
  };

  if (!firebaseReady) {
    return (
      <div className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-6 text-sm text-amber-900">
        Add your Firebase env values to load live order details from Firestore.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="surface-card rounded-[2rem] border border-white/60 p-8 text-sm text-slate-500">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Loading order...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50/90 p-6 text-sm text-rose-700">
          {error ?? "Order not found."}
        </div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Packing Slip
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Order #{order.orderId}
          </h2>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={copySlip}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto"
          >
            <Clipboard className="size-4" />
            Copy to Clipboard
          </button>
          <button
            type="button"
            onClick={printOrder}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            <Printer className="size-4" />
            Print Order
          </button>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card print-surface print-page rounded-[2rem] border border-white/60 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              Succulent Sphere
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950">
              Order #{order.orderId}
            </h3>
          </div>

          <div className="text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Customer:</span>{" "}
              {order.customerName || "Walk-in / Not added"}
            </p>
            <p className="mt-2">
              <span className="font-semibold text-slate-900">Payment:</span>{" "}
              {order.paymentType}
            </p>
            <p className="mt-2">
              <span className="font-semibold text-slate-900">Created:</span>{" "}
              {formatOrderDate(order.createdAt)}
            </p>
          </div>
        </div>

        <ol className="mt-8 space-y-4">
          {order.items.map((item, index) => (
            <li
              key={`${item.productId}-${index}`}
              className="relative rounded-[1.6rem] border border-slate-200/80 bg-white/90 px-4 py-4"
            >
              <div className="flex min-w-0 items-start gap-4 pr-14">
                <div className="relative w-[5.5rem] shrink-0 pt-12 sm:w-28">
                  <span className="absolute left-0 top-0 z-10 flex size-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 shadow-sm">
                    {index + 1}
                  </span>
                  <img
                    src={item.image || "/product-placeholder.svg"}
                    alt={item.productName}
                    loading="lazy"
                    className="size-[5.5rem] rounded-2xl border border-slate-200/80 bg-slate-50 object-cover sm:size-28"
                  />
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <p className="break-words text-base font-semibold leading-6 text-slate-950 sm:text-lg sm:leading-7">
                    {item.productName}
                  </p>
                </div>
              </div>

              <div className="absolute right-4 top-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                x {item.quantity}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200/70 pt-6">
          <p className="text-lg font-semibold text-slate-600">Total</p>
          <p className="text-2xl font-semibold text-slate-950">
            {order.totalItems} items
          </p>
        </div>
      </motion.section>
    </div>
  );
}
