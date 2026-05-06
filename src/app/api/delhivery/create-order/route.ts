import { NextRequest, NextResponse } from "next/server";
import type { PaymentType, SellerSettings, ShipmentDraft } from "@/lib/types";

type SubmittedItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

type CreateDelhiveryRequest = {
  draft: ShipmentDraft;
  items: SubmittedItem[];
  totalAmount: number;
};

function getDelhiveryBaseUrl() {
  return process.env.DELHIVERY_MODE === "production"
    ? "https://track.delhivery.com"
    : "https://staging-express.delhivery.com";
}

function buildPaymentMode(paymentMode: PaymentType) {
  return paymentMode === "COD" ? "COD" : "Pre-paid";
}

function sanitizeProductDescription(items: SubmittedItem[]) {
  return items
    .map((item) => `${item.name} x ${item.quantity}`)
    .join(", ")
    .slice(0, 490);
}

function buildManifestPayload(
  draft: ShipmentDraft,
  sellerSettings: SellerSettings,
  items: SubmittedItem[],
  totalAmount: number,
) {
  const shipments = [
    {
      name: draft.customerName,
      add: draft.address,
      pin: draft.pincode,
      city: draft.city,
      state: draft.state,
      country: "India",
      phone: draft.phone,
      order: draft.orderId,
      payment_mode: buildPaymentMode(draft.paymentMode),
      products_desc: sanitizeProductDescription(items),
      hsn_code: sellerSettings.hsnCode,
      cod_amount: draft.paymentMode === "COD" ? totalAmount : "",
      order_date: new Date().toISOString(),
      total_amount: totalAmount,
      seller_add: sellerSettings.pickupLocationAddress,
      seller_name: "Succulent Sphere",
      seller_inv: draft.orderId,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      waybill: "",
      shipment_width: draft.packaging.breadthCm,
      shipment_height: draft.packaging.heightCm,
      shipment_length: draft.packaging.lengthCm,
      weight: draft.packaging.weightGrams,
      seller_gst_tin: sellerSettings.sellerGstTin,
      shipping_mode: "Surface",
      address_type: "home",
      email: draft.email || undefined,
    },
  ];

  return {
    shipments,
    pickup_location: {
      name: sellerSettings.pickupLocationName,
    },
    fragile_shipment: draft.packaging.fragile,
    client: process.env.DELHIVERY_CLIENT_NAME || undefined,
  };
}

function extractAwb(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if ("packages" in payload && Array.isArray(payload.packages)) {
    const firstPackage = payload.packages[0] as Record<string, unknown> | undefined;
    return String(firstPackage?.waybill ?? firstPackage?.wbn ?? "");
  }

  if ("waybill" in payload) {
    return String(payload.waybill ?? "");
  }

  if ("packages" in payload && payload.packages && typeof payload.packages === "object") {
    const nestedWaybill = (payload.packages as Record<string, unknown>).waybill;
    return String(nestedWaybill ?? "");
  }

  return "";
}

export async function POST(request: NextRequest) {
  const token = process.env.DELHIVERY_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Delhivery token is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as CreateDelhiveryRequest;
  const { draft, items, totalAmount } = body;

  if (!draft?.sellerSettings.pickupLocationName) {
    return NextResponse.json(
      { error: "Pickup location name is required." },
      { status: 400 },
    );
  }

  if (!draft.customerName || !draft.phone || !draft.address || !draft.pincode) {
    return NextResponse.json(
      { error: "Customer name, phone, address, and pincode are required." },
      { status: 400 },
    );
  }

  if (!items?.length) {
    return NextResponse.json(
      { error: "Select at least one product before creating the shipment." },
      { status: 400 },
    );
  }

  const manifestPayload = buildManifestPayload(
    draft,
    draft.sellerSettings,
    items,
    totalAmount,
  );

  const payload = `format=json&data=${JSON.stringify(manifestPayload)}`;
  const url = new URL("/api/cmu/create.json", getDelhiveryBaseUrl());

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: payload,
    cache: "no-store",
  });

  const responseText = await response.text();
  const parsedPayload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          parsedPayload?.error
          ?? parsedPayload?.message
          ?? "Delhivery order creation failed.",
        payload: parsedPayload,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    awbNumber: extractAwb(parsedPayload),
    payload: parsedPayload,
  });
}
