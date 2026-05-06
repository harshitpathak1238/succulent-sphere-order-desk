# Succulent Sphere Order Desk

Internal order management tool for converting WhatsApp chats into clean,
printable packing slips.

## Stack

- Next.js App Router
- Tailwind CSS
- Firebase Firestore
- Shopify Storefront API for products
- Framer Motion
- Lucide Icons
- Sonner toasts

## Features

- Shopify product grid with search, selection state, and 20-item pagination
- Manual order creation with quantities and payment type
- Firestore-backed order storage
- Duplicate order ID protection
- Orders list with detail pages
- Packing slip view with copy + print actions
- Responsive UI for desktop and mobile operations
- Local fallback succulent catalog when Shopify credentials are missing

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in:

- Firebase web app config from Project Settings
- Shopify Storefront API token and store domain

3. Start the app:

```bash
npm run dev
```

## Firebase Setup

1. Create a Firebase project.
2. Enable Firestore Database.
3. Create a web app in Firebase Project Settings.
4. Copy the web config values into `.env.local`.
5. Firestore collection name: `orders`

Stored document shape:

```ts
{
  orderId: string,
  customerName: string,
  paymentType: "Prepaid" | "COD",
  items: [
    {
      productId: string,
      productName: string,
      quantity: number,
      image: string
    }
  ],
  totalItems: number,
  createdAt: timestamp
}
```

Order IDs are also used to create a normalized Firestore document key, which
blocks duplicates automatically.

## Shopify Setup

1. In Shopify, create a custom app.
2. Enable Storefront API access.
3. Generate a Storefront access token.
4. Add:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- Optional `SHOPIFY_API_VERSION`

If Shopify is not connected, the UI still works with a built-in succulent sample
catalog so you can continue building or demoing the flow.
