import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle, Archive, Camera, Check, ChevronDown, CirclePlus, ImagePlus, LogOut, PackageOpen,
  Pencil, RefreshCw, Search, ShieldCheck, Smartphone, Star, Trash2, Upload, X,
} from 'lucide-react';
import type { CatalogProduct, Category, CategoryDraft, ImageDraft, ProductDraft } from '../storefront/catalogTypes';
import type { AdminPanelProps } from './types';
import './admin.css';

const iconChoices: ProductDraft['icon'][] = ['phone', 'camera', 'monitor', 'desktop', 'headphones', 'speaker', 'tablet', 'watch', 'smart'];
const money = (amount: number | null) => amount === null ? 'Price on request' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function draftFromProduct(product: CatalogProduct): ProductDraft {
  return {
    name: product.name, slug: product.slug, brand: product.brand, categoryId: product.categoryId,
    description: product.description, price: product.price, previousPrice: product.previousPrice,
    sku: product.sku, stockQuantity: product.stockQuantity, active: product.active,
    featured: product.featured, demo: product.demo, icon: product.icon,
  };
}
function blankDraft(categoryId: string): ProductDraft {
  return {
    name: '', slug: '', brand: '', categoryId, description: '', price: null,
    previousPrice: null, sku: '', stockQuantity: 0, active: false, featured: false,
    demo: false, icon: 'phone',
  };
}
function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AdminPanel(props: AdminPanelProps) {
  const { currentUserEmail, products, categories, loading, error, notice, onRefresh, onSignOut, onSaveProduct, onDeleteProduct, onSaveCategory, onDeactivateCategory } = props;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null);
  const [draft, setDraft] = useState<ProductDraft>(() => products[0] ? draftFromProduct(products[0]) : blankDraft(categories[0]?.id ?? ''));
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [modal, setModal] = useState<'delete' | 'category' | 'deactivate' | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>({ name: '', slug: '', sortOrder: categories.length });
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [deletePhrase, setDeletePhrase] = useState('');

  const selected = products.find((product) => product.id === selectedId) ?? null;
  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const filteredProducts = useMemo(() => sortedProducts.filter((product) => {
    const phrase = search.toLowerCase().trim();
    const matchesSearch = !phrase || [product.name, product.brand, product.sku, product.category].some((value) => value.toLowerCase().includes(phrase));
    const matchesFilter = filter === 'all' || (filter === 'active' && product.active) || (filter === 'inactive' && !product.active) || (filter === 'featured' && product.featured);
    return matchesSearch && matchesFilter;
  }), [sortedProducts, search, filter]);
  const activeCount = products.filter((product) => product.active).length;
  const featuredCount = products.filter((product) => product.featured).length;

  function chooseProduct(product: CatalogProduct) {
    setSelectedId(product.id);
    setDraft(draftFromProduct(product));
    setImages(product.images.map((image) => ({ ...image })));
    setEditing(false);
    setFeedback('');
  }
  function createProduct() {
    const defaultCategory = categories.find((category) => category.active) ?? categories[0];
    setSelectedId(null);
    setDraft(blankDraft(defaultCategory?.id ?? ''));
    setImages([]);
    setEditing(true);
    setFeedback('');
  }
  function setDraftValue<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function updateImage(index: number, patch: Partial<ImageDraft>) {
    setImages((old) => old.map((image, at) => at === index ? { ...image, ...patch } : image));
  }
  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setImages((old) => {
      const additions = files.map((file, index): ImageDraft => ({
        file, url: URL.createObjectURL(file), alt: draft.name ? `${draft.name} product image` : file.name,
        sortOrder: old.length + index, isPrimary: old.length === 0 && index === 0,
      }));
      return [...old, ...additions];
    });
    event.target.value = '';
  }
  function replaceImage(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateImage(index, { file, url: URL.createObjectURL(file) });
    event.target.value = '';
  }
  function removeImage(index: number) {
    setImages((old) => {
      const next = old.filter((_, at) => at !== index).map((image, at) => ({ ...image, sortOrder: at }));
      if (old[index]?.isPrimary && next[0]) next[0] = { ...next[0], isPrimary: true };
      return next;
    });
  }
  function makePrimary(index: number) {
    setImages((old) => old.map((image, at) => ({ ...image, isPrimary: at === index, sortOrder: at })));
  }
  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.categoryId) {
      setFeedback('Add or activate a category before saving a product.');
      return;
    }
    const normalizedImages = images.map((image, index) => ({ ...image, sortOrder: index, isPrimary: images.length ? (image.isPrimary || (!images.some((entry) => entry.isPrimary) && index === 0)) : false }));
    setSaving(true);
    setFeedback('');
    try {
      await onSaveProduct({ ...draft, slug: draft.slug || slugify(draft.name) }, normalizedImages, selectedId ?? undefined);
      setFeedback('Listing saved successfully.');
      setEditing(false);
      onRefresh();
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Could not save this listing. Review the details and try again.');
    } finally {
      setSaving(false);
    }
  }
  async function confirmDelete() {
    if (!selected || deletePhrase !== selected.name) return;
    setSaving(true);
    try {
      await onDeleteProduct(selected.id);
      setModal(null);
      setDeletePhrase('');
      setSelectedId(null);
      setDraft(blankDraft(categories.find((category) => category.active)?.id ?? ''));
      setImages([]);
      setEditing(false);
      setFeedback('Listing deleted.');
      onRefresh();
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Could not delete this listing. Please try again.');
      setModal(null);
    } finally {
      setSaving(false);
    }
  }
  function openCategory(category?: Category) {
    setCategoryId(category?.id);
    setCategoryDraft(category ? { name: category.name, slug: category.slug, sortOrder: category.sortOrder } : { name: '', slug: '', sortOrder: categories.length });
    setModal('category');
  }
  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await onSaveCategory({ ...categoryDraft, slug: categoryDraft.slug || slugify(categoryDraft.name) }, categoryId);
      setModal(null);
      setFeedback(categoryId ? 'Category updated.' : 'Category added.');
      onRefresh();
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Could not save this category. Please try again.');
    } finally {
      setSaving(false);
    }
  }
  async function deactivateCategory() {
    const target = categories.find((category) => category.id === categoryId);
    if (!target) return;
    setSaving(true);
    try {
      await onDeactivateCategory(target.id);
      setModal(null);
      setFeedback(`${target.name} has been deactivated.`);
      onRefresh();
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Could not deactivate this category. Please try again.');
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bp-admin">
      <header className="admin-header">
        <div className="admin-brand"><span className="admin-brand-mark" aria-hidden="true">B</span><span className="admin-brand-name">BridgePlus <span>Tech</span></span></div>
        <div className="admin-header-right">
          <span className="admin-user-email">{currentUserEmail}</span>
          <button type="button" className="admin-button secondary" onClick={onSignOut} data-testid="button-signout"><LogOut size={14} /> Sign out</button>
        </div>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="Catalogue management">
          <nav className="admin-nav">
            <button type="button" className="admin-nav-item active" aria-current="page"><PackageOpen size={15} /> Products</button>
            <button type="button" className="admin-nav-item" onClick={() => document.getElementById('admin-categories')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><Archive size={15} /> Categories</button>
          </nav>
          <div className="admin-side-note"><strong><ShieldCheck size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />Changes are inspectable</strong>Save a listing only when its details and imagery are ready for the public catalogue.</div>
        </aside>
        <main className="admin-main">
          <div className="admin-page-heading">
            <div><p className="admin-kicker">BRIDGEPLUS CATALOGUE</p><h1>Product management</h1><p>Maintain the listings customers browse and request.</p></div>
            <div className="admin-heading-actions">
              <button type="button" className="admin-button secondary" onClick={onRefresh} disabled={loading} data-testid="button-refresh"><RefreshCw size={14} /> Refresh</button>
              <button type="button" className="admin-button primary" onClick={createProduct} data-testid="button-add-product"><CirclePlus size={15} /> Add listing</button>
            </div>
          </div>
          {(error || notice || feedback) && <div className={`admin-alert ${notice || feedback.includes('saved') || feedback.includes('deleted') || feedback.includes('updated') || feedback.includes('added') || feedback.includes('deactivated') ? 'success' : ''}`} role={error ? 'alert' : 'status'}><span>{error || notice || feedback}</span></div>}
          <section className="admin-summary" aria-label="Catalogue summary">
            <div className="admin-stat"><div className="admin-stat-label">All listings</div><div className="admin-stat-value">{products.length}</div><div className="admin-stat-detail">Across active and archived</div></div>
            <div className="admin-stat"><div className="admin-stat-label">Public listings</div><div className="admin-stat-value">{activeCount}</div><div className="admin-stat-detail">Currently visible to customers</div></div>
            <div className="admin-stat"><div className="admin-stat-label">Featured</div><div className="admin-stat-value">{featuredCount}</div><div className="admin-stat-detail">Highlighted in the catalogue</div></div>
          </section>
          <div className="admin-workspace">
            <section className="admin-panel-card" aria-labelledby="products-title">
              <div className="admin-card-heading"><div><h2 id="products-title">Listings</h2><p>Search, filter, then select to inspect or edit.</p></div><span className="admin-count">{filteredProducts.length} shown</span></div>
              <div className="admin-list-tools">
                <label className="admin-search-wrap"><Search size={14} aria-hidden="true" /><span className="admin-screen-reader">Search listings</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, brand, SKU…" data-testid="input-product-search" /></label>
                <label><span className="admin-screen-reader">Filter listings</span><select className="admin-select-small" value={filter} onChange={(event) => setFilter(event.target.value)} data-testid="select-product-filter"><option value="all">All listings</option><option value="active">Public</option><option value="inactive">Inactive</option><option value="featured">Featured</option></select></label>
              </div>
              <div className="admin-product-list" aria-live="polite">
                {loading && products.length === 0 ? <>{[0, 1, 2, 3].map((item) => <div key={item} className="admin-skeleton admin-skeleton-row" />)}</>
                  : filteredProducts.length === 0 ? <div className="admin-filter-empty"><PackageOpen size={24} /><p>{products.length ? 'No listings match these filters.' : 'Your catalogue is ready for its first listing.'}</p>{!products.length && <button type="button" className="admin-button secondary" onClick={createProduct}>Add a listing</button>}</div>
                  : filteredProducts.map((product) => <div key={product.id} role="button" tabIndex={0} className={`admin-product-row ${selectedId === product.id && !editing ? 'selected' : ''}`} onClick={() => chooseProduct(product)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseProduct(product); } }} data-testid={`row-product-${product.id}`}>
                    <div className="admin-thumb">{product.images[0]?.url ? <img src={product.images[0].url} alt="" /> : <Smartphone size={19} />}</div>
                    <div className="admin-product-meta"><strong>{product.name}</strong><span>{product.brand || 'No brand'} · {product.category} · {money(product.price)}</span></div>
                    <div className="admin-row-status"><i className={`admin-status-dot ${product.active ? 'live' : ''}`} />{product.active ? 'Public' : 'Inactive'}{product.featured && <Star size={12} aria-label="Featured" />}</div>
                  </div>)}
              </div>
            </section>
            <section className="admin-panel-card admin-editor" aria-label={editing ? 'Edit listing' : 'Listing details'}>
              <div className="admin-card-heading"><div><h2>{editing ? (selected ? 'Edit listing' : 'New listing') : 'Listing details'}</h2><p>{editing ? 'Review all details before saving.' : selected ? 'Selected catalogue record' : 'Choose a listing or add one.'}</p></div>{selected && !editing && <button type="button" className="admin-icon-button" aria-label="Edit selected listing" onClick={() => setEditing(true)}><Pencil size={15} /></button>}</div>
              {editing ? <form onSubmit={saveProduct}>
                <div className="admin-editor-content">
                  <div className="admin-field-grid">
                    <div className="admin-field"><label htmlFor="product-name">Product name *</label><input id="product-name" className="admin-control" required value={draft.name} onChange={(event) => { const name = event.target.value; setDraft((old) => ({ ...old, name, slug: old.slug === slugify(old.name) || !old.slug ? slugify(name) : old.slug })); }} /></div>
                    <div className="admin-field"><label htmlFor="product-brand">Brand</label><input id="product-brand" className="admin-control" value={draft.brand} onChange={(event) => setDraftValue('brand', event.target.value)} /></div>
                    <div className="admin-field"><label htmlFor="product-slug">Public slug</label><input id="product-slug" className="admin-control" value={draft.slug} onChange={(event) => setDraftValue('slug', slugify(event.target.value))} /></div>
                    <div className="admin-field"><label htmlFor="product-sku">SKU</label><input id="product-sku" className="admin-control" value={draft.sku} onChange={(event) => setDraftValue('sku', event.target.value)} /></div>
                    <div className="admin-field"><label htmlFor="product-category">Category *</label><select id="product-category" className="admin-control" required value={draft.categoryId} onChange={(event) => setDraftValue('categoryId', event.target.value)}><option value="">Choose category</option>{categories.filter((category) => category.active || category.id === draft.categoryId).map((category) => <option key={category.id} value={category.id}>{category.name}{!category.active ? ' (inactive)' : ''}</option>)}</select></div>
                    <div className="admin-field"><label htmlFor="product-icon">Catalogue icon</label><select id="product-icon" className="admin-control" value={draft.icon} onChange={(event) => setDraftValue('icon', event.target.value as ProductDraft['icon'])}>{iconChoices.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></div>
                    <div className="admin-field"><label htmlFor="product-price">Price</label><input id="product-price" className="admin-control" type="number" min="0" step="1" value={draft.price ?? ''} onChange={(event) => setDraftValue('price', numberOrNull(event.target.value))} placeholder="Leave blank for quote" /></div>
                    <div className="admin-field"><label htmlFor="product-previous-price">Previous price</label><input id="product-previous-price" className="admin-control" type="number" min="0" step="1" value={draft.previousPrice ?? ''} onChange={(event) => setDraftValue('previousPrice', numberOrNull(event.target.value))} /></div>
                    <div className="admin-field"><label htmlFor="product-stock">Stock quantity</label><input id="product-stock" className="admin-control" type="number" min="0" step="1" value={draft.stockQuantity} onChange={(event) => setDraftValue('stockQuantity', Math.max(0, Number(event.target.value) || 0))} /></div>
                  </div>
                  <div className="admin-field"><label htmlFor="product-description">Description</label><textarea id="product-description" className="admin-control textarea" value={draft.description} onChange={(event) => setDraftValue('description', event.target.value)} /></div>
                  <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="admin-screen-reader">Listing visibility and flags</legend><div className="admin-check-group">
                    <label className="admin-check-row"><input type="checkbox" checked={draft.active} onChange={(event) => setDraftValue('active', event.target.checked)} /> Public listing</label>
                    <label className="admin-check-row"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraftValue('featured', event.target.checked)} /> Featured</label>
                    <label className="admin-check-row"><input type="checkbox" checked={draft.demo} onChange={(event) => setDraftValue('demo', event.target.checked)} /> Demo listing</label>
                  </div></fieldset>
                  <section aria-label="Product images">
                    <div className="admin-section-label"><strong>Product images</strong><span>{images.length} {images.length === 1 ? 'image' : 'images'}</span></div>
                    {images.length > 0 && <div className="admin-image-grid">{images.map((image, index) => <div className="admin-image-tile" key={`${image.id ?? image.url}-${index}`}>
                      <img src={image.url} alt={image.alt || `Product image ${index + 1}`} />
                      {image.isPrimary && <span className="admin-image-primary">Primary</span>}
                      <div className="admin-image-actions">
                        <button type="button" aria-label={`Set image ${index + 1} as primary`} onClick={() => makePrimary(index)}><Star size={13} fill={image.isPrimary ? 'currentColor' : 'none'} /></button>
                        <label className="admin-icon-button" style={{ width: 27, height: 27, background: 'rgba(251,252,253,.94)', boxShadow: '0 2px 8px #1c34421a' }} aria-label={`Replace image ${index + 1}`}><Upload size={13} /><input type="file" accept="image/*" capture="environment" className="admin-screen-reader" onChange={(event) => replaceImage(index, event)} /></label>
                        <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => removeImage(index)}><X size={14} /></button>
                      </div>
                    </div>)}</div>}
                    <div className="admin-upload-actions">
                      <label className="admin-button secondary"><ImagePlus size={14} /> Add images<input type="file" accept="image/*" multiple className="admin-screen-reader" onChange={addFiles} data-testid="input-image-upload" /></label>
                      <label className="admin-button secondary"><Camera size={14} /> Take photo<input type="file" accept="image/*" capture="environment" className="admin-screen-reader" onChange={addFiles} /></label>
                    </div>
                    <p className="admin-upload-hint">Use computer uploads or a phone camera. Choose a primary image; image changes are included when you save the listing.</p>
                  </section>
                </div>
                <div className="admin-editor-footer"><button type="button" className="admin-button ghost" onClick={() => { setEditing(false); if (!selected) { setSelectedId(null); setImages([]); } else chooseProduct(selected); }}>Cancel</button><div className="admin-editor-footer-right"><button type="submit" className="admin-button primary" disabled={saving}>{saving ? 'Saving…' : <><Check size={14} /> Save listing</>}</button></div></div>
              </form> : selected ? <>
                <div className="admin-editor-content">
                  <div className="admin-editor-title"><div><h3>{selected.name}</h3><p>{selected.brand} · {selected.category}</p></div><span className="admin-count">{selected.active ? 'Public' : 'Inactive'}</span></div>
                  <div className="admin-field-grid">
                    <div className="admin-stat"><div className="admin-stat-label">Current price</div><div className="admin-stat-value" style={{ fontSize: 16 }}>{money(selected.price)}</div></div>
                    <div className="admin-stat"><div className="admin-stat-label">Stock quantity</div><div className="admin-stat-value">{selected.stockQuantity}</div></div>
                  </div>
                  <div className="admin-field"><span className="admin-label">Description</span><div style={{ color: '#71808b', fontSize: 11, lineHeight: 1.65 }}>{selected.description || 'No description added.'}</div></div>
                  <div className="admin-field-grid"><div className="admin-field"><span className="admin-label">SKU</span><span style={{ fontSize: 11, color: '#71808b' }}>{selected.sku || 'Not set'}</span></div><div className="admin-field"><span className="admin-label">Public slug</span><span style={{ fontSize: 11, color: '#71808b', overflowWrap: 'anywhere' }}>{selected.slug}</span></div></div>
                  <div className="admin-section-label"><strong>Images</strong><span>{selected.images.length}</span></div>
                  {selected.images.length > 0 ? <div className="admin-image-grid">{selected.images.map((image) => <div className="admin-image-tile" key={image.id}><img src={image.url} alt={image.alt || selected.name} />{image.isPrimary && <span className="admin-image-primary">Primary</span>}</div>)}</div> : <p className="admin-upload-hint">No product images yet.</p>}
                  <div className="admin-check-group"><span className="admin-count">{selected.featured ? 'Featured' : 'Not featured'}</span><span className="admin-count">{selected.demo ? 'Demo' : 'Standard listing'}</span></div>
                </div>
                <div className="admin-editor-footer"><button type="button" className="admin-button danger" onClick={() => { setDeletePhrase(''); setModal('delete'); }}><Trash2 size={14} /> Delete</button><div className="admin-editor-footer-right"><button type="button" className="admin-button primary" onClick={() => { setImages(selected.images.map((image) => ({ ...image }))); setEditing(true); }}><Pencil size={14} /> Edit listing</button></div></div>
              </> : <div className="admin-filter-empty"><PackageOpen size={24} /><p>Select a listing to inspect it, or create a new one.</p></div>}
            </section>
          </div>
          <section className="admin-panel-card" id="admin-categories" style={{ marginTop: 17 }}>
            <div className="admin-card-heading"><div><h2>Categories</h2><p>Organize public listings and keep category order deliberate.</p></div><button type="button" className="admin-button secondary" onClick={() => openCategory()}><CirclePlus size={14} /> Add category</button></div>
            <div className="admin-category-list">
              {categories.length === 0 ? <div className="admin-filter-empty">No categories to manage. Add one to start organizing listings.</div> : categories.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((category) => <div className="admin-category-row" key={category.id} data-testid={`row-category-${category.id}`}>
                <div><strong>{category.name}</strong><small>/{category.slug} · Order {category.sortOrder} · {category.active ? 'Active' : 'Inactive'}</small></div>
                <div className="admin-category-actions"><button type="button" className="admin-icon-button" aria-label={`Edit ${category.name}`} onClick={() => openCategory(category)}><Pencil size={14} /></button>{category.active && <button type="button" className="admin-icon-button" aria-label={`Deactivate ${category.name}`} onClick={() => { setCategoryId(category.id); setModal('deactivate'); }}><Archive size={14} /></button>}</div>
              </div>)}
            </div>
          </section>
          <p className="admin-upload-hint" style={{ textAlign: 'right', marginTop: 14 }}>Catalogue changes are saved through BridgePlus operator permissions.</p>
        </main>
      </div>
      {modal === 'delete' && selected && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModal(null); }}>
        <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <p className="admin-kicker">PERMANENT ACTION</p><h2 id="delete-title">Delete this listing?</h2><p><strong>{selected.name}</strong> will be removed from the catalogue. This action cannot be undone.</p>
          <div className="admin-field"><label htmlFor="delete-confirm">Type the product name to confirm</label><input id="delete-confirm" className="admin-control" value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} autoComplete="off" /></div>
          <div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button type="button" className="admin-button danger" onClick={confirmDelete} disabled={saving || deletePhrase !== selected.name}>{saving ? 'Deleting…' : <><Trash2 size={14} /> Delete listing</>}</button></div>
        </section>
      </div>}
      {modal === 'category' && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModal(null); }}>
        <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="category-title">
          <p className="admin-kicker">CATALOGUE STRUCTURE</p><h2 id="category-title">{categoryId ? 'Edit category' : 'Add category'}</h2><p>Categories help customers navigate the public catalogue.</p>
          <form onSubmit={saveCategory} className="admin-form">
            <div className="admin-field"><label htmlFor="category-name">Category name *</label><input id="category-name" className="admin-control" required value={categoryDraft.name} onChange={(event) => { const name = event.target.value; setCategoryDraft((old) => ({ ...old, name, slug: old.slug === slugify(old.name) || !old.slug ? slugify(name) : old.slug })); }} /></div>
            <div className="admin-field"><label htmlFor="category-slug">Slug</label><input id="category-slug" className="admin-control" value={categoryDraft.slug} onChange={(event) => setCategoryDraft((old) => ({ ...old, slug: slugify(event.target.value) }))} /></div>
            <div className="admin-field"><label htmlFor="category-order">Sort order</label><input id="category-order" className="admin-control" type="number" step="1" value={categoryDraft.sortOrder} onChange={(event) => setCategoryDraft((old) => ({ ...old, sortOrder: Number(event.target.value) || 0 }))} /></div>
            <div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button type="submit" className="admin-button primary" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button></div>
          </form>
        </section>
      </div>}
      {modal === 'deactivate' && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModal(null); }}>
        <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
          <p className="admin-kicker">CATEGORY VISIBILITY</p><h2 id="deactivate-title">Deactivate category?</h2><p>{categories.find((category) => category.id === categoryId)?.name} will no longer be active for public browsing. Existing listings are not deleted.</p>
          <div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={() => setModal(null)} disabled={saving}>Keep active</button><button type="button" className="admin-button danger" onClick={deactivateCategory} disabled={saving}>{saving ? 'Updating…' : <><Archive size={14} /> Deactivate</>}</button></div>
        </section>
      </div>}
      {saving && <span className="admin-screen-reader" role="status">Saving changes</span>}
    </div>
  );
}
