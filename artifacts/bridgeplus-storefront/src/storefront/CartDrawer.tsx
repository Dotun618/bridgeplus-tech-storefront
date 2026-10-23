import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CartRow } from './utils';
import { formatMoney } from './utils';

type CartDrawerProps = {
  open: boolean;
  cart: CartRow[];
  subtotal: number;
  onClose: () => void;
  onChangeQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
};

export function CartDrawer({ open, cart, subtotal, onClose, onChangeQuantity, onRemove, onCheckout }: CartDrawerProps) {
  if (!open) return null;
  const count = cart.reduce((sum, row) => sum + row.quantity, 0);
  const unpricedCount = cart.filter(({ product }) => product.price === null).length;
  const backdropClose = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  return <div className="drawer-backdrop" role="presentation" onMouseDown={backdropClose}>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="drawer-header">
        <div><p className="eyebrow">YOUR SELECTION</p><h2 id="cart-title">Shopping bag <span>({count})</span></h2></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close shopping bag"><X /></button>
      </div>
      {cart.length === 0 ? <div className="empty-cart">
        <div className="empty-cart-icon"><ShoppingBag size={28} /></div><h3>Your bag is waiting.</h3>
        <p>Explore the catalogue and add items you would like BridgePlus to confirm.</p>
        <button type="button" className="primary-button" onClick={onClose}>Continue browsing <ArrowRight size={16} /></button>
      </div> : <>
        <div className="cart-items">
          {cart.map(({ product, quantity }) => <div className="cart-item" key={product.id}>
            <div className="cart-item-image" aria-hidden="true"><ShoppingBag size={25} strokeWidth={1.4} /></div>
            <div className="cart-item-copy">
              <p className="product-brand">{product.brand}</p><h3>{product.name}</h3>
              <strong>{product.price === null ? 'Price to be confirmed' : `${formatMoney(product.price)} each (demo)`}</strong>
              <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                <button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => onChangeQuantity(product.id, quantity - 1)}><Minus size={13} /></button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => onChangeQuantity(product.id, quantity + 1)}><Plus size={13} /></button>
              </div>
            </div>
            <button type="button" className="remove-link" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`}>Remove</button>
          </div>)}
        </div>
        <div className="cart-summary">
          <div className="summary-row"><span>Known-price subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
          <div className="summary-row provisional-row"><span>Provisional total, priced items only</span><strong>{formatMoney(subtotal)}</strong></div>
          <p className="muted-small">Demo prices only. {unpricedCount > 0 ? `${unpricedCount} unpriced listing(s) are excluded. ` : ''}Delivery fee is unconfirmed; any delivery total is provisional.</p>
          <button type="button" className="primary-button full-button" onClick={onCheckout}>Continue to checkout <ArrowRight size={17} /></button>
          <button type="button" className="text-button full-button" onClick={onClose}>Continue browsing</button>
        </div>
      </>}
    </aside>
  </div>;
}

