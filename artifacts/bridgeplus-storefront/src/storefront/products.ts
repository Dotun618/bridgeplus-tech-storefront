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
};

export const categories = [
  'All products',
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

// Source catalogue entries are retained as illustrative listings, not verified inventory.
export const products: Product[] = [
  { id: 'pixel-demo', name: 'Pixel smartphone', brand: 'Google', category: 'Google Pixel', price: 1250000, description: 'Demo listing. Confirm model, storage, colour and availability.', badge: 'Unverified demo', demo: true, icon: 'phone' },
  { id: 'iphone-demo', name: 'iPhone', brand: 'Apple', category: 'Apple', price: 1450000, description: 'Demo listing. Confirm exact model, storage, condition and availability.', badge: 'Unverified demo', demo: true, icon: 'phone' },
  { id: 'dji-demo', name: 'Compact camera drone', brand: 'DJI', category: 'DJI', price: 980000, description: 'Demo listing. Confirm exact DJI model and included accessories.', badge: 'Unverified demo', demo: true, icon: 'camera' },
  { id: 'meta-demo', name: 'Smart glasses', brand: 'Meta', category: 'Meta', price: 620000, description: 'Demo listing. Confirm model, lens option, region and availability.', badge: 'Unverified demo', demo: true, icon: 'smart' },
  { id: 'monitor-demo', name: '27-inch gaming monitor', brand: 'Gaming', category: 'Gaming monitors', price: 720000, description: 'Demo listing. Confirm resolution, refresh rate and panel type.', badge: 'Unverified demo', demo: true, icon: 'monitor' },
  { id: 'desktop-demo', name: 'Gaming desktop PC', brand: 'Custom PC', category: 'Gaming PCs & desktops', price: 1450000, description: 'Demo listing. Final price depends on confirmed components and configuration.', badge: 'Unverified demo', demo: true, icon: 'desktop' },
  { id: 'headphones-demo', name: 'Wireless headphones', brand: 'Audio', category: 'Headphones', price: 185000, description: 'Demo listing. Confirm brand, model, warranty and availability.', badge: 'Unverified demo', demo: true, icon: 'headphones' },
  { id: 'speaker-demo', name: 'Portable Bluetooth speaker', brand: 'Audio', category: 'Speakers', price: 165000, description: 'Demo listing. Confirm model, colour and availability.', badge: 'Unverified demo', demo: true, icon: 'speaker' },
  { id: 'tablet-demo', name: 'Premium tablet', brand: 'Tablet', category: 'Accessories', price: 590000, description: 'Demo listing. Confirm exact model, storage, connectivity and availability.', badge: 'Unverified demo', demo: true, icon: 'tablet' },
  { id: 'accessory-demo', name: 'Wireless earbuds', brand: 'Audio', category: 'Accessories', price: 165000, description: 'Demo listing. Confirm model and availability.', badge: 'Unverified demo', demo: true, icon: 'headphones' },
  { id: 'camera-demo', name: 'Creator camera', brand: 'Creator tech', category: 'Accessories', price: 850000, description: 'Demo listing. Confirm exact model and included lens/accessories.', badge: 'Unverified demo', demo: true, icon: 'camera' },
  { id: 'watch-demo', name: 'Smartwatch', brand: 'Wearables', category: 'Accessories', price: 310000, description: 'Demo listing. Confirm model, size, compatibility and availability.', badge: 'Unverified demo', demo: true, icon: 'watch' },
  { id: 'smart-home-sample', name: 'Smart-home device', brand: 'Sample listing', category: 'Smart-home devices', price: null, description: 'Placeholder only. Ask BridgePlus which devices may be available.', badge: 'Price to be confirmed', demo: true, icon: 'smart' },
];

