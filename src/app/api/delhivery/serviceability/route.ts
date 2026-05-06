import { NextRequest, NextResponse } from "next/server";

const STATE_CODE_MAP: Record<string, string> = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CG: "Chhattisgarh",
  CH: "Chandigarh",
  DD: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HP: "Himachal Pradesh",
  HR: "Haryana",
  JH: "Jharkhand",
  JK: "Jammu and Kashmir",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MH: "Maharashtra",
  ML: "Meghalaya",
  MN: "Manipur",
  MP: "Madhya Pradesh",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  OR: "Odisha",
  PB: "Punjab",
  PY: "Puducherry",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TR: "Tripura",
  TS: "Telangana",
  UK: "Uttarakhand",
  UP: "Uttar Pradesh",
  WB: "West Bengal",
};

function getDelhiveryBaseUrl() {
  return process.env.DELHIVERY_MODE === "production"
    ? "https://track.delhivery.com"
    : "https://staging-express.delhivery.com";
}

function normalizeStateName(rawState: unknown) {
  const value = String(rawState ?? "").trim();

  if (!value) {
    return "";
  }

  if (value.length === 2) {
    return STATE_CODE_MAP[value.toUpperCase()] ?? value;
  }

  return value;
}

function extractServiceability(payload: unknown, pincode: string) {
  const deliveryCodes =
    payload &&
    typeof payload === "object" &&
    "delivery_codes" in payload &&
    Array.isArray(payload.delivery_codes)
      ? payload.delivery_codes
      : [];

  const matching = deliveryCodes.find((entry) => {
    if (!entry || typeof entry !== "object" || !("postal_code" in entry)) {
      return false;
    }

    const postalCode = entry.postal_code as Record<string, unknown>;
    return String(postalCode.pin ?? postalCode.pincode ?? "") === pincode;
  }) as { postal_code?: Record<string, unknown> } | undefined;

  const postalCode = matching?.postal_code ?? {};
  const cod = Boolean(postalCode.cod ?? postalCode.cash ?? false);
  const prepaid = Boolean(postalCode.pre_paid ?? postalCode.prepaid ?? false);
  const city = String(
    postalCode.city
      ?? postalCode.district
      ?? postalCode.taluk
      ?? postalCode.region
      ?? "",
  ).trim();
  const state = normalizeStateName(
    postalCode.state
      ?? postalCode.state_name
      ?? postalCode.state_code
      ?? postalCode.province,
  );

  return {
    serviceable: Boolean(matching),
    cod,
    prepaid,
    city,
    state,
  };
}

export async function GET(request: NextRequest) {
  const token = process.env.DELHIVERY_API_TOKEN;
  const pincode = request.nextUrl.searchParams.get("pincode")?.trim() ?? "";

  if (!token) {
    return NextResponse.json(
      { error: "Delhivery token is not configured." },
      { status: 500 },
    );
  }

  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return NextResponse.json(
      { error: "A valid 6-digit pincode is required." },
      { status: 400 },
    );
  }

  const url = new URL("/c/api/pin-codes/json/", getDelhiveryBaseUrl());
  url.searchParams.set("filter_codes", pincode);

  const response = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Unable to check Delhivery serviceability right now.",
        payload,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    ...extractServiceability(payload, pincode),
    payload,
  });
}
