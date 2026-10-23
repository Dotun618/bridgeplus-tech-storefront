import { useMemo, useState } from 'react';
import {
  ArrowRight, Camera, Check, CircleHelp, MessageCircle, ShieldCheck, ShoppingBag,
  Smartphone, Truck,
} from 'lucide-react';
import { Header } from './storefront/Header';
import { ProductCatalog, ProductModal } from './storefront/ProductCatalog';
import { CartDrawer } from './storefront/CartDrawer';
import { CheckoutModal } from './storefront/CheckoutModal';
import { businessConfig } from './storefront/config';
import type { Product } from './storefront/products';
import { categories } from './storefront/products';
import type { CartRow } from './storefront/utils';
import { buildWhatsAppUrl, formatMoney } from './storefront/utils';

function App() {
  const [cart, setCart] = useState<CartRow[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All products');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const subtotal = useMemo(() => cart.reduce((sum, row) => sum + (row.product.price ?? 0) * row.quantity, 0), [cart]);
  const cartCount = cart.reduce((sum, row) => sum + row.quantity, 0);

  function announce(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }
  function addToCart(product: Product) {
    setCart((old) => {
      const existing = old.find((row) => row.product.id === product.id);
      return existing
        ? old.map((row) => row.product.id === product.id ? { ...row, quantity: Math.min(99, row.quantity + 1) } : row)
        : [...old, { product, quantity: 1 }];
    });
    announce(`${product.name} added to your bag`);
  }
  function changeQuantity(id: string, quantity: number) {
    if (quantity < 1) {
      setCart((old) => old.filter((row) => row.product.id !== id));
      announce('Item removed from your bag');
      return;
    }
    setCart((old) => old.map((row) => row.product.id === id ? { ...row, quantity: Math.min(99, quantity) } : row));
  }
  function removeFromCart(id: string) {
    setCart((old) => old.filter((row) => row.product.id !== id));
    announce('Item removed from your bag');
  }
  function startCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }
  const generalWhatsApp = buildWhatsAppUrl(businessConfig.whatsappNumber, `Hello ${businessConfig.businessName}, I have a question about the catalogue.`);

  return <div className="app-shell">
    <Header
      cartCount={cartCount}
      onOpenCart={() => setCartOpen(true)}
      search={search}
      setSearch={setSearch}
      menuOpen={mobileMenuOpen}
      onToggleMenu={() => setMobileMenuOpen((value) => !value)}
      onCategory={setActiveCategory}
    />
    <main>
      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span /> SMART DEVICES <i aria-hidden="true">/</i> GREATER POSSIBILITIES</p>
          <h1>Technology that<br /><em>moves you.</em></h1>
          <p className="hero-subtitle">{businessConfig.tagline}</p>
          <p className="hero-description">Browse a considered mix of personal tech, audio, gaming and everyday accessories. Build a selection and ask BridgePlus to confirm the details.</p>
          <a className="primary-button hero-cta" href="#shop">Explore the catalogue <ArrowRight size={17} /></a>
          <div className="hero-footnote"><ShieldCheck size={16} /> Personal assistance from BridgePlus Tech</div>
        </div>
        <div className="hero-art" aria-label="Illustrated collection of personal technology">
          <div className="hero-disc" />
          <div className="device-stack" aria-hidden="true">
            <div className="device-tile device-phone"><Smartphone size={42} strokeWidth={1.25} /></div>
            <div className="device-tile device-lens"><Camera size={57} strokeWidth={1.25} /></div>
            <div className="device-tile device-display" />
          </div>
          <div className="hero-floating-note"><span className="floating-dot" /> Browse. Ask. Confirm.</div>
        </div>
      </section>

      <div className="demo-banner" role="note">
        <CircleHelp size={17} aria-hidden="true" />
        <span><strong>Unverified demo catalogue.</strong> All supplied product listings and numeric prices are illustrative, not confirmed stock or current pricing. Confirm model, availability and price with BridgePlus before ordering.</span>
      </div>

      <ProductCatalog search={search} setSearch={setSearch} activeCategory={activeCategory} setActiveCategory={setActiveCategory} onAdd={addToCart} onView={setSelectedProduct} />

      <section className="service-strip section-pad" aria-label="How ordering works">
        <div className="service-item"><span><Truck size={22} /></span><div><strong>Choose fulfilment</strong><p>Delivery or pickup request</p></div></div>
        <div className="service-item"><span><ShieldCheck size={22} /></span><div><strong>Confirm the details</strong><p>Availability and price with BridgePlus</p></div></div>
        <div className="service-item"><span><MessageCircle size={22} /></span><div><strong>WhatsApp request</strong><p>Review and send your message</p></div></div>
        <div className="service-item"><span><CircleHelp size={22} /></span><div><strong>Payment instructions</strong><p>Agree methods with BridgePlus</p></div></div>
      </section>

      <section className="closing-banner section-pad">
        <div><p className="eyebrow">A BETTER WAY TO FIND YOUR TECH</p><h2>Know what you want?<br /><em>Let’s talk.</em></h2><p>Build your selection, then agree product details and payment with BridgePlus on WhatsApp.</p></div>
        <a href={generalWhatsApp} target="_blank" rel="noreferrer" className="primary-button">Chat with BridgePlus <MessageCircle size={17} /></a>
      </section>
    </main>
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <a className="brand-link" href="#home" aria-label="BridgePlus Tech home"><div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><span>B</span><i>+</i></div><div className="brand-name">BridgePlus <span>Tech</span></div></div></a>
          <p>Smart devices.<br />Greater possibilities.</p>
          <a className="footer-whatsapp" href={generalWhatsApp} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Chat with BridgePlus</a>
        </div>
        <div className="footer-column"><h3>Shop</h3><a href="#home">Home</a><a href="#shop" onClick={() => setActiveCategory('All products')}>All catalogue listings</a>{categories.slice(1, 4).map((category) => <a key={category} href="#shop" onClick={() => setActiveCategory(category)}>{category}</a>)}</div>
        <div className="footer-column"><h3>Order support</h3><a href={generalWhatsApp} target="_blank" rel="noreferrer">Ask about a product</a><button type="button" onClick={() => announce('Ask BridgePlus to confirm delivery charges and pickup arrangements before ordering.')}>Delivery and pickup</button><button type="button" onClick={() => announce('No warranty or returns terms are stated here. Confirm any applicable terms with BridgePlus.')}>Product terms</button></div>
        <div className="footer-column footer-contact"><h3>Let’s talk tech.</h3><p>Contact BridgePlus about product details and ordering.</p><a className="footer-contact-link" href={generalWhatsApp} target="_blank" rel="noreferrer">Message on WhatsApp <ArrowRight size={15} /></a><p className="footer-number">{businessConfig.supportPhone}</p></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {businessConfig.businessName}</span><span>Order requests are not confirmations. No payment is collected here.</span><a href="#home">Back to top</a></div>
    </footer>

    <button type="button" className="floating-cart" onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${cartCount} items`}><ShoppingBag size={19} /><span>Bag</span><b>{cartCount}</b></button>
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} subtotal={subtotal} onChangeQuantity={changeQuantity} onRemove={removeFromCart} onCheckout={startCheckout} />
    <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} cart={cart} subtotal={subtotal} />
    <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
  </div>;
}

export default App;
