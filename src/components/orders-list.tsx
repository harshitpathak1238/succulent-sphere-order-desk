"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FilePlus2 } from "lucide-react";
import {
  SESSION_ORDER_HISTORY_KEY,
  downloadCsv,
  readJsonStorage,
} from "@/lib/shipping-config";
import type { SessionOrderRecord } from "@/lib/types";
import { formatOrderDate } from "@/lib/utils";

export function OrdersList() {
  const [orders] = useState<SessionOrderRecord[]>(() =>
    readJsonStorage<SessionOrderRecord[]>(
      SESSION_ORDER_HISTORY_KEY,
      [],
      "session",
    ),
  );

  return (
    <div className="space-y-8">
      <section className="surface-card rounded-[2rem] border border-white/60 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Orders History
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Orders created in this session.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Track created shipments, copy the session as CSV, and keep a quick
              view of AWB or Pending AWB references.
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
    </div>
  );
}
