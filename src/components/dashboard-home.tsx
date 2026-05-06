"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  Loader2,
  MapPinned,
  PackagePlus,
  Settings2,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  ProductBrowser,
  type SelectedProductMap,
} from "@/components/product-browser";
import { parseWhatsAppMessage } from "@/lib/parse-whatsapp-message";
import {
  DEFAULT_SELLER_SETTINGS,
  DEFAULT_SHIPMENT_DRAFT,
  INDIAN_STATES,
  LAST_ORDER_ID_KEY,
  SELLER_SETTINGS_KEY,
  SESSION_ORDER_HISTORY_KEY,
  getNextOrderId,
  readJsonStorage,
  writeJsonStorage,
} from "@/lib/shipping-config";
import type {
  ParsedWhatsAppMessage,
  Product,
  SessionOrderRecord,
  SellerSettings,
  ShipmentDraft,
  SubmissionStatus,
} from "@/lib/types";

type ServiceabilityState = {
  loading: boolean;
  checked: boolean;
  serviceable: boolean;
  cod: boolean;
  prepaid: boolean;
  message: string;
};

type StatusBanner = {
  tone: "success" | "error";
  text: string;
};

const parserPlaceholder = `Paste customer's WhatsApp message here...

Example:
Rahul Sharma
9876543210
Rahul@gmail.com
123 Gandhi Nagar, Near Bus Stand
Meerut, Uttar Pradesh
250001
300Rs`;

function formatPhoneDisplay(phone: string) {
  return phone.replace(/\D/g, "").slice(0, 10);
}

function slugifyRecordId(orderId: string) {
  return `${orderId}-${Date.now()}`;
}

function readInitialSellerSettings() {
  return readJsonStorage<SellerSettings>(
    SELLER_SETTINGS_KEY,
    DEFAULT_SELLER_SETTINGS,
  );
}

function readInitialOrderId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(LAST_ORDER_ID_KEY);
}

function createInitialDraft(): ShipmentDraft {
  return {
    ...DEFAULT_SHIPMENT_DRAFT,
    orderId: getNextOrderId(readInitialOrderId()),
    sellerSettings: readInitialSellerSettings(),
  };
}

