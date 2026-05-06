import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import type { Product, ProductsResponse } from "@/lib/types";

const sampleProducts: Product[] = [
  "Echeveria Elegans",
  "Haworthia Zebra",
  "Jade Plant Mini",
  "Sedum Burrito",
  "String of Pearls",
  "Graptopetalum Ghost",
  "Aloe Vera Compact",
  "Crassula Campfire",
  "Panda Plant",
  "Moonstone Succulent",
  "Blue Chalk Sticks",
  "Echeveria Lola",
  "Hens and Chicks Bowl",
  "Lithops Pebble Pair",
  "Senecio Fish Hooks",
  "Burro Tail Classic",
  "Mini Cactus Cluster",
  "Kalanchoe Copper Spoons",
  "Trailing Donkey Tail",
  "Agave Attenuata Baby",
  "Pachyphytum Compactum",
  "Haworthia Cooperi",
  "Pink Moonstone Pot",
  "Cotyledon Orbiculata",
].map((name, index) => ({
  id: `sample-${index + 1}`,
  name,
  image: "/product-placeholder.svg",
  availableForSale: (index + 1) % 6 !== 0,
  kind: "catalog",
  price: {
    amount: 129 + index * 8,
    currencyCode: "INR",
  },
}));

function encodeCursor(index: number) {
  return Buffer.from(index.toString(), "utf8").toString("base64");
}

function decodeCursor(cursor: string | null | undefined) {
  if (!cursor) {
    return 0;
  }

  try {
    const parsed = Number(Buffer.from(cursor, "base64").toString("utf8"));
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

export function getFallbackProducts({
  after,
  query,
}: {
  after?: string | null;
  query?: string | null;
}): ProductsResponse {
  const normalizedQuery = query?.trim().toLowerCase();

  const filteredProducts = normalizedQuery
    ? sampleProducts.filter((product) =>
        product.name.toLowerCase().includes(normalizedQuery),
      )
    : sampleProducts;

  const startIndex = decodeCursor(after);
  const products = filteredProducts.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE,
  );
  const endIndex = startIndex + products.length;

  return {
    products,
    pageInfo: {
      hasNextPage: endIndex < filteredProducts.length,
      hasPreviousPage: startIndex > 0,
      startCursor: products.length > 0 ? encodeCursor(startIndex) : null,
      endCursor: products.length > 0 ? encodeCursor(endIndex) : null,
    },
    source: "fallback",
  };
}
