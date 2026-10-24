import type { Product } from './products';
import { businessConfig } from './config';

export type CartRow = { product: Product; quantity: number };
export type CheckoutForm = {
  name: string;
  phone: string;
  fulfilment: 'delivery' | 'pickup';
  address: string;
  deliveryNotes: string;
  customerNote: string;
};

export const initialForm: CheckoutForm = {
  name: '',
  phone: '',
  fulfilment: 'delivery',
  address: '',
  deliveryNotes: '',
  customerNote: '',
};

export function formatMoney(amount: number) {
  return new Intl.NumberFormat(businessConfig.locale, {
    style: 'currency',
    currency: businessConfig.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function makeOrderReference() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(2, 12);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BP-${stamp}-${random}`;
}

export function buildWhatsAppUrl(number: string, message: string) {
  return `https://wa.me/${String(number).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function buildOrderMessage(args: {
  orderRef: string;
  form: CheckoutForm;
  cart: CartRow[];
  subtotal: number;
}) {
  const { orderRef, form, cart, subtotal } = args;
  const hasDemoPrice = cart.some(({ product }) => product.demo && product.price !== null);
  const itemLines = cart.map(({ product, quantity }) =>
    `- ${product.name} (${product.brand}) x${quantity} — ${product.price === null ? 'Price to be confirmed' : `${formatMoney(product.price * quantity)}${product.demo ? ' (unverified demo price)' : ''}`}`,
  );
  return [
    `Hello ${businessConfig.businessName}, I would like to make an order request.`,
    '',
    `Reference: ${orderRef}`,
    'Status: Awaiting BridgePlus confirmation',
    '',
    'ITEMS',
    ...itemLines,
    '',
    `Known-price subtotal: ${formatMoney(subtotal)} (${hasDemoPrice ? 'includes unverified demo prices; ' : 'displayed catalogue prices; '}excludes any unpriced items)`,
    `Delivery fee: ${form.fulfilment === 'delivery' ? 'Unconfirmed' : 'Pickup selected; arrangements to be confirmed'}`,
    `Provisional total: ${formatMoney(subtotal)}${form.fulfilment === 'delivery' ? ' + unconfirmed delivery charge' : ' before BridgePlus price/availability confirmation'}`,
    '',
    'CUSTOMER DETAILS',
    `Name: ${form.name.trim()}`,
    `Phone: ${form.phone.trim()}`,
    `Fulfilment: ${form.fulfilment === 'delivery' ? 'Home delivery' : 'Pickup (details to be confirmed)'}`,
    ...(form.fulfilment === 'delivery' ? [`Delivery address: ${form.address.trim()}`, ...(form.deliveryNotes.trim() ? [`Delivery notes: ${form.deliveryNotes.trim()}`] : [])] : []),
    ...(form.customerNote.trim() ? [`Order note: ${form.customerNote.trim()}`] : []),
    '',
    'Please agree payment methods and instructions with BridgePlus on WhatsApp.',
    'Please confirm product availability, all prices, delivery charge and arrangements.',
    'This request message is not an order confirmation or proof of payment.',
  ].join('\n');
}
