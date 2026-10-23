# BridgePlus Tech storefront

Responsive React storefront for BridgePlus customers. Browse the catalogue, add products to a local shopping bag, and prepare an order request for WhatsApp. No backend, order storage, inventory verification, or online payment is included.

## Before launch

The catalogue entries inherited from the supplied ZIP are explicitly marked as **unverified demo data**. Their names, listed prices, product details, and imagery should not be presented as confirmed stock or current prices. Confirm every listing and replace or remove demo records before publishing. The Smart-home devices category currently contains a clearly marked sample with no price.

Delivery pricing is not configured as zero or free. The checkout presents the delivery fee as unconfirmed, and any delivery total is provisional. Confirm all fulfilment terms with BridgePlus.

## Maintainer notes

- **Verified catalogue and prices:** edit `src/storefront/products.ts`. Keep `price: null` and a clear “Price to be confirmed” state until the price is verified. Set `demo: false` and update the badge only when a listing is confirmed. Product prices use NGN.
- **Business identity and contact:** edit `src/storefront/config.ts`. The configured WhatsApp destination defaults to `+2349059325955` (stored as digits). Optionally override it with `VITE_WHATSAPP_NUMBER`. The supplied business name and tagline are the only company claims used in the UI.
- **Brand assets:** the B+ wordmark in `src/storefront/Header.tsx` and `src/App.tsx` is the supplied implementation and current available mark. Update those two instances together if approved brand artwork becomes available.
- **Category filters:** edit `categories` in `src/storefront/products.ts`. Categories without confirmed inventory may use a sample listing without a numeric price.

## Order-request flow

Checkout validates customer name, phone and (for delivery) address, then creates a message for WhatsApp using `encodeURIComponent`. The customer reviews and sends the message themselves; clipboard fallback is also provided. Message generation or copying is not order confirmation or proof of payment. BridgePlus must confirm product availability, price, delivery/pickup details, and agree payment methods and instructions with the customer on WhatsApp. This storefront does not collect payment or retain order details.

