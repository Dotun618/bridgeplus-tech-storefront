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
import { requireSupabase } from './supabase';

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

export async function fetchPublicCatalog(): Promise<AdminCatalog> {
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
