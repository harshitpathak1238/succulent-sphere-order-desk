"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ReceiptText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  ProductBrowser,
  type SelectedProductMap,
} from "@/components/product-browser";
import { DRAFT_ORDER_SEED_KEY } from "@/lib/constants";
import { getFirebaseConfigState } from "@/lib/firebase/config";
import { createOrder } from "@/lib/firebase/orders";
import type { PaymentType, Product } from "@/lib/types";

type SeedEntry = {
  product: Product;
  quantity: number;
};

const paymentOptions: Array<{
  label: PaymentType;
}> = [{ label: "Prepaid" }, { label: "COD" }];

function getSeededProducts(): SelectedProductMap {
  if (typeof window === "undefined") {
    return {};
  }

  const draftSeed = window.sessionStorage.getItem(DRAFT_ORDER_SEED_KEY);

  if (!draftSeed) {
    return {};
  }

  try {
    const parsedSeed = JSON.parse(draftSeed) as SeedEntry[];

    return parsedSeed.reduce<SelectedProductMap>((accumulator, entry) => {
      accumulator[entry.product.id] = {
        product: entry.product,
        quantity: Math.max(1, entry.quantity || 1),
      };

      return accumulator;
    }, {});
  } catch {
    window.sessionStorage.removeItem(DRAFT_ORDER_SEED_KEY);
    return {};
  }
}

export function OrderForm() {
  const router = useRouter();
  const firebaseReady = getFirebaseConfigState();
  const [orderId, setOrderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("Prepaid");
  const [selectedProducts, setSelectedProducts] =
    useState<SelectedProductMap>(getSeededProducts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalItems = useMemo(
    () =>
      Object.values(selectedProducts).reduce(
        (sum, entry) => sum + entry.quantity,
        0,
      ),
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

  const increaseQuantity = (product: Product) => {
    setSelectedProducts((current) => {
      const entry = current[product.id];

      if (!entry) {
        return {
          ...current,
          [product.id]: {
            product,
            quantity: 1,
          },
        };
      }

      return {
        ...current,
        [product.id]: {
          ...entry,
          quantity: entry.quantity + 1,
        },
      };
    });
  };

  const decreaseQuantity = (product: Product) => {
    setSelectedProducts((current) => {
      const entry = current[product.id];

      if (!entry) {
        return current;
      }

      if (entry.quantity <= 1) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }

      return {
        ...current,
        [product.id]: {
          ...entry,
          quantity: entry.quantity - 1,
        },
      };
    });
  };

  const submitOrder = () => {
    if (!orderId.trim()) {
      toast.error("Order ID is required.");
      return;
    }

    if (totalItems === 0) {
      toast.error("Select at least one product before submitting.");
      return;
    }

    if (!firebaseReady) {
      toast.error("Firebase is not configured yet. Add your .env values first.");
      return;
    }

    const items = Object.values(selectedProducts).map((entry) => ({
      productId: entry.product.id,
      productName: entry.product.name,
      quantity: entry.quantity,
      image: entry.product.image ?? "/product-placeholder.svg",
    }));

    setIsSubmitting(true);

    void createOrder({
      orderId,
      customerName,
      paymentType,
      items,
    })
      .then((orderDocumentId) => {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(DRAFT_ORDER_SEED_KEY);
        }

        toast.success("Order created successfully.");
        router.push(`/orders/${encodeURIComponent(orderDocumentId)}`);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Unable to create the order.",
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card rounded-[2rem] border border-white/60 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Create Order
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Turn a WhatsApp chat into a packing-ready order.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Fill the order basics, choose products, adjust quantities, and submit
            when the list matches the conversation.
          </p>

          {!firebaseReady ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
              Firebase isn&apos;t configured yet. You can explore the UI, but
              order submission will stay disabled until the `.env` values are
              added.
            </div>
          ) : null}
        </div>

        <div className="surface-card rounded-[2rem] border border-white/60 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ReceiptText className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Order Summary
              </p>
              <h3 className="text-lg font-semibold text-slate-900">
                {totalItems} items selected
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Order ID
              </span>
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="ex. SS-1024"
                className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Customer Name
              </span>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Optional"
                className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Type
              </span>
              <div className="grid grid-cols-2 gap-3">
                {paymentOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setPaymentType(option.label)}
                    className={
                      paymentType === option.label
                        ? "rounded-2xl border border-emerald-500 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
                        : "rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700"
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-4" />
                Duplicate order IDs are blocked automatically.
              </div>
              <p className="mt-2 text-emerald-800/90">
                Each order uses a normalized document key in Firestore, so the
                same ID cannot be saved twice by mistake.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductBrowser
        title="Select products and set quantities"
        description="The same grid stays fast on mobile, and selected products get inline quantity controls so your packing list stays accurate."
        selectedProducts={selectedProducts}
        selectionMode="quantity"
        onToggleProduct={toggleProduct}
        onIncreaseQuantity={increaseQuantity}
        onDecreaseQuantity={decreaseQuantity}
        selectedUnitsCount={totalItems}
      />

      <div className="surface-card rounded-[2rem] border border-white/60 p-5">
        <h3 className="text-lg font-semibold text-slate-950">Selected items</h3>
        <div className="mt-4 space-y-3">
          {Object.values(selectedProducts).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
              No products selected yet.
            </div>
          ) : (
            Object.values(selectedProducts).map((entry) => (
              <div
                key={entry.product.id}
                className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {entry.product.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    Quantity: {entry.quantity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleProduct(entry.product)}
                  className="text-sm font-semibold text-rose-600"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 left-4 right-4 z-20 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto"
      >
        <button
          type="button"
          onClick={submitOrder}
          disabled={
            isSubmitting || totalItems === 0 || !orderId.trim() || !firebaseReady
          }
          className="flex w-full items-center justify-center gap-3 rounded-[1.6rem] bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_48px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[240px]"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Submit Order
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs">
            {totalItems} items
          </span>
        </button>
      </motion.div>
    </div>
  );
}
