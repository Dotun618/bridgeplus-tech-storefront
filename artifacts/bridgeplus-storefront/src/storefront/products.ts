export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number | null;
  description: string;
  badge: string;
  demo: boolean;
  icon: 'phone' | 'camera' | 'monitor' | 'desktop' | 'headphones' | 'speaker' | 'tablet' | 'watch' | 'smart';
  imageUrl?: string;
};

export const initialCategoryNames = [
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
];

