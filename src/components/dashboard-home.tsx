"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ClipboardList, PackagePlus } from "lucide-react";
import {
  ProductBrowser,
  type SelectedProductMap,
} from "@/components/product-browser";
import { DRAFT_ORDER_SEED_KEY } from "@/lib/constants";
import type { Product } from "@/lib/types";

export function DashboardHome() {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductMap>(
    {},
  );

  const selectedCount = useMemo(
    () => Object.keys(selectedProducts).length,
    [selectedProducts],
  );

  const toggleProduct = (product: Product) => {
    setSelectedProducts((current) => {
      if (current[product.id]) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }

      return {
        ...current,
        [product.id]: {
          product,
          quantity: 1,
        },
      };
    });
  };

  const createOrder = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        DRAFT_ORDER_SEED_KEY,
        JSON.stringify(Object.values(selectedProducts)),
      );
    }

    router.push("/orders/new");
  };

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]"
      >
        <div className="surface-card rounded-[2rem] border border-white/60 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Daily Order Workflow
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Build WhatsApp orders quickly and hand your packaging team a clean
            packing slip.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Browse Shopify products, pick the plants for the conversation
            you&apos;re converting, and jump straight into a manual order form
            designed for speed.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={createOrder}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5"
            >
              <PackagePlus className="size-4" />
              {selectedCount > 0
                ? `Create Order (${selectedCount} selected)`
                : "Create Order"}
            </button>

            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-100 hover:bg-white"
            >
              <ClipboardList className="size-4" />
              View Orders
            </Link>
          </div>
        </div>

        <div className="surface-card rounded-[2rem] border border-white/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Ready Today
          </p>
          <div className="mt-5 grid gap-4">
            <div className="rounded-[1.5rem] border border-white/60 bg-white/80 p-4">
              <p className="text-sm text-slate-500">Selected Products</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {selectedCount}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/60 bg-white/80 p-4">
              <p className="text-sm text-slate-500">Next Step</p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                Add order ID, payment type, and quantities.
              </p>
              <button
                type="button"
                onClick={createOrder}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
              >
                Open order builder
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <ProductBrowser
        title="Product Catalog"
        description="Tap any product to mark it for the next order. The card style follows the clean Shopify-inspired selection state you shared."
        selectedProducts={selectedProducts}
        selectionMode="toggle"
        onToggleProduct={toggleProduct}
        selectedUnitsCount={selectedCount}
      />
    </div>
  );
}
