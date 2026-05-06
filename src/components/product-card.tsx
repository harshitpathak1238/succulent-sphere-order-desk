/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
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
  const [blockedTapCount, setBlockedTapCount] = useState(0);
  const formattedPrice = formatCurrency(product.price);
  const outOfStock = !product.availableForSale;

  const handleCardClick = () => {
    if (outOfStock && !selected) {
      setBlockedTapCount((current) => current + 1);
      return;
    }

    onToggle();
  };

  return (
    <motion.button
      layout
      type="button"
      whileHover={outOfStock ? undefined : { y: -4 }}
      whileTap={{ scale: 0.985 }}
      animate={
        blockedTapCount > 0
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.34, ease: "easeInOut" }}
      onClick={handleCardClick}
      aria-disabled={outOfStock && !selected}
      className={cn(
        "surface-card-strong group relative overflow-hidden rounded-[2rem] border p-3 text-left",
        outOfStock && !selected && "cursor-not-allowed",
        selected
          ? "border-emerald-400 shadow-[0_20px_48px_rgba(21,180,108,0.18)]"
          : "border-white/70 hover:border-emerald-200",
        outOfStock &&
          !selected &&
          "border-slate-200 bg-slate-50/90 text-slate-400 saturate-0",
      )}
    >
      <div className="relative overflow-hidden rounded-[1.6rem] bg-[#ebe4d8]">
        <img
          src={product.image ?? "/product-placeholder.svg"}
          alt={product.name}
          className={cn(
            "aspect-square w-full object-cover transition duration-300",
            outOfStock ? "opacity-70" : "group-hover:scale-[1.02]",
          )}
        />
        <div
          className={cn(
            "absolute right-3 top-3 flex size-11 items-center justify-center rounded-full shadow-lg",
            selected
              ? "bg-emerald-500 text-white"
              : outOfStock
                ? "bg-slate-200/95 text-slate-500"
              : "bg-white/90 text-slate-400",
          )}
        >
          <Check className="size-5" />
        </div>
        {outOfStock ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
            Sold Out
          </div>
        ) : null}
      </div>

      <div className="px-2 pb-2 pt-4">
        <h4 className="line-clamp-2 min-h-12 text-base font-semibold leading-6 text-slate-950 sm:min-h-14 sm:text-lg sm:leading-7">
          {product.name}
        </h4>
        {formattedPrice ? (
          <p
            className={cn(
              "mt-1 text-xl font-semibold sm:text-2xl",
              outOfStock ? "text-slate-400" : "text-emerald-700",
            )}
          >
            {formattedPrice}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-400">Price hidden</p>
        )}

        {mode === "quantity" && selected ? (
          <div
            className={cn(
              "mt-4 flex items-center justify-between rounded-2xl px-3 py-2",
              outOfStock ? "bg-slate-100" : "bg-emerald-50",
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.24em]",
                outOfStock ? "text-slate-500" : "text-emerald-700",
              )}
            >
              {outOfStock ? "Unavailable" : "Quantity"}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDecrease}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border bg-white",
                  outOfStock
                    ? "border-slate-200 text-slate-500"
                    : "border-emerald-200 text-emerald-700",
                )}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={onIncrease}
                disabled={outOfStock}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border bg-white",
                  outOfStock
                    ? "cursor-not-allowed border-slate-200 text-slate-300"
                    : "border-emerald-200 text-emerald-700",
                )}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        ) : mode === "quantity" ? (
          <div
            className={cn(
              "mt-4 rounded-2xl border px-3 py-3 text-xs font-medium uppercase tracking-[0.24em]",
              outOfStock
                ? "border-slate-200 bg-slate-100/80 text-slate-500"
                : "border-dashed border-slate-200 text-slate-400",
            )}
          >
            {outOfStock ? "Out of stock" : "Tap to add"}
          </div>
        ) : null}
      </div>
    </motion.button>
  );
}
