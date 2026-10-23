import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { businessConfig } from './config';

function BrandMark() {
  return <div className="brand-lockup" aria-label={businessConfig.businessName}>
    <div className="brand-mark" aria-hidden="true"><span>B</span><i>+</i></div>
    <div className="brand-name">BridgePlus <span>Tech</span></div>
  </div>;
}

type HeaderProps = {
  cartCount: number;
  onOpenCart: () => void;
  search: string;
  setSearch: (value: string) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCategory: (category: string) => void;
};

export function Header({ cartCount, onOpenCart, search, setSearch, menuOpen, onToggleMenu, onCategory }: HeaderProps) {
  const nav = ['Apple', 'Google Pixel', 'DJI', 'Meta', 'Headphones', 'Speakers', 'Smart-home devices', 'Gaming monitors', 'Gaming PCs & desktops', 'Accessories'];
  const choose = (category: string) => {
    onCategory(category);
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    onToggleMenu();
  };
  return <>
    <div className="announcement-bar"><span>BRIDGEPLUS TECH</span><span aria-hidden="true">/</span>{businessConfig.tagline}</div>
    <header className="site-header">
      <a className="brand-link" href="#home" aria-label="BridgePlus Tech home"><BrandMark /></a>
      <nav className="desktop-nav" aria-label="Shop categories">
        <a href="#shop" onClick={() => onCategory('All products')}>Shop all</a>
        {nav.slice(0, 6).map((item) => <a href="#shop" key={item} onClick={() => onCategory(item)}>{item}</a>)}
      </nav>
      <div className="header-actions">
        <label className="header-search">
          <Search size={16} aria-hidden="true" />
          <input aria-label="Search products" placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} />
          {search && <button type="button" className="icon-button clear-search" aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button>}
        </label>
        <button type="button" className="icon-button cart-header" onClick={onOpenCart} aria-label={`Open shopping bag, ${cartCount} items`}>
          <ShoppingBag size={20} aria-hidden="true" /><span className="cart-count">{cartCount}</span>
        </button>
        <button type="button" className="icon-button mobile-menu-button" onClick={onToggleMenu} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close categories menu' : 'Open categories menu'}><Menu size={22} /></button>
      </div>
    </header>
    {menuOpen && <nav className="mobile-menu-panel" aria-label="Mobile shop categories">
      <button type="button" className="mobile-menu-close" onClick={onToggleMenu}><X size={17} /> Close</button>
      <a href="#shop" onClick={() => choose('All products')}>Shop all</a>
      {nav.map((item) => <a href="#shop" key={item} onClick={() => choose(item)}>{item}</a>)}
    </nav>}
  </>;
}

