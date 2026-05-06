"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Loader2, Search } from "lucide-react";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { ProductCard } from "@/components/product-card";
import { GIFT_PRODUCT } from "@/lib/gift-product";
import type { Product, ProductsResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SelectedProductMap = Record<
  string,
  {
    product: Product;
    quantity: number;
  }
>;

type ProductBrowserProps = {
  title: string;
  description: string;
  selectedProducts: SelectedProductMap;
  selectionMode: "toggle" | "quantity";
  onToggleProduct: (product: Product) => void;
  onIncreaseQuantity?: (product: Product) => void;
  onDecreaseQuantity?: (product: Product) => void;
  selectedUnitsCount: number;
};

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="surface-card-strong overflow-hidden rounded-[2rem] border border-white/70 p-3"
        >
          <div className="aspect-square animate-pulse rounded-[1.7rem] bg-slate-200/70" />
          <div className="space-y-3 px-2 py-4">
            <div className="h-4 animate-pulse rounded-full bg-slate-200/70" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductBrowser({
  title,
  description,
  selectedProducts,
  selectionMode,
  onToggleProduct,
  onIncreaseQuantity,
  onDecreaseQuantity,
  selectedUnitsCount,
}: ProductBrowserProps) {
  const [catalog, setCatalog] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([
    null,
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const [, startTransition] = useTransition();

  const deferredSearch = useDeferredValue(searchInput.trim());
  const currentCursor = cursorHistory[pageIndex] ?? null;

  useEffect(() => {
    startTransition(() => {
      setActiveSearch(deferredSearch);
      setCursorHistory([null]);
      setPageIndex(0);
    });
  }, [deferredSearch]);

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();

        if (currentCursor) {
          searchParams.set("after", currentCursor);
        }

        if (activeSearch) {
          searchParams.set("query", activeSearch);
        }

        const response = await fetch(`/api/products?${searchParams.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load products right now.");
        }

        const nextCatalog = (await response.json()) as ProductsResponse;
        setCatalog(nextCatalog);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load products right now.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => controller.abort();
  }, [activeSearch, currentCursor]);

  const selectedProductsList = useMemo(
    () => Object.values(selectedProducts).map((entry) => entry.product),
    [selectedProducts],
  );

  const visibleProducts = useMemo(() => {
    if (showSelectedOnly) {
      const selectedGift = selectedProductsList.find(
        (product) => product.id === GIFT_PRODUCT.id,
      );
      const selectedCatalogProducts = selectedProductsList.filter(
        (product) => product.id !== GIFT_PRODUCT.id,
      );

      return selectedGift
        ? [selectedGift, ...selectedCatalogProducts]
        : selectedCatalogProducts;
    }

    const catalogProducts = catalog?.products ?? [];
    return [GIFT_PRODUCT, ...catalogProducts];
  }, [catalog?.products, selectedProductsList, showSelectedOnly]);

  const selectedCount = selectedProductsList.length;

  const nextPage = () => {
    if (!catalog?.pageInfo.hasNextPage || !catalog.pageInfo.endCursor) {
      return;
    }

    startTransition(() => {
      setCursorHistory((current) => {
        const nextCursor = catalog.pageInfo.endCursor;
        const nextHistory = current.slice(0, pageIndex + 1);
        nextHistory.push(nextCursor);
        return nextHistory;
      });
      setPageIndex((current) => current + 1);
    });
  };

  const previousPage = () => {
    if (pageIndex === 0) {
      return;
    }

    startTransition(() => {
      setPageIndex((current) => current - 1);
    });
  };

  return (
    <section className="surface-card rounded-[2rem] border border-white/60 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Product Browser
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            {title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-center text-sm font-medium text-slate-700">
            {selectionMode === "quantity"
              ? `${selectedUnitsCount} total items`
              : `${selectedCount} selected`}
          </div>
          <button
            type="button"
            onClick={() => setShowSelectedOnly((current) => !current)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
              showSelectedOnly
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-white/70 bg-white/80 text-slate-700",
            )}
          >
            <Filter className="size-4" />
            {showSelectedOnly ? "Showing Selected" : "Selected Only"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products"
            className="h-12 w-full rounded-2xl border border-white/70 bg-white/80 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
          />
        </label>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          <span>
            {showSelectedOnly
              ? `${visibleProducts.length} selected products`
              : `Page ${pageIndex + 1} - ${PRODUCTS_PER_PAGE} per page + gift`}
          </span>
        </div>
      </div>

      {catalog?.source === "fallback" ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
          Shopify credentials are not set or could not be reached, so the app is
          showing a local sample succulent catalog for now.
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50/90 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-500">
            {showSelectedOnly
              ? "No selected products yet."
              : "No products matched this search."}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4"
          >
            <AnimatePresence>
              {visibleProducts.map((product) => {
                const selectedEntry = selectedProducts[product.id];

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selected={Boolean(selectedEntry)}
                    quantity={selectedEntry?.quantity ?? 0}
                    mode={selectionMode}
                    onToggle={() => onToggleProduct(product)}
                    onIncrease={
                      onIncreaseQuantity
                        ? () => onIncreaseQuantity(product)
                        : undefined
                    }
                    onDecrease={
                      onDecreaseQuantity
                        ? () => onDecreaseQuantity(product)
                        : undefined
                    }
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {!showSelectedOnly ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={previousPage}
            disabled={pageIndex === 0 || loading}
            className="w-full rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={nextPage}
            disabled={!catalog?.pageInfo.hasNextPage || loading}
            className="w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
