import type { Product } from './products';
import type {
  AdminCatalog,
  Category,
  CategoryDraft,
  CatalogProduct,
  ImageDraft,
  ProductDraft,
  ProductImage,
} from './catalogTypes';
import { isSupabaseConfigured, requireSupabase } from './supabase';

const IMAGE_BUCKET = 'product-images';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
const productIcons = new Set<Product['icon']>([
  'phone', 'camera', 'monitor', 'desktop', 'headphones', 'speaker', 'tablet', 'watch', 'smart',
]);

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  category_id: string;
  price: number | string | null;
  previous_price: number | string | null;
  sku: string | null;
  stock_quantity: number;
  active: boolean;
  featured: boolean;
  is_demo: boolean;
  icon: Product['icon'];
  created_at: string;
};

type ImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function amount(value: number | string | null): number | null {
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, slug: row.slug, active: row.active, sortOrder: row.sort_order };
}

function slugify(value: string) {
  return value.trim().toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getSignedImageUrl(path: string) {
  const { data, error } = await requireSupabase().storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, 86_400);
  throwIfError(error);
  if (!data) throw new Error('A product image URL could not be created.');
  return data.signedUrl;
}

async function mapProducts(
  rows: ProductRow[],
  categoryRows: CategoryRow[],
  imageRows: ImageRow[],
): Promise<CatalogProduct[]> {
  const categoryNames = new Map(categoryRows.map((row) => [row.id, row.name]));
  const groupedImages = new Map<string, ProductImage[]>();
  await Promise.all(imageRows.map(async (image) => {
    const url = await getSignedImageUrl(image.storage_path);
    const productImages = groupedImages.get(image.product_id) ?? [];
    productImages.push({
      id: image.id,
      path: image.storage_path,
      url,
      alt: image.alt_text,
      sortOrder: image.sort_order,
      isPrimary: image.is_primary,
    });
    groupedImages.set(image.product_id, productImages);
  }));

  return rows.map((row) => {
    const images = (groupedImages.get(row.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    const primaryImage = images.find((image) => image.isPrimary) ?? images[0];
    const price = amount(row.price);
    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      category: categoryNames.get(row.category_id) ?? 'Uncategorized',
      categoryId: row.category_id,
      price,
      description: row.description,
      badge: row.is_demo ? 'Unverified demo' : row.featured ? 'Featured listing' : 'Published listing',
      demo: row.is_demo,
      icon: productIcons.has(row.icon) ? row.icon : 'smart',
      imageUrl: primaryImage?.url,
      images,
      slug: row.slug,
      sku: row.sku ?? '',
      stockQuantity: row.stock_quantity,
      previousPrice: amount(row.previous_price),
      active: row.active,
      featured: row.featured,
      createdAt: row.created_at,
    };
  });
}

async function readImages(productIds: string[]) {
  if (!productIds.length) return [] as ImageRow[];
  const { data, error } = await requireSupabase()
    .from('product_images')
    .select('id,product_id,storage_path,alt_text,sort_order,is_primary')
    .in('product_id', productIds)
    .order('sort_order');
  throwIfError(error);
  return (data ?? []) as ImageRow[];
}

const fallbackDemoCategories: Category[] = [
  'Apple',
  'Google Pixel',
  'DJI',
  'Meta',
  'Headphones',
  'Speakers',
  'Smart-home devices',
  'Gaming monitors',
  'Gaming PCs & desktops',
  'Accessories',
].map((name, index) => ({
  id: `cat-${slugify(name)}`,
  name,
  slug: slugify(name),
  active: true,
  sortOrder: (index + 1) * 10,
}));

const fallbackDemoProducts: CatalogProduct[] = [
  {
    id: 'demo-iphone-16-pro',
    name: 'Apple iPhone 16 Pro Max 256GB',
    brand: 'Apple',
    category: 'Apple',
    categoryId: 'cat-apple',
    price: 2150000,
    previousPrice: 2300000,
    description: 'Brand new sealed iPhone 16 Pro Max with A18 Pro chip, titanium design and 48MP camera system.',
    badge: 'Featured listing',
    demo: true,
    icon: 'phone',
    images: [],
    slug: 'apple-iphone-16-pro-max-256gb',
    sku: 'APP-IP16PM-256',
    stockQuantity: 5,
    active: true,
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-pixel-9-pro',
    name: 'Google Pixel 9 Pro XL 128GB',
    brand: 'Google Pixel',
    category: 'Google Pixel',
    categoryId: 'cat-google-pixel',
    price: 1650000,
    previousPrice: 1800000,
    description: 'Flagship Google Tensor G4 smartphone with pro camera controls, Gemini AI integrations and Super Actua OLED display.',
    badge: 'Featured listing',
    demo: true,
    icon: 'phone',
    images: [],
    slug: 'google-pixel-9-pro-xl-128gb',
    sku: 'GOOG-PX9P-128',
    stockQuantity: 4,
    active: true,
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-dji-mini-4',
    name: 'DJI Mini 4 Pro Fly More Combo Plus',
    brand: 'DJI',
    category: 'DJI',
    categoryId: 'cat-dji',
    price: 1550000,
    previousPrice: null,
    description: 'Under 249g ultra-light camera drone with omnidirectional obstacle sensing, 4K/60fps HDR video and extended flight batteries.',
    badge: 'Popular',
    demo: true,
    icon: 'camera',
    images: [],
    slug: 'dji-mini-4-pro-fly-more-combo',
    sku: 'DJI-M4P-FMC',
    stockQuantity: 3,
    active: true,
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-meta-quest-3s',
    name: 'Meta Quest 3S 128GB All-in-One VR Headset',
    brand: 'Meta',
    category: 'Meta',
    categoryId: 'cat-meta',
    price: 620000,
    previousPrice: 680000,
    description: 'Next-generation mixed reality headset with high-resolution full-colour passthrough and Touch Plus controllers.',
    badge: 'Popular',
    demo: true,
    icon: 'smart',
    images: [],
    slug: 'meta-quest-3s-128gb',
    sku: 'META-Q3S-128',
    stockQuantity: 6,
    active: true,
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    brand: 'Sony',
    category: 'Headphones',
    categoryId: 'cat-headphones',
    price: 520000,
    previousPrice: 580000,
    description: 'Industry-leading noise cancellation with Auto NC Optimizer, 30-hour battery life and crystal-clear hands-free calling.',
    badge: 'Top Audio',
    demo: true,
    icon: 'headphones',
    images: [],
    slug: 'sony-wh1000xm5-wireless-headphones',
    sku: 'SNY-WH5-BLK',
    stockQuantity: 8,
    active: true,
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-marshall-emberton',
    name: 'Marshall Emberton II Portable Bluetooth Speaker',
    brand: 'Marshall',
    category: 'Speakers',
    categoryId: 'cat-speakers',
    price: 285000,
    previousPrice: null,
    description: 'Compact portable speaker with signature 360° True Stereophonic sound, IP67 dust/water resistance and 30+ hours playtime.',
    badge: 'Top Audio',
    demo: true,
    icon: 'speaker',
    images: [],
    slug: 'marshall-emberton-ii-speaker',
    sku: 'MSH-EMB2-BLK',
    stockQuantity: 7,
    active: true,
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-lg-ultragear-oled',
    name: 'LG UltraGear 27" 240Hz QHD OLED Gaming Monitor',
    brand: 'LG',
    category: 'Gaming monitors',
    categoryId: 'cat-gaming-monitors',
    price: 1350000,
    previousPrice: 1450000,
    description: '0.03ms response time, 240Hz refresh rate, G-Sync Compatible & FreeSync Premium Pro with true blacks and 98.5% DCI-P3.',
    badge: 'Gaming',
    demo: true,
    icon: 'monitor',
    images: [],
    slug: 'lg-ultragear-27-oled-240hz',
    sku: 'LG-27GR95QE',
    stockQuantity: 2,
    active: true,
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-gaming-pc-rtx4070',
    name: 'BridgePlus Custom Elite Gaming Desktop (Ryzen 7 7800X3D / RTX 4070 Super)',
    brand: 'BridgePlus Custom',
    category: 'Gaming PCs & desktops',
    categoryId: 'cat-gaming-pcs-desktops',
    price: 3200000,
    previousPrice: null,
    description: 'High-performance gaming & creator rig: AMD Ryzen 7 7800X3D, GeForce RTX 4070 Super 12GB, 32GB DDR5 6000MHz, 2TB Gen4 NVMe, 360mm AIO liquid cooling.',
    badge: 'High Performance',
    demo: true,
    icon: 'desktop',
    images: [],
    slug: 'bridgeplus-custom-gaming-desktop-rtx4070',
    sku: 'BPC-R7-4070S',
    stockQuantity: 2,
    active: true,
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-apple-watch-ultra',
    name: 'Apple Watch Ultra 2 GPS + Cellular 49mm',
    brand: 'Apple',
    category: 'Apple',
    categoryId: 'cat-apple',
    price: 1250000,
    previousPrice: null,
    description: 'Rugged titanium case with precision dual-frequency GPS, up to 72 hours battery life in low power mode, and bright 3000 nit display.',
    badge: 'Featured listing',
    demo: true,
    icon: 'watch',
    images: [],
    slug: 'apple-watch-ultra-2-49mm',
    sku: 'APP-WU2-49TI',
    stockQuantity: 4,
    active: true,
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-anker-737-powerbank',
    name: 'Anker 737 Power Bank (PowerCore 24K) 140W',
    brand: 'Anker',
    category: 'Accessories',
    categoryId: 'cat-accessories',
    price: 195000,
    previousPrice: 220000,
    description: 'Ultra-powerful two-way charging with Power Delivery 3.1 and smart digital display showing output power and remaining recharge time.',
    badge: 'Popular',
    demo: true,
    icon: 'smart',
    images: [],
    slug: 'anker-737-powerbank-140w',
    sku: 'ANK-737-24K',
    stockQuantity: 12,
    active: true,
    featured: false,
    createdAt: new Date().toISOString(),
  },
];

export async function fetchPublicCatalog(): Promise<AdminCatalog> {
  if (!isSupabaseConfigured) {
    return {
      categories: fallbackDemoCategories,
      products: fallbackDemoProducts,
    };
  }

  try {
    const client = requireSupabase();
    const [categoryResult, productResult] = await Promise.all([
      client.from('categories')
        .select('id,name,slug,active,sort_order')
        .eq('active', true)
        .order('sort_order')
        .order('name'),
      client.from('products')
        .select('id,name,slug,brand,description,category_id,price,previous_price,sku,stock_quantity,active,featured,is_demo,icon,created_at')
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);
    throwIfError(categoryResult.error);
    throwIfError(productResult.error);

    const categories = (categoryResult.data ?? []) as CategoryRow[];
    const products = (productResult.data ?? []) as ProductRow[];
    const images = await readImages(products.map((product) => product.id));
    return {
      categories: categories.map(toCategory),
      products: await mapProducts(products, categories, images),
    };
  } catch (err) {
    console.warn('[AI Studio] Supabase fetch failed, displaying demo catalog:', err);
    return {
      categories: fallbackDemoCategories,
      products: fallbackDemoProducts,
    };
  }
}

export async function fetchAdminCatalog(): Promise<AdminCatalog> {
  const client = requireSupabase();
  const [categoryResult, productResult] = await Promise.all([
    client.from('categories')
      .select('id,name,slug,active,sort_order')
      .order('sort_order')
      .order('name'),
    client.from('products')
      .select('id,name,slug,brand,description,category_id,price,previous_price,sku,stock_quantity,active,featured,is_demo,icon,created_at')
      .order('created_at', { ascending: false }),
  ]);
  throwIfError(categoryResult.error);
  throwIfError(productResult.error);

  const categories = (categoryResult.data ?? []) as CategoryRow[];
  const products = (productResult.data ?? []) as ProductRow[];
  const images = await readImages(products.map((product) => product.id));
  return {
    categories: categories.map(toCategory),
    products: await mapProducts(products, categories, images),
  };
}

export async function getCurrentAdminEmail(): Promise<string | null> {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  throwIfError(sessionError);
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await client.rpc('is_store_admin');
  if (error || data !== true) {
    await client.auth.signOut();
    return null;
  }
  return user.email ?? 'Administrator';
}

export async function signInAdmin(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  throwIfError(error);
  if (!data.user) throw new Error('Sign-in did not return an administrator account.');

  const { data: isAdmin, error: roleError } = await client.rpc('is_store_admin');
  if (roleError || isAdmin !== true) {
    await client.auth.signOut();
    throw new Error('This account is not authorized to manage the BridgePlus catalogue.');
  }
  return data.user.email ?? email.trim();
}

export async function signOutAdmin() {
  const { error } = await requireSupabase().auth.signOut();
  throwIfError(error);
}

function validateProduct(draft: ProductDraft) {
  if (draft.name.trim().length < 2) throw new Error('Enter a product name.');
  if (!draft.categoryId) throw new Error('Choose a category.');
  if (!draft.slug.trim()) throw new Error('Enter a product slug.');
  if (draft.price !== null && (!Number.isFinite(draft.price) || draft.price < 0)) {
    throw new Error('Price must be a non-negative number or left blank.');
  }
  if (draft.previousPrice !== null && (!Number.isFinite(draft.previousPrice) || draft.previousPrice < 0)) {
    throw new Error('Previous price must be a non-negative number or left blank.');
  }
  if (!Number.isInteger(draft.stockQuantity) || draft.stockQuantity < 0) {
    throw new Error('Stock quantity must be a non-negative whole number.');
  }
  if (!productIcons.has(draft.icon)) throw new Error('Choose a valid product icon.');
}

function validateImageDrafts(images: ImageDraft[]) {
  if (images.filter((image) => image.isPrimary).length > 1) {
    throw new Error('Choose only one primary image.');
  }
  for (const image of images) {
    if (image.file && !imageMimeTypes.has(image.file.type)) {
      throw new Error('Use a JPG, PNG, WebP, AVIF or GIF image.');
    }
    if (image.file && image.file.size > MAX_IMAGE_BYTES) {
      throw new Error('Each image must be 10 MB or smaller.');
    }
  }
}

export async function saveProduct(draft: ProductDraft, images: ImageDraft[], productId?: string) {
  validateProduct(draft);
  validateImageDrafts(images);
  const client = requireSupabase();
  const productValues = {
    name: draft.name.trim(),
    slug: slugify(draft.slug),
    brand: draft.brand.trim(),
    description: draft.description.trim(),
    category_id: draft.categoryId,
    price: draft.price,
    previous_price: draft.previousPrice,
    sku: draft.sku.trim() || null,
    stock_quantity: draft.stockQuantity,
    active: draft.active,
    featured: draft.featured,
    is_demo: draft.demo,
    icon: draft.icon,
  };

  let id = productId;
  if (id) {
    const { error } = await client.from('products').update(productValues).eq('id', id);
    throwIfError(error);
  } else {
    const { data, error } = await client.from('products').insert(productValues).select('id').single();
    throwIfError(error);
    if (!data) throw new Error('The product record was not returned after saving.');
    id = data.id as string;
  }

  const { data: existingData, error: existingError } = await client
    .from('product_images')
    .select('id,storage_path')
    .eq('product_id', id);
  throwIfError(existingError);
  const existing = (existingData ?? []) as Array<{ id: string; storage_path: string }>;
  const existingById = new Map(existing.map((image) => [image.id, image]));
  const uploadedPaths: string[] = [];

  try {
    if (existing.length) {
      const { error } = await client.from('product_images').update({ is_primary: false }).eq('product_id', id);
      throwIfError(error);
    }
    const savedExistingIds: string[] = [];
    const defaultPrimaryIndex = images.length && !images.some((image) => image.isPrimary) ? 0 : -1;
    const newRows: Array<{
      product_id: string;
      storage_path: string;
      alt_text: string;
      sort_order: number;
      is_primary: boolean;
    }> = [];

    for (const [index, image] of images.entries()) {
      const imageValues = {
        alt_text: image.alt.trim() || draft.name.trim(),
        sort_order: index,
        is_primary: image.isPrimary || index === defaultPrimaryIndex,
      };
      if (image.file) {
        const extension = image.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeExtension = /^[a-z0-9]{2,5}$/.test(extension) ? extension : 'jpg';
        const path = `${id}/${crypto.randomUUID()}.${safeExtension}`;
        const { error } = await client.storage.from(IMAGE_BUCKET).upload(path, image.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: image.file.type,
        });
        throwIfError(error);
        uploadedPaths.push(path);
        newRows.push({ product_id: id, storage_path: path, ...imageValues });
      } else if (image.id && existingById.has(image.id)) {
        savedExistingIds.push(image.id);
        const { error } = await client.from('product_images').update(imageValues).eq('id', image.id);
        throwIfError(error);
      } else {
        throw new Error('An image in the editor is no longer available. Refresh the product and try again.');
      }
    }

    if (newRows.length) {
      const { error } = await client.from('product_images').insert(newRows);
      throwIfError(error);
    }

    const removed = existing.filter((image) => !savedExistingIds.includes(image.id));
    if (removed.length) {
      const { error } = await client.from('product_images').delete().in('id', removed.map((image) => image.id));
      throwIfError(error);
      const { error: storageError } = await client.storage.from(IMAGE_BUCKET).remove(removed.map((image) => image.storage_path));
      throwIfError(storageError);
    }
  } catch (error) {
    if (uploadedPaths.length) {
      await client.storage.from(IMAGE_BUCKET).remove(uploadedPaths);
    }
    throw error;
  }
  return id!;
}

export async function deleteProduct(productId: string) {
  const client = requireSupabase();
  const { data: imageData, error: imageError } = await client
    .from('product_images')
    .select('storage_path')
    .eq('product_id', productId);
  throwIfError(imageError);
  const paths = ((imageData ?? []) as Array<{ storage_path: string }>).map((image) => image.storage_path);
  if (paths.length) {
    const { error } = await client.storage.from(IMAGE_BUCKET).remove(paths);
    throwIfError(error);
  }
  const { error } = await client.from('products').delete().eq('id', productId);
  throwIfError(error);
}

export async function saveCategory(draft: CategoryDraft, categoryId?: string) {
  const name = draft.name.trim();
  const slug = slugify(draft.slug || draft.name);
  if (name.length < 2) throw new Error('Enter a category name.');
  if (!slug) throw new Error('Enter a valid category name or slug.');
  if (!Number.isInteger(draft.sortOrder) || draft.sortOrder < 0) {
    throw new Error('Sort order must be a non-negative whole number.');
  }
  const values = { name, slug, sort_order: draft.sortOrder };
  const query = categoryId
    ? requireSupabase().from('categories').update(values).eq('id', categoryId)
    : requireSupabase().from('categories').insert(values);
  const { error } = await query;
  throwIfError(error);
}

export async function deactivateCategory(categoryId: string) {
  await setCategoryActive(categoryId, false);
}

export async function setCategoryActive(categoryId: string, active: boolean) {
  const { error } = await requireSupabase().from('categories').update({ active }).eq('id', categoryId);
  throwIfError(error);
}
