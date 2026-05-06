import "server-only";

import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { getFallbackProducts } from "@/lib/sample-products";
import type { Product, ProductsResponse } from "@/lib/types";

const productQuery = `
  query Products($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        node {
          id
          title
          availableForSale
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

type ShopifyProductsResponse = {
  data?: {
    products?: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          availableForSale?: boolean | null;
          featuredImage?: {
            url?: string | null;
            altText?: string | null;
          } | null;
          priceRange?: {
            minVariantPrice?: {
              amount?: string | null;
              currencyCode?: string | null;
            } | null;
          } | null;
        };
      }>;
      pageInfo: ProductsResponse["pageInfo"];
    };
  };
  errors?: Array<{
    message: string;
  }>;
};

function getStorefrontEndpoint() {
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const domain = rawDomain
    ? rawDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;
  const accessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2024-10";

  if (!domain || !accessToken) {
    return null;
  }

  return {
    url: `https://${domain}/api/${apiVersion}/graphql.json`,
    accessToken,
  };
}

function mapProduct(
  node: NonNullable<
    NonNullable<ShopifyProductsResponse["data"]>["products"]
  >["edges"][number]["node"],
): Product {
  const amount = Number(node.priceRange?.minVariantPrice?.amount ?? 0);

  return {
    id: node.id,
    name: node.title,
    image: node.featuredImage?.url ?? null,
    availableForSale: node.availableForSale ?? true,
    kind: "catalog",
    price: node.priceRange?.minVariantPrice?.currencyCode
      ? {
          amount,
          currencyCode: node.priceRange.minVariantPrice.currencyCode,
        }
      : null,
  };
}

export async function getProductsPage({
  after,
  query,
}: {
  after?: string | null;
  query?: string | null;
}): Promise<ProductsResponse> {
  const storefront = getStorefrontEndpoint();

  if (!storefront) {
    return getFallbackProducts({ after, query });
  }

  try {
    const response = await fetch(storefront.url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefront.accessToken,
      },
      body: JSON.stringify({
        query: productQuery,
        variables: {
          first: PRODUCTS_PER_PAGE,
          after,
          query: query?.trim() || null,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ShopifyProductsResponse;

    if (payload.errors?.length) {
      throw new Error(payload.errors[0]?.message ?? "Shopify query failed.");
    }

    const productsConnection = payload.data?.products;

    if (!productsConnection) {
      throw new Error("Shopify returned an empty products payload.");
    }

    return {
      products: productsConnection.edges.map((edge) => mapProduct(edge.node)),
      pageInfo: productsConnection.pageInfo,
      source: "shopify",
    };
  } catch {
    return getFallbackProducts({ after, query });
  }
}
