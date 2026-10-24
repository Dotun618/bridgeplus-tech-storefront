import {
  ArrowDownRight, ArrowRight, Camera, CircleHelp, Gamepad2, Headphones,
  Laptop, Monitor, Plus, Search, ShoppingBag, Smartphone, Speaker, Tablet, Watch, X,
} from 'lucide-react';
import type { MouseEvent } from 'react';
import type { Product } from './products';
import { formatMoney } from './utils';

const categoryIcons: Record<string, typeof Smartphone> = {
  Apple: Smartphone,
  'Google Pixel': Smartphone,
  DJI: Camera,
  Meta: Watch,
  Headphones,
  Speakers: Speaker,
  'Smart-home devices': Watch,
  'Gaming monitors': Monitor,
  'Gaming PCs & desktops': Laptop,
  Accessories: Gamepad2,
};

const productIcons: Record<Product['icon'], typeof Smartphone> = {
  phone: Smartphone, camera: Camera, monitor: Monitor, desktop: Laptop,
  headphones: Headphones, speaker: Speaker, tablet: Tablet, watch: Watch, smart: Watch,
};

function Illustration({ product }: { product: Product }) {
  const Icon = productIcons[product.icon];
  if (product.imageUrl) {
    return <img className="product-catalog-image" src={product.imageUrl} alt="" loading="lazy" />;
  }
  return <span className="product-illustration" aria-hidden="true"><Icon size={48} strokeWidth={1.3} /></span>;
}

function ProductCard({ product, onView, onAdd }: {
  product: Product; onView: (product: Product) => void; onAdd: (product: Product) => void;
}) {
  return <article className="product-card" data-testid={`card-product-${product.id}`}>
    <button type="button" className="product-image-wrap" onClick={() => onView(product)} aria-label={`View details for ${product.name}`}>
      <span className="product-badge">{product.badge}</span>
      <Illustration product={product} />
      <span className="quick-view">View details <ArrowRight size={14} /></span>
    </button>
    <div className="product-info">
      <p className="product-brand">{product.brand}</p>
      <button type="button" className="product-title" onClick={() => onView(product)}>{product.name}</button>
      <p className="product-description">{product.description}</p>
      <div className="product-card-bottom">
        {product.price === null ? <strong className="price-unconfirmed">Price to be confirmed</strong> : <strong>{formatMoney(product.price)}</strong>}
        <button type="button" className="add-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to bag`}><Plus size={17} /></button>
      </div>
    </div>
  </article>;
}

export function ProductCatalog({ search, setSearch, activeCategory, setActiveCategory, onAdd, onView, products, categories, loading, error }: {
  search: string;
  setSearch: (value: string) => void;
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  onAdd: (product: Product) => void;
  onView: (product: Product) => void;
  products: Product[];
  categories: string[];
  loading: boolean;
  error: string;
}) {
  const categoryOptions = ['All products', ...categories];
  const query = search.trim().toLowerCase();
  const filtered = products.filter((product) =>
    (activeCategory === 'All products' || product.category === activeCategory) &&
    (!query || [product.name, product.brand, product.category, product.description].join(' ').toLowerCase().includes(query)),
  );

  return <>
    <section className="category-section section-pad" aria-labelledby="category-title">
      <div className="section-heading">
        <div><p className="eyebrow">FIND YOUR NEXT FAVOURITE</p><h2 id="category-title">Shop by category<span>.</span></h2><p>Start with what you are looking for.</p></div>
        <a className="arrow-link" href="#shop">Browse all items <ArrowRight size={16} /></a>
      </div>
      <div className="category-grid">
          {categories.map((category) => {
          const Icon = categoryIcons[category] ?? Smartphone;
          const count = products.filter((product) => product.category === category).length;
          return <button type="button" key={category} className={`category-card ${activeCategory === category ? 'category-selected' : ''}`} aria-pressed={activeCategory === category} onClick={() => {
            setActiveCategory(category); setSearch(''); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <span className="category-icon"><Icon size={25} strokeWidth={1.6} /></span>
            <span className="category-card-title">{category}</span>
             <span className="category-card-bottom"><span>{count ? `${count} ${count === 1 ? 'listing' : 'listings'}` : 'No listings yet'}</span><ArrowDownRight size={17} /></span>
          </button>;
        })}
      </div>
    </section>

    <section className="shop-section section-pad" id="shop" aria-labelledby="shop-title">
      <div className="section-heading shop-heading">
       <div><p className="eyebrow">BRIDGEPLUS TECH CATALOGUE</p><h2 id="shop-title">Find your next device<span>.</span></h2><p>Browse current listings, then ask BridgePlus to confirm details.</p></div>
        <label className="catalog-search"><Search size={17} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the catalogue" aria-label="Search catalogue" />{search && <button type="button" className="icon-button" onClick={() => setSearch('')} aria-label="Clear catalogue search"><X size={14} /></button>}</label>
      </div>
      <div className="filter-row">
        <div className="filter-pills" aria-label="Filter catalogue by category">
          {categoryOptions.map((category) => <button type="button" key={category} className={`filter-pill ${activeCategory === category ? 'active' : ''}`} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>)}
        </div>
        <span className="results-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}</span>
      </div>
      {loading ? <div className="catalog-message" role="status"><span className="catalog-spinner" />Loading the live catalogue…</div>
        : error ? <div className="catalog-message catalog-message-error" role="alert"><CircleHelp size={24} /><h3>Catalogue unavailable</h3><p>{error}</p><p>Product listings are not shown until the catalogue connection is available.</p></div>
          : filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onView={onView} />)}</div>
            : products.length === 0 ? <div className="no-results">
              <ShoppingBagIcon /><h3>No products published yet</h3><p>BridgePlus will add products to the catalogue when they are ready to share.</p>
            </div> : <div className="no-results">
        <Search size={27} aria-hidden="true" /><h3>No matching listings</h3><p>Try another search or reset your category filter.</p>
        <button type="button" className="secondary-button" onClick={() => { setSearch(''); setActiveCategory('All products'); }}>Clear filters</button>
      </div>}
      {!loading && !error && products.some((product) => product.demo) && <p className="catalog-disclaimer"><CircleHelp size={13} /> Demo listings are examples, not verified stock or pricing. Confirm product model, availability and all prices with BridgePlus before ordering.</p>}
    </section>
  </>;
}

function ShoppingBagIcon() {
  return <ShoppingBag size={27} aria-hidden="true" />;
}

export function ProductModal({ product, onClose, onAdd }: {
  product: Product | null; onClose: () => void; onAdd: (product: Product) => void;
}) {
  if (!product) return null;
  const add = () => { onAdd(product); onClose(); };
  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };
  return <div className="modal-backdrop" role="presentation" onMouseDown={handleBackdrop}>
    <section className="product-modal modal-panel" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <button type="button" className="modal-close icon-button" onClick={onClose} aria-label="Close product details"><X /></button>
      <div className="modal-product-image"><Illustration product={product} /></div>
      <div className="modal-product-copy">
        <p className="eyebrow">{product.brand} / {product.category}</p>
        <h2 id="product-modal-title">{product.name}</h2>
        <p className="modal-price">{product.price === null ? 'Price to be confirmed' : formatMoney(product.price)}</p>
        <p>{product.description}</p>
        <p className="demo-inline"><CircleHelp size={16} /> {product.demo ? 'Unverified demo data. ' : ''}Confirm the exact model, price and availability with BridgePlus.</p>
        <button type="button" className="primary-button full-button" onClick={add}>Add to bag <ArrowRight size={17} /></button>
      </div>
    </section>
  </div>;
}

