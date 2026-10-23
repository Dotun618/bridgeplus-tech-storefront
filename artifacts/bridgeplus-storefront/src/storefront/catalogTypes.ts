import type { Product } from './products';

export type Category = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder: number;
};

export type ProductImage = {
  id: string;
  path: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type CatalogProduct = Product & {
  slug: string;
  categoryId: string;
  sku: string;
  stockQuantity: number;
  previousPrice: number | null;
  active: boolean;
  featured: boolean;
  images: ProductImage[];
  createdAt: string;
};

export type ProductDraft = {
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  description: string;
  price: number | null;
  previousPrice: number | null;
  sku: string;
  stockQuantity: number;
  active: boolean;
  featured: boolean;
  demo: boolean;
  icon: Product['icon'];
};

export type ImageDraft = {
  id?: string;
  path?: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
  file?: File;
};

export type CategoryDraft = {
  name: string;
  slug: string;
  sortOrder: number;
};

export type AdminCatalog = {
  products: CatalogProduct[];
  categories: Category[];
};
