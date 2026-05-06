import { NextRequest, NextResponse } from "next/server";
import { getProductsPage } from "@/lib/shopify";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const after = searchParams.get("after");
  const query = searchParams.get("query");

  const products = await getProductsPage({
    after,
    query,
  });

  return NextResponse.json(products);
}
