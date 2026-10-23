import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { ArrowRight, Check, Copy, MessageCircle, PackageCheck, Truck, X } from 'lucide-react';
import { businessConfig } from './config';
import type { CartRow, CheckoutForm } from './utils';
import { buildOrderMessage, buildWhatsAppUrl, formatMoney, initialForm, makeOrderReference } from './utils';

type CheckoutModalProps = { open: boolean; onClose: () => void; cart: CartRow[]; subtotal: number };
type PreparedOrder = { orderRef: string; message: string; url: string };

export function CheckoutModal({ open, onClose, cart, subtotal }: CheckoutModalProps) {
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedOrder, setGeneratedOrder] = useState<PreparedOrder | null>(null);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  const itemCount = cart.reduce((sum, row) => sum + row.quantity, 0);
  const unpricedCount = cart.reduce((sum, row) => sum + (row.product.price === null ? row.quantity : 0), 0);
  const updateField = <K extends keyof CheckoutForm>(name: K, value: CheckoutForm[K]) => {
    setForm((old) => ({ ...old, [name]: value }));
    setErrors((old) => ({ ...old, [name]: '' }));
    setGeneratedOrder(null);
    setCopyStatus('');
  };

  function prepareOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name.';
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) next.phone = 'Enter a valid phone number.';
    if (form.fulfilment === 'delivery' && form.address.trim().length < 8) next.address = 'Enter a complete delivery address.';
    setErrors(next);
    if (Object.keys(next).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    const orderRef = makeOrderReference();
    const message = buildOrderMessage({ orderRef, form, cart, subtotal });
    setGeneratedOrder({ orderRef, message, url: buildWhatsAppUrl(businessConfig.whatsappNumber, message) });
    setCopyStatus('');
  }

  async function copyOrder() {
    if (!generatedOrder) return;
    try {
      await navigator.clipboard.writeText(generatedOrder.message);
      setCopyStatus('Request details copied. Paste them into WhatsApp and send when ready.');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generatedOrder.message;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyStatus(copied ? 'Request details copied. Paste them into WhatsApp and send when ready.' : 'Copy was blocked. Select and copy the order text below.');
    }
  }

  const backdropClose = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  return <div className="modal-backdrop checkout-backdrop" role="presentation" onMouseDown={backdropClose}>
    <section className="checkout-modal modal-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <button type="button" className="modal-close icon-button" onClick={onClose} aria-label="Close checkout"><X /></button>
      {!generatedOrder ? <>
        <div className="checkout-heading"><p className="eyebrow">ORDER REQUEST</p><h2 id="checkout-title">Checkout</h2><p>Review your details, then prepare a message to BridgePlus on WhatsApp.</p></div>
        <div className="checkout-order-preview">
          <div><span>{itemCount} item(s) · known-price subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
          <div className="preview-total"><span>Provisional total, priced items only</span><strong>{formatMoney(subtotal)}</strong></div>
          <p>{unpricedCount ? `${unpricedCount} unpriced item(s) excluded from subtotal. ` : ''}Demo prices are unverified. Delivery fee and final total are unconfirmed.</p>
        </div>
        <form className="checkout-form" onSubmit={prepareOrder} noValidate>
          <label>Full name <span className="required">*</span>
            <input autoComplete="name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Your full name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'checkout-name-error' : undefined} />
            {errors.name && <small className="field-error" id="checkout-name-error">{errors.name}</small>}
          </label>
          <label>Phone number <span className="required">*</span>
            <input autoComplete="tel" inputMode="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="e.g. 08012345678" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'checkout-phone-error' : undefined} />
            {errors.phone && <small className="field-error" id="checkout-phone-error">{errors.phone}</small>}
          </label>
          <fieldset className="fulfilment-options">
            <legend>How would you like to receive your order?</legend>
            <label className={`fulfilment-option ${form.fulfilment === 'delivery' ? 'selected' : ''}`}>
              <input type="radio" name="fulfilment" value="delivery" checked={form.fulfilment === 'delivery'} onChange={() => updateField('fulfilment', 'delivery')} />
              <Truck size={19} aria-hidden="true" /><span><strong>Delivery</strong><small>Address required; fee unconfirmed</small></span>
            </label>
            <label className={`fulfilment-option ${form.fulfilment === 'pickup' ? 'selected' : ''}`}>
              <input type="radio" name="fulfilment" value="pickup" checked={form.fulfilment === 'pickup'} onChange={() => updateField('fulfilment', 'pickup')} />
              <PackageCheck size={19} aria-hidden="true" /><span><strong>Pickup</strong><small>Details to be confirmed with BridgePlus</small></span>
            </label>
          </fieldset>
          {form.fulfilment === 'delivery' && <>
            <label>Delivery address <span className="required">*</span>
              <textarea autoComplete="street-address" value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Street, area, city and state" rows={3} aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'checkout-address-error' : undefined} />
              {errors.address && <small className="field-error" id="checkout-address-error">{errors.address}</small>}
            </label>
            <label>Delivery notes <span className="optional">(optional)</span>
              <input value={form.deliveryNotes} onChange={(event) => updateField('deliveryNotes', event.target.value)} placeholder="Landmark or helpful directions" />
            </label>
          </>}
          <label>Order note <span className="optional">(optional)</span>
            <textarea value={form.customerNote} onChange={(event) => updateField('customerNote', event.target.value)} placeholder="Colour, model preference or questions" rows={2} />
          </label>
          <div className="payment-note"><MessageCircle size={19} aria-hidden="true" /><div><strong>Agree payment methods with BridgePlus on WhatsApp</strong><p>No payment is taken here. Ask BridgePlus to confirm an available method and provide instructions before paying.</p></div></div>
          <button className="primary-button full-button" type="submit">Prepare WhatsApp request <ArrowRight size={17} /></button>
          <p className="privacy-note">Your details are included only in the message you choose to send. This storefront does not store orders.</p>
        </form>
      </> : <div className="order-ready">
        <div className="success-icon"><Check size={28} /></div>
        <p className="eyebrow">MESSAGE PREPARED</p><h2 id="checkout-title">Ready for WhatsApp.</h2>
        <p className="order-reference">Request reference: <strong>{generatedOrder.orderRef}</strong></p>
        <div className="status-callout"><span className="status-dot" /><div><strong>Awaiting BridgePlus confirmation</strong><p>Preparing or copying this message is not an order confirmation or proof of payment.</p></div></div>
        <div className="message-preview"><pre>{generatedOrder.message}</pre></div>
        <a className="whatsapp-button full-button" href={generatedOrder.url} target="_blank" rel="noreferrer"><MessageCircle size={19} /> Open WhatsApp to send request</a>
        <button type="button" className="secondary-button full-button" onClick={copyOrder}><Copy size={17} /> Copy request details</button>
        {copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
        <p className="privacy-note">Review the message and tap Send in WhatsApp. BridgePlus must confirm stock, final prices, any delivery charge, arrangements and payment instructions.</p>
        <button type="button" className="text-button full-button" onClick={() => { setGeneratedOrder(null); setCopyStatus(''); }}>Back to checkout</button>
      </div>}
    </section>
  </div>;
}

