import { NextRequest, NextResponse } from "next/server";
import type { ShipmentDraft } from "@/lib/types";

type SubmittedItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  sku?: string | null;
};

type PendingAwbRequest = {
  draft: ShipmentDraft;
  items: SubmittedItem[];
  totalAmount: number;
};

function getAdminApiUrl() {
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-01";

  if (!rawDomain || !token) {
    return null;
  }

  const domain = rawDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return {
    url: `https://${domain}/admin/api/${apiVersion}/draft_orders.json`,
    token,
    domain,
  };
}

function splitName(value: string) {
  const parts = value.trim().split(/\s+/);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST(request: NextRequest) {
  const adminApi = getAdminApiUrl();

  if (!adminApi) {
    return NextResponse.json(
      {
        error:
          "Shopify Admin API is not configured. Add SHOPIFY_ADMIN_ACCESS_TOKEN to enable Pending AWB sync.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as PendingAwbRequest;
  const { draft, items, totalAmount } = body;

  if (!items?.length) {
    return NextResponse.json(
      { error: "Select at least one product before creating a Shopify draft order." },
      { status: 400 },
    );
  }

  const { firstName, lastName } = splitName(draft.customerName);
  const payload = {
    draft_order: {
      note: `Pending AWB created from shipping dashboard.\nOrder ID: ${draft.orderId}\nChannel: ${draft.channel}\nPayment: ${draft.paymentMode}\nFinal Amount: Rs. ${totalAmount.toFixed(2)}\nDestination: Pending AWB via Shopify`,
      tags: "Pending AWB,Shipping Dashboard",
      email: draft.email || undefined,
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address1: draft.address,
        city: draft.city,
        province: draft.state,
        zip: draft.pincode,
        country: "India",
        phone: draft.phone,
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        address1: draft.address,
        city: draft.city,
        province: draft.state,
        zip: draft.pincode,
        country: "India",
        phone: draft.phone,
      },
      line_items: items.map((item) => ({
        title: item.name,
        price: item.unitPrice.toFixed(2),
        quantity: item.quantity,
        sku: item.sku || undefined,
        requires_shipping: true,
      })),
      custom_attributes: [
        {
          key: "Source",
          value: "Shipping Dashboard",
        },
        {
          key: "Requested Destination",
          value: "Pending AWB via Shopify",
        },
        {
          key: "Final Amount",
          value: totalAmount.toFixed(2),
        },
      ],
    },
  };

  const response = await fetch(adminApi.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminApi.token,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as
    | {
        draft_order?: {
          id?: number | string;
          name?: string;
          invoice_url?: string | null;
          admin_graphql_api_id?: string;
        };
        errors?: unknown;
      }
    | null;

  if (!response.ok || !json?.draft_order) {
    return NextResponse.json(
      {
        error:
          (json?.errors && JSON.stringify(json.errors))
          || "Unable to create Shopify draft order.",
        payload: json,
      },
      { status: response.status || 500 },
    );
  }

  return NextResponse.json({
    draftOrderId: String(json.draft_order.id ?? ""),
    draftOrderName: json.draft_order.name ?? draft.orderId,
    invoiceUrl: json.draft_order.invoice_url ?? "",
    adminGraphqlApiId: json.draft_order.admin_graphql_api_id ?? "",
  });
}
