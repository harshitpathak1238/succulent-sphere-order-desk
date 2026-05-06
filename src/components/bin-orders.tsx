"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getFirebaseConfigState } from "@/lib/firebase/config";
import {
  getDeletedOrders,
  permanentlyDeleteOrder,
  restoreOrderFromBin,
} from "@/lib/firebase/orders";
import type { OrderRecord } from "@/lib/types";
import { formatOrderDate } from "@/lib/utils";

type BinActionState =
  | {
      kind: "restore" | "delete";
      order: OrderRecord;
    }
  | null;

export function BinOrders() {
  const firebaseReady = getFirebaseConfigState();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(firebaseReady);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<BinActionState>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const loadOrders = async () => {
      try {
        const nextOrders = await getDeletedOrders();
        setOrders(nextOrders);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load bin orders.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [firebaseReady]);

  const closeDialog = () => {
    if (busyOrderId) {
      return;
    }

    setActionState(null);
  };

  const restoreOrder = async (order: OrderRecord) => {
    setBusyOrderId(order.id);

    try {
      await restoreOrderFromBin(order.id);
      setOrders((current) => current.filter((currentOrder) => currentOrder.id !== order.id));
      setActionState(null);
      toast.success(`Order ${order.orderId} restored.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to restore the order.",
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const deleteOrder = async (order: OrderRecord) => {
    setBusyOrderId(order.id);

    try {
      await permanentlyDeleteOrder(order.id);
      setOrders((current) => current.filter((currentOrder) => currentOrder.id !== order.id));
      setActionState(null);
      toast.success(`Order ${order.orderId} deleted permanently.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete the order permanently.",
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <section className="surface-card rounded-[2rem] border border-white/60 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600">
            Bin
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Review deleted legacy orders.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Restore orders back to the active list or remove them permanently from
            Firebase when you are fully sure.
          </p>
        </section>

        <section className="surface-card overflow-hidden rounded-[2rem] border border-white/60">
          <div className="border-b border-slate-200/70 px-6 py-5">
            <p className="text-sm font-semibold text-slate-900">Deleted Legacy Orders</p>
            <p className="mt-1 text-sm text-slate-500">
              Soft-deleted orders from the Legacy Builder live here until restored or
              deleted permanently.
            </p>
          </div>

          {!firebaseReady ? (
            <div className="p-8 text-sm text-slate-500">
              Firebase is not configured, so bin orders cannot be loaded.
            </div>
          ) : loading ? (
            <div className="p-8 text-sm text-slate-500">Loading bin orders...</div>
          ) : error ? (
            <div className="p-8 text-sm text-rose-600">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">Bin is empty.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[880px] w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    {[
                      "Order ID",
                      "Customer",
                      "Payment",
                      "Items",
                      "Deleted At",
                      "Actions",
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
                      <td className="px-4 py-4">
                        {order.customerName || "Walk-in / Not added"}
                      </td>
                      <td className="px-4 py-4">{order.paymentType}</td>
                      <td className="px-4 py-4">{order.totalItems} items</td>
                      <td className="px-4 py-4">
                        {order.deletedAt ? formatOrderDate(order.deletedAt) : "Unknown"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <Link
                            href={`/orders/${encodeURIComponent(order.id)}`}
                            className="font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => setActionState({ kind: "restore", order })}
                            className="inline-flex items-center gap-2 font-semibold text-sky-700 hover:text-sky-800"
                          >
                            <RotateCcw className="size-4" />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionState({ kind: "delete", order })}
                            className="inline-flex items-center gap-2 font-semibold text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="size-4" />
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={actionState !== null}
        title={
          actionState?.kind === "restore"
            ? "Restore this order?"
            : "Delete permanently?"
        }
        description={
          actionState?.kind === "restore"
            ? `Order ${actionState.order.orderId} will move back to the active orders list.`
            : `Order ${actionState?.order.orderId} will be removed forever and cannot be restored later.`
        }
        confirmLabel={actionState?.kind === "restore" ? "Yes, Restore" : "Yes, Delete"}
        confirmTone={actionState?.kind === "restore" ? "default" : "danger"}
        busy={busyOrderId !== null}
        onCancel={closeDialog}
        onConfirm={() => {
          if (!actionState) {
            return;
          }

          if (actionState.kind === "restore") {
            void restoreOrder(actionState.order);
            return;
          }

          void deleteOrder(actionState.order);
        }}
      />
    </>
  );
}