export function DashboardHome() {
  const browserRef = useRef<HTMLDivElement | null>(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [parsedDetails, setParsedDetails] = useState<ParsedWhatsAppMessage | null>(
    null,
  );
  const [draft, setDraft] = useState<ShipmentDraft>(() => createInitialDraft());
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductMap>({});
  const [sellerCollapsed, setSellerCollapsed] = useState(() => {
    const sellerSettings = readInitialSellerSettings();

    return Boolean(
      sellerSettings.pickupLocationName
      || sellerSettings.pickupLocationAddress
      || sellerSettings.sellerGstTin,
    );
  });
  const [serviceability, setServiceability] = useState<ServiceabilityState>({
    loading: false,
    checked: false,
    serviceable: false,
    cod: false,
    prepaid: false,
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusBanner, setStatusBanner] = useState<StatusBanner | null>(null);

  useEffect(() => {
    const pincode = draft.pincode.trim();

    if (!/^[1-9]\d{5}$/.test(pincode)) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/delhivery/serviceability?pincode=${encodeURIComponent(pincode)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          city?: string;
          state?: string;
        };

        setDraft((current) => {
          if (current.pincode.trim() !== pincode) {
            return current;
          }

          return {
            ...current,
            city: payload.city?.trim() || current.city,
            state: payload.state?.trim() || current.state,
          };
        });
      } catch {
        return;
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [draft.pincode]);

  const selectedEntries = useMemo(
    () => Object.values(selectedProducts),
    [selectedProducts],
  );

  const totalUnits = useMemo(
    () =>
      selectedEntries.reduce((sum, entry) => {
        return sum + entry.quantity;
      }, 0),
    [selectedEntries],
  );

  const totalAmount = useMemo(
    () =>
      selectedEntries.reduce((sum, entry) => {
        const unitPrice = entry.product.price?.amount ?? 0;
        return sum + unitPrice * entry.quantity;
      }, 0),
    [selectedEntries],
  );

  const manualAmountValue = Number(draft.manualAmount.trim());
  const hasManualAmount = draft.manualAmount.trim().length > 0;
  const manualAmountValid = !hasManualAmount || Number.isFinite(manualAmountValue);
  const finalAmount = hasManualAmount && manualAmountValid ? manualAmountValue : totalAmount;
  const amountDelta = totalAmount - finalAmount;

  const hasExtracted = parsedDetails !== null;
  const actionLabel =
    draft.shippingTarget === "pending_awb_shopify"
      ? "Create Pending AWB in Shopify"
      : "Create Order on Delhivery";

  const submittedItems = selectedEntries.map((entry) => ({
    productId: entry.product.id,
    name: entry.product.name,
    quantity: entry.quantity,
    unitPrice: entry.product.price?.amount ?? 0,
    sku: entry.product.sku ?? null,
    category: entry.product.category ?? "Plants",
    image: entry.product.image ?? "/product-placeholder.svg",
  }));

  const updateDraft = <K extends keyof ShipmentDraft>(
    key: K,
    value: ShipmentDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updatePackaging = <K extends keyof ShipmentDraft["packaging"]>(
    key: K,
    value: ShipmentDraft["packaging"][K],
  ) => {
    setDraft((current) => ({
      ...current,
      packaging: {
        ...current.packaging,
        [key]: value,
      },
    }));
  };

  const updateSellerSettings = <K extends keyof ShipmentDraft["sellerSettings"]>(
    key: K,
    value: ShipmentDraft["sellerSettings"][K],
  ) => {
    setDraft((current) => ({
      ...current,
      sellerSettings: {
        ...current.sellerSettings,
        [key]: value,
      },
    }));
  };

  const toggleProduct = (product: Product) => {
    setSelectedProducts((current) => {
      if (current[product.id]) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }

      if (!product.availableForSale) {
        return current;
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
      if (!product.availableForSale) {
        return current;
      }

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

  const handleExtractDetails = () => {
    if (!whatsAppMessage.trim()) {
      toast.error("Paste the WhatsApp message first.");
      return;
    }

    const nextParsed = parseWhatsAppMessage(whatsAppMessage);
    setParsedDetails(nextParsed);
    setStatusBanner(null);
    setServiceability({
      loading: false,
      checked: false,
      serviceable: false,
      cod: false,
      prepaid: false,
      message: "",
    });
    setDraft((current) => ({
      ...current,
      customerName: nextParsed.customerName || current.customerName,
      phone: nextParsed.phone || current.phone,
      email: nextParsed.email || current.email,
      address: nextParsed.address || current.address,
      pincode: nextParsed.pincode || current.pincode,
      city: nextParsed.city || current.city,
      state: nextParsed.state || current.state,
      manualAmount:
        current.manualAmount || (nextParsed.amountHint !== null ? String(nextParsed.amountHint) : ""),
    }));
    toast.success("Details extracted. Review and edit before submitting.");
  };

  const saveSellerSettings = () => {
    writeJsonStorage(SELLER_SETTINGS_KEY, draft.sellerSettings);
    setSellerCollapsed(true);
    toast.success("Seller settings saved.");
  };

  const scrollToProductBrowser = () => {
    browserRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const checkPincodeServiceability = async () => {
    if (!/^[1-9]\d{5}$/.test(draft.pincode)) {
      toast.error("Enter a valid 6-digit pincode first.");
      return;
    }

    setServiceability((current) => ({ ...current, loading: true }));

    try {
      const response = await fetch(
        `/api/delhivery/serviceability?pincode=${encodeURIComponent(draft.pincode)}`,
        {
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        serviceable?: boolean;
        cod?: boolean;
        prepaid?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to check serviceability.");
      }

      setServiceability({
        loading: false,
        checked: true,
        serviceable: Boolean(payload.serviceable),
        cod: Boolean(payload.cod),
        prepaid: Boolean(payload.prepaid),
        message: payload.serviceable ? "Serviceable" : "Not serviceable",
      });
      toast.success(
        payload.serviceable
          ? "Pincode is serviceable."
          : "Pincode is not serviceable.",
      );
    } catch (error) {
      setServiceability({
        loading: false,
        checked: true,
        serviceable: false,
        cod: false,
        prepaid: false,
        message: error instanceof Error ? error.message : "Unable to check serviceability.",
      });
      toast.error(
        error instanceof Error ? error.message : "Unable to check serviceability.",
      );
    }
  };

  const persistSessionOrder = (
    status: SubmissionStatus,
    awbNumber: string,
  ) => {
    const currentHistory = readJsonStorage<SessionOrderRecord[]>(
      SESSION_ORDER_HISTORY_KEY,
      [],
      "session",
    );
    const nextRecord: SessionOrderRecord = {
      id: slugifyRecordId(draft.orderId),
      orderId: draft.orderId,
      customerName: draft.customerName,
      pincode: draft.pincode,
      productSummary: submittedItems
        .map((item) => `${item.name} x ${item.quantity}`)
        .join(", "),
      amount: finalAmount,
      payment: draft.paymentMode,
      awbNumber,
      status,
      createdAt: new Date().toISOString(),
      destination: draft.shippingTarget,
    };

    writeJsonStorage(
      SESSION_ORDER_HISTORY_KEY,
      [nextRecord, ...currentHistory],
      "session",
    );
    window.localStorage.setItem(LAST_ORDER_ID_KEY, draft.orderId);
  };

  const resetForNextOrder = () => {
    const nextOrderId = getNextOrderId(draft.orderId);

    setWhatsAppMessage("");
    setParsedDetails(null);
    setSelectedProducts({});
    setDraft((current) => ({
      ...DEFAULT_SHIPMENT_DRAFT,
      orderId: nextOrderId,
      sellerSettings: current.sellerSettings,
      packaging: current.packaging,
    }));
    setServiceability({
      loading: false,
      checked: false,
      serviceable: false,
      cod: false,
      prepaid: false,
      message: "",
    });
  };

  const submitShipment = async () => {
    if (!hasExtracted) {
      toast.error("Extract the WhatsApp message first.");
      return;
    }

    if (!draft.customerName || !draft.phone || !draft.address || !draft.pincode) {
      toast.error("Fill the customer name, phone, address, and pincode.");
      return;
    }

    if (!draft.city || !draft.state) {
      toast.error("Fill the city and state before submitting.");
      return;
    }

    if (!draft.orderId.trim()) {
      toast.error("Order ID is required.");
      return;
    }

    if (submittedItems.length === 0) {
      toast.error("Select at least one product or gift.");
      return;
    }

    if (!manualAmountValid || finalAmount < 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    if (
      !draft.sellerSettings.pickupLocationName ||
      !draft.sellerSettings.pickupLocationAddress ||
      !draft.sellerSettings.hsnCode
    ) {
      toast.error("Complete seller settings before submitting.");
      return;
    }

    setSubmitting(true);
    setStatusBanner(null);

    try {
      const endpoint =
        draft.shippingTarget === "pending_awb_shopify"
          ? "/api/shopify/pending-awb"
          : "/api/delhivery/create-order";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draft,
          items: submittedItems,
          totalAmount: finalAmount,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        awbNumber?: string;
        draftOrderName?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit the order.");
      }

      const awbOrReference =
        draft.shippingTarget === "pending_awb_shopify"
          ? payload.draftOrderName ?? draft.orderId
          : payload.awbNumber ?? "";

      const status: SubmissionStatus =
        draft.shippingTarget === "pending_awb_shopify"
          ? "Pending AWB via Shopify"
          : "Ready to Ship";

      persistSessionOrder(status, awbOrReference);
      setStatusBanner({
        tone: "success",
        text:
          draft.shippingTarget === "pending_awb_shopify"
            ? `Pending AWB created in Shopify: ${awbOrReference}`
            : `Order created! AWB: ${awbOrReference || "Generated"}`,
      });
      toast.success(
        draft.shippingTarget === "pending_awb_shopify"
          ? `Shopify draft created: ${awbOrReference}`
          : `Order created. AWB: ${awbOrReference || "Generated"}`,
      );
      resetForNextOrder();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit the order.";
      setStatusBanner({
        tone: "error",
        text: message,
      });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]"
      >
        <section className="surface-card rounded-[2rem] border border-white/60 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Paste WhatsApp Message
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Turn chat text into a ready-to-ship order.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Paste the customer message, extract details automatically, then
                review the form before sending it to Shopify or Delhivery.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                WhatsApp Message
              </span>
              <textarea
                rows={8}
                value={whatsAppMessage}
                onChange={(event) => setWhatsAppMessage(event.target.value)}
                placeholder={parserPlaceholder}
                className="min-h-56 w-full rounded-[1.8rem] border border-white/70 bg-white/85 px-4 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
              />
            </label>

            <button
              type="button"
              onClick={handleExtractDetails}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20"
            >
              <ArrowDownToLine className="size-4" />
              Extract Details
            </button>

            <p className="text-sm text-slate-500">
              Supports Hindi, Hinglish &amp; English messages
            </p>
          </div>

          {parsedDetails ? (
            <div className="mt-6 rounded-[1.6rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Extracted preview</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {parsedDetails.customerName || "Not found"}
                </p>
                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {parsedDetails.phone || "Not found"}
                </p>
                <p>
                  <span className="font-semibold">Pincode:</span>{" "}
                  {parsedDetails.pincode || "Not found"}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {parsedDetails.email || "Not found"}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="surface-card rounded-[2rem] border border-white/60 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <PackagePlus className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Order Creation Form
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {hasExtracted
                  ? "Review, edit, and submit the order."
                  : "Extract the message to unlock the order form."}
              </h2>
            </div>
          </div>

          {!hasExtracted ? (
            <div className="mt-6 rounded-[1.8rem] border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
              Extract the WhatsApp message first, then customer details and
              shipment fields will appear here ready for review.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Customer Details
                  </p>
                  <p className="text-sm text-slate-500">
                    Auto-filled from the parser, but everything stays editable.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Customer Full Name
                    </span>
                    <input
                      value={draft.customerName}
                      onChange={(event) => updateDraft("customerName", event.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone Number
                    </span>
                    <div className="flex h-12 items-center rounded-2xl border border-white/70 bg-white/85">
                      <span className="px-4 text-sm font-semibold text-slate-500">
                        +91
                      </span>
                      <input
                        value={formatPhoneDisplay(draft.phone)}
                        onChange={(event) =>
                          updateDraft("phone", formatPhoneDisplay(event.target.value))
                        }
                        className="h-full w-full rounded-r-2xl bg-transparent pr-4 text-sm text-slate-900 outline-none"
                      />
                    </div>
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Full Address
                    </span>
                    <textarea
                      rows={3}
                      value={draft.address}
                      onChange={(event) => updateDraft("address", event.target.value)}
                      className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-900"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Pincode
                    </span>
                    <input
                      maxLength={6}
                      value={draft.pincode}
                      onChange={(event) =>
                        updateDraft(
                          "pincode",
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Email
                    </span>
                    <input
                      value={draft.email}
                      onChange={(event) => updateDraft("email", event.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      City
                    </span>
                    <input
                      value={draft.city}
                      onChange={(event) => updateDraft("city", event.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      State
                    </span>
                    <select
                      value={draft.state}
                      onChange={(event) => updateDraft("state", event.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-200/70 pt-6">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Order Details</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Order ID
                    </span>
                    <input
                      value={draft.orderId}
                      onChange={(event) => updateDraft("orderId", event.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Channel
                    </span>
                    <select
                      value={draft.channel}
                      onChange={(event) =>
                        updateDraft(
                          "channel",
                          event.target.value as ShipmentDraft["channel"],
                        )
                      }
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    >
                      <option value="Default Channel">Default Channel</option>
                      <option value="Shopify">Shopify</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Final Amount to Charge
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.manualAmount}
                      onChange={(event) => updateDraft("manualAmount", event.target.value)}
                      placeholder={totalAmount > 0 ? totalAmount.toFixed(2) : "0.00"}
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Leave blank to use the product total automatically. Enter a discounted
                      amount here whenever needed.
                    </p>
                    {hasManualAmount && !manualAmountValid ? (
                      <p className="mt-2 text-xs font-semibold text-rose-600">
                        Enter a valid amount before submitting.
                      </p>
                    ) : null}
                  </label>
                </div>

                <div className="space-y-3">
                  <span className="block text-sm font-semibold text-slate-700">
                    Payment Mode
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "COD", icon: "💵" },
                      { label: "Prepaid", icon: "💳" },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() =>
                          updateDraft(
                            "paymentMode",
                            option.label as ShipmentDraft["paymentMode"],
                          )
                        }
                        className={
                          draft.paymentMode === option.label
                            ? "rounded-2xl border border-emerald-500 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
                            : "rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700"
                        }
                      >
                        <span className="mr-2">{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block text-sm font-semibold text-slate-700">
                    Delivery Creation Target
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => updateDraft("shippingTarget", "pending_awb_shopify")}
                      className={
                        draft.shippingTarget === "pending_awb_shopify"
                          ? "rounded-2xl border border-emerald-500 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
                          : "rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700"
                      }
                    >
                      Pending AWB via Shopify
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDraft("shippingTarget", "ready_to_ship")}
                      className={
                        draft.shippingTarget === "ready_to_ship"
                          ? "rounded-2xl border border-emerald-500 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
                          : "rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700"
                      }
                    >
                      Ready to Ship
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-200/70 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Product Details
                    </p>
                    <p className="text-sm text-slate-500">
                      Select products below. Gifts work the same way as products.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={scrollToProductBrowser}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Browse Products & Gifts
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedEntries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
                      No products selected yet.
                    </div>
                  ) : (
                    selectedEntries.map((entry) => {
                      const unitPrice = entry.product.price?.amount ?? 0;

                      return (
                        <div
                          key={entry.product.id}
                          className="rounded-[1.5rem] border border-white/70 bg-white/85 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {entry.product.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                SKU: {entry.product.sku || "N/A"} | Category:{" "}
                                {entry.product.category || "Plants"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Unit Price: ₹{unitPrice.toFixed(2)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(entry.product)}
                                className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-slate-900">
                                {entry.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => increaseQuantity(entry.product)}
                                className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                  <div className="flex items-center justify-between gap-3">
                    <span>Catalog Total</span>
                    <span>Rs. {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-semibold">Final Amount</span>
                    <span className="text-lg font-semibold">Rs. {finalAmount.toFixed(2)}</span>
                  </div>
                  {hasManualAmount && manualAmountValid ? (
                    <div className="mt-2 flex items-center justify-between gap-3 text-emerald-800">
                      <span>{amountDelta >= 0 ? "Discount Applied" : "Amount Added"}</span>
                      <span>Rs. {Math.abs(amountDelta).toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between gap-3 text-emerald-800">
                    <span>Total Units</span>
                    <span>{totalUnits}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-200/70 pt-6">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Box / Packaging Details
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Package Type
                    </span>
                    <select
                      value={draft.packaging.packageType}
                      onChange={(event) =>
                        updatePackaging("packageType", event.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                    >
                      <option value="Cardboard Box">Cardboard Box</option>
                      <option value="Courier Bag">Courier Bag</option>
                      <option value="Gift Box">Gift Box</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={draft.packaging.fragile}
                      onChange={(event) =>
                        updatePackaging("fragile", event.target.checked)
                      }
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      Fragile
                    </span>
                  </label>

                  {[
                    ["lengthCm", "Length (cm)"],
                    ["breadthCm", "Breadth (cm)"],
                    ["heightCm", "Height (cm)"],
                    ["weightGrams", "Weight (gm)"],
                  ].map(([key, label]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        {label}
                      </span>
                      <input
                        type="number"
                        value={
                          draft.packaging[key as keyof ShipmentDraft["packaging"]] as number
                        }
                        onChange={(event) =>
                          updatePackaging(
                            key as keyof ShipmentDraft["packaging"],
                            Number(event.target.value),
                          )
                        }
                        className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-200/70 pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Seller / Business Details
                    </p>
                    <p className="text-sm text-slate-500">
                      Saved once and reused for future orders.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSellerCollapsed((current) => !current)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
                  >
                    <Settings2 className="size-4" />
                    {sellerCollapsed ? "Edit Settings" : "Collapse"}
                  </button>
                </div>

                {!sellerCollapsed ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Seller GST TIN
                      </span>
                      <input
                        value={draft.sellerSettings.sellerGstTin}
                        onChange={(event) =>
                          updateSellerSettings("sellerGstTin", event.target.value)
                        }
                        className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        HSN Code
                      </span>
                      <input
                        value={draft.sellerSettings.hsnCode}
                        onChange={(event) =>
                          updateSellerSettings("hsnCode", event.target.value)
                        }
                        className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Pickup Location Name
                      </span>
                      <input
                        value={draft.sellerSettings.pickupLocationName}
                        onChange={(event) =>
                          updateSellerSettings(
                            "pickupLocationName",
                            event.target.value,
                          )
                        }
                        className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm text-slate-900"
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Pickup Location Address
                      </span>
                      <textarea
                        rows={3}
                        value={draft.sellerSettings.pickupLocationAddress}
                        onChange={(event) =>
                          updateSellerSettings(
                            "pickupLocationAddress",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-900"
                      />
                    </label>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={saveSellerSettings}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-5 py-3 text-sm font-semibold text-white"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                    Settings saved ✓
                  </div>
                )}
              </section>

              <section className="space-y-4 border-t border-slate-200/70 pt-6">
                {serviceability.checked ? (
                  <div
                    className={
                      serviceability.serviceable
                        ? "rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900"
                        : "rounded-[1.5rem] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-700"
                    }
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <MapPinned className="size-4" />
                      {serviceability.serviceable ? "Serviceable" : "Not Serviceable"}
                    </div>
                    <p className="mt-2">
                      COD: {serviceability.cod ? "Yes" : "No"} | Prepaid:{" "}
                      {serviceability.prepaid ? "Yes" : "No"}
                    </p>
                  </div>
                ) : null}

                {statusBanner ? (
                  <div
                    className={
                      statusBanner.tone === "success"
                        ? "rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900"
                        : "rounded-[1.5rem] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-700"
                    }
                  >
                    {statusBanner.text}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={checkPincodeServiceability}
                    disabled={serviceability.loading}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    {serviceability.loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Truck className="size-4" />
                    )}
                    Check Pincode Serviceability
                  </button>

                  <button
                    type="button"
                    onClick={submitShipment}
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-[1.6rem] bg-emerald-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_48px_rgba(16,185,129,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    {actionLabel}
                    <span className="rounded-full bg-white/12 px-2 py-1 text-xs">
                      Rs. {finalAmount.toFixed(2)}
                    </span>
                  </button>
                </div>
              </section>
            </div>
          )}
        </section>
      </motion.section>

      <div ref={browserRef}>
        <ProductBrowser
          title="Select ordered products and gifts"
          description="Pick the products mentioned in the chat, adjust quantities, and include a complimentary gift when needed."
          selectedProducts={selectedProducts}
          selectionMode="quantity"
          onToggleProduct={toggleProduct}
          onIncreaseQuantity={increaseQuantity}
          onDecreaseQuantity={decreaseQuantity}
          selectedUnitsCount={totalUnits}
        />
      </div>
    </div>
  );
}
