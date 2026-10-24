import type { Category, CategoryDraft, CatalogProduct, ImageDraft, ProductDraft } from '../storefront/catalogTypes';

export type AdminPanelProps = {
  currentUserEmail: string;
  products: CatalogProduct[];
  categories: Category[];
  loading: boolean;
  error: string;
  notice: string;
  onRefresh: () => void;
  onSignOut: () => Promise<void>;
  onSaveProduct: (draft: ProductDraft, images: ImageDraft[], productId?: string) => Promise<string>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSaveCategory: (draft: CategoryDraft, categoryId?: string) => Promise<void>;
  onSetCategoryActive: (categoryId: string, active: boolean) => Promise<void>;
};

export type AdminSignInProps = {
  loading: boolean;
  error: string;
  onSignIn: (email: string, password: string) => Promise<void>;
};
