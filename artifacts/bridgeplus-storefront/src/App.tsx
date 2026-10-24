import { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
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
import type { Category, CatalogProduct } from './storefront/catalogTypes';
import {
  deleteProduct, fetchAdminCatalog, fetchPublicCatalog, getCurrentAdminEmail,
  saveCategory, saveProduct, setCategoryActive, signInAdmin, signOutAdmin,
} from './storefront/catalogApi';
import { isSupabaseConfigured, supabase } from './storefront/supabase';
import type { CartRow } from './storefront/utils';
import { buildWhatsAppUrl, formatMoney } from './storefront/utils';
import { AdminPanel } from './admin/AdminPanel';
import { AdminSignIn } from './admin/AdminSignIn';
import type { AdminPanelProps, AdminSignInProps } from './admin/types';

function StorefrontHome() {
  const [cart, setCart] = useState<CartRow[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All products');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const subtotal = useMemo(() => cart.reduce((sum, row) => sum + (row.product.price ?? 0) * row.quantity, 0), [cart]);
  const cartCount = cart.reduce((sum, row) => sum + row.quantity, 0);

  useEffect(() => {
    let current = true;
    fetchPublicCatalog()
      .then((catalog) => {
        if (!current) return;
        setProducts(catalog.products);
        setCategories(catalog.categories);
        setCatalogError('');
      })
      .catch((error: unknown) => {
        if (!current) return;
        setCatalogError(error instanceof Error ? error.message : 'The catalogue could not be loaded.');
      })
      .finally(() => { if (current) setCatalogLoading(false); });
    return () => { current = false; };
  }, []);

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
      categories={categories.map((category) => category.name)}
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

      {products.some((product) => product.demo) ? <div className="demo-banner" role="note">
        <CircleHelp size={17} aria-hidden="true" />
        <span><strong>Demo listings are for illustration.</strong> They are not verified stock or current pricing. Confirm model, availability and price with BridgePlus before ordering.</span>
      </div> : <div className="catalog-note" role="note">
        <CircleHelp size={16} aria-hidden="true" />
        <span>Confirm product availability, final prices, delivery charges and arrangements with BridgePlus before ordering.</span>
      </div>}

      <ProductCatalog
        search={search}
        setSearch={setSearch}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onAdd={addToCart}
        onView={setSelectedProduct}
        products={products}
        categories={categories.map((category) => category.name)}
        loading={catalogLoading}
        error={catalogError}
      />

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
        <div className="footer-column"><h3>Shop</h3><a href="#home">Home</a><a href="#shop" onClick={() => setActiveCategory('All products')}>All catalogue listings</a>{categories.slice(0, 3).map((category) => <a key={category.id} href="#shop" onClick={() => setActiveCategory(category.name)}>{category.name}</a>)}</div>
        <div className="footer-column"><h3>Order support</h3><a href={generalWhatsApp} target="_blank" rel="noreferrer">Ask about a product</a><button type="button" onClick={() => announce('Ask BridgePlus to confirm delivery charges and pickup arrangements before ordering.')}>Delivery and pickup</button><button type="button" onClick={() => announce('No warranty or returns terms are stated here. Confirm any applicable terms with BridgePlus.')}>Product terms</button></div>
        <div className="footer-column footer-contact"><h3>Let’s talk tech.</h3><p>Contact BridgePlus about product details and ordering.</p><a className="footer-contact-link" href={generalWhatsApp} target="_blank" rel="noreferrer">Message on WhatsApp <ArrowRight size={15} /></a><p className="footer-number">{businessConfig.supportPhone}</p><a className="admin-entry-link" href="/admin/login">Administrator sign-in</a></div>
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

function AdminSetupNotice() {
  return <main className="bp-admin admin-setup-page">
    <div className="admin-setup-card">
      <p className="admin-eyebrow">SUPABASE SETUP</p>
      <h1>Catalogue connection needed</h1>
      <p>Add the public Supabase project URL and anonymous key to the storefront environment, then apply the SQL migration in the project README.</p>
      <a className="admin-button primary" href="/">Back to storefront</a>
    </div>
  </main>;
}

function AdminLoginRoute() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getCurrentAdminEmail()
      .then((email) => { if (active && email) setLocation('/admin'); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not check the administrator session.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [setLocation]);

  const onSignIn: AdminSignInProps['onSignIn'] = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      await signInAdmin(email, password);
      setLocation('/admin');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Sign-in was unsuccessful.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) return <AdminSetupNotice />;
  return <AdminSignIn loading={loading} error={error} onSignIn={onSignIn} />;
}

function AdminDashboardRoute() {
  const [, setLocation] = useLocation();
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError('');
    try {
      const catalog = await fetchAdminCatalog();
      setProducts(catalog.products);
      setCategories(catalog.categories);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The catalogue could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setCheckingSession(false);
      return;
    }
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setLocation('/admin/login');
    });
    getCurrentAdminEmail()
      .then((email) => {
        if (!active) return;
        if (!email) {
          setLocation('/admin/login');
          return;
        }
        setCurrentUserEmail(email);
        void refresh();
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not verify administrator access.');
      })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [refresh, setLocation]);

  const onSignOut: AdminPanelProps['onSignOut'] = async () => {
    await signOutAdmin();
    setLocation('/admin/login');
  };
  const onSaveProduct: AdminPanelProps['onSaveProduct'] = async (draft, images, productId) => {
    setNotice('');
    setError('');
    const savedProductId = await saveProduct(draft, images, productId);
    setNotice(productId ? 'Product changes saved.' : 'Product added.');
    return savedProductId;
  };
  const onDeleteProduct: AdminPanelProps['onDeleteProduct'] = async (productId) => {
    setNotice('');
    setError('');
    await deleteProduct(productId);
    setNotice('Product deleted.');
  };
  const onSaveCategory: AdminPanelProps['onSaveCategory'] = async (draft, categoryId) => {
    setNotice('');
    setError('');
    await saveCategory(draft, categoryId);
    setNotice(categoryId ? 'Category changes saved.' : 'Category added.');
  };
  const onSetCategoryActive: AdminPanelProps['onSetCategoryActive'] = async (categoryId, active) => {
    setNotice('');
    setError('');
    await setCategoryActive(categoryId, active);
    setNotice(active ? 'Category reactivated.' : 'Category deactivated.');
  };

  if (!isSupabaseConfigured) return <AdminSetupNotice />;
  if (checkingSession) return <main className="admin-loading-page" role="status">Checking administrator access…</main>;
  if (!currentUserEmail) return <main className="admin-loading-page" role="alert">
    <p>{error || 'Administrator access is required.'}</p>
    <a href="/admin/login">Go to administrator sign-in</a>
  </main>;

  return <AdminPanel
    currentUserEmail={currentUserEmail}
    products={products}
    categories={categories}
    loading={loading}
    error={error}
    notice={notice}
    onRefresh={() => { void refresh(); }}
    onSignOut={() => onSignOut().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Sign out failed.'))}
    onSaveProduct={onSaveProduct}
    onDeleteProduct={onDeleteProduct}
    onSaveCategory={onSaveCategory}
    onSetCategoryActive={onSetCategoryActive}
  />;
}

function NotFoundRoute() {
  return <main className="admin-loading-page"><h1>Page not found</h1><a href="/">Return to the BridgePlus storefront</a></main>;
}

export default function App() {
  return <Switch>
    <Route path="/" component={StorefrontHome} />
    <Route path="/admin/login" component={AdminLoginRoute} />
    <Route path="/admin" component={AdminDashboardRoute} />
    <Route component={NotFoundRoute} />
  </Switch>;
}
