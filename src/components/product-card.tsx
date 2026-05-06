/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { Check, Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  selected: boolean;
  quantity: number;
  mode: "toggle" | "quantity";
  onToggle: () => void;
  onIncrease?: () => void;
  onDecrease?: () => void;
};

export function ProductCard({
  product,
  selected,
  quantity,
  mode,
  onToggle,
  onIncrease,
  onDecrease,
}: ProductCardProps) {
  const formattedPrice = formatCurrency(product.price);

  return (
    <motion.button
      layout
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onToggle}
      className={cn(
        "surface-card-strong group relative overflow-hidden rounded-[2rem] border p-3 text-left",
        selected
          ? "border-emerald-400 shadow-[0_20px_48px_rgba(21,180,108,0.18)]"
          : "border-white/70 hover:border-emerald-200",
      )}
    >
      <div className="relative overflow-hidden rounded-[1.6rem] bg-[#ebe4d8]">
        <img
          src={product.image ?? "/product-placeholder.svg"}
          alt={product.name}
          className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        <div
          className={cn(
            "absolute right-3 top-3 flex size-11 items-center justify-center rounded-full shadow-lg",
            selected
              ? "bg-emerald-500 text-white"
              : "bg-white/90 text-slate-400",
          )}
        >
          <Check className="size-5" />
        </div>
      </div>

      <div className="px-2 pb-2 pt-4">
        <h4 className="line-clamp-2 min-h-14 text-lg font-semibold leading-7 text-slate-950">
          {product.name}
        </h4>
        {formattedPrice ? (
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {formattedPrice}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-400">Price hidden</p>
        )}

        {mode === "quantity" && selected ? (
          <div
            className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Quantity
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDecrease}
                className="flex size-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={onIncrease}
                className="flex size-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        ) : mode === "quantity" ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-3 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
            Tap to add
          </div>
        ) : null}
      </div>
    </motion.button>
  );
}
