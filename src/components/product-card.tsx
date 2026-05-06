/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type KeyboardEvent } from "react";
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
  const isGift = product.kind === "gift";

  const handleCardClick = () => {
    if (outOfStock && !selected) {
      setBlockedTapCount((current) => current + 1);
      return;
    }

    onToggle();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleCardClick();
  };

  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      whileHover={outOfStock ? undefined : { y: -4 }}
      whileTap={{ scale: 0.985 }}
      animate={
        blockedTapCount > 0
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.34, ease: "easeInOut" }}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      aria-disabled={outOfStock && !selected}
      aria-pressed={selected}
      className={cn(
        "surface-card-strong group relative overflow-hidden rounded-[1.6rem] border p-2.5 text-left sm:rounded-[2rem] sm:p-3",
        outOfStock && !selected && "cursor-not-allowed",
        selected
          ? "border-emerald-400 shadow-[0_20px_48px_rgba(21,180,108,0.18)]"
          : "border-white/70 hover:border-emerald-200",
        outOfStock &&
          !selected &&
          "border-slate-200 bg-slate-50/90 text-slate-400 saturate-0",
      )}
    >
      <div className="relative overflow-hidden rounded-[1.25rem] bg-[#ebe4d8] sm:rounded-[1.6rem]">
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
            "absolute right-2 top-2 flex size-9 items-center justify-center rounded-full shadow-lg sm:right-3 sm:top-3 sm:size-11",
            selected
              ? "bg-emerald-500 text-white"
              : outOfStock
                ? "bg-slate-200/95 text-slate-500"
              : "bg-white/90 text-slate-400",
          )}
        >
          <Check className="size-4 sm:size-5" />
        </div>
        {outOfStock ? (
          <div className="absolute bottom-2 left-2 rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white sm:bottom-3 sm:left-3 sm:px-3 sm:text-[11px] sm:tracking-[0.24em]">
            Sold Out
          </div>
        ) : null}
      </div>

      <div className="px-1 pb-1 pt-3 sm:px-2 sm:pb-2 sm:pt-4">
        <h4 className="line-clamp-3 min-h-[4.5rem] text-sm font-semibold leading-5 text-slate-950 sm:line-clamp-2 sm:min-h-14 sm:text-lg sm:leading-7">
          {product.name}
        </h4>
        {formattedPrice ? (
          <p
            className={cn(
              "mt-1 text-lg font-semibold sm:text-2xl",
              outOfStock ? "text-slate-400" : "text-emerald-700",
            )}
          >
            {formattedPrice}
          </p>
        ) : isGift ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm sm:tracking-[0.22em]">
            Complimentary add-on
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Price hidden</p>
        )}

        {mode === "quantity" && selected ? (
          <div
            className={cn(
              "mt-3 flex items-center justify-between rounded-2xl px-2.5 py-2 sm:mt-4 sm:px-3",
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
                  "flex size-8 items-center justify-center rounded-full border bg-white sm:size-9",
                  outOfStock
                    ? "border-slate-200 text-slate-500"
                    : "border-emerald-200 text-emerald-700",
                )}
              >
                <Minus className="size-3.5 sm:size-4" />
              </button>
              <span className="w-5 text-center text-xs font-semibold text-slate-900 sm:w-6 sm:text-sm">
                {quantity}
              </span>
              <button
                type="button"
                onClick={onIncrease}
                disabled={outOfStock}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border bg-white sm:size-9",
                  outOfStock
                    ? "cursor-not-allowed border-slate-200 text-slate-300"
                    : "border-emerald-200 text-emerald-700",
                )}
              >
                <Plus className="size-3.5 sm:size-4" />
              </button>
            </div>
          </div>
        ) : mode === "quantity" ? (
          <div
            className={cn(
              "mt-3 rounded-2xl border px-2.5 py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] sm:mt-4 sm:px-3 sm:py-3 sm:text-xs sm:tracking-[0.24em]",
              outOfStock
                ? "border-slate-200 bg-slate-100/80 text-slate-500"
                : "border-dashed border-slate-200 text-slate-400",
            )}
          >
            {outOfStock ? "Out of stock" : "Tap to add"}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
