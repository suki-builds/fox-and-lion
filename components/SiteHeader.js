'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchOverlay from './SearchOverlay';
import SearchIcon from './SearchIcon';

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  function openSearch() {
    setMenuOpen(false);
    setSearchOpen(true);
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo" onClick={() => setMenuOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Fox and Lion" className="site-header__logo-img" />
        </Link>
        <nav className="site-header__nav">
          <Link href="/analysis">Analysis</Link>
          <Link href="/news">News</Link>
          <Link href="/careers">Careers</Link>
        </nav>
        <div className="site-header__actions">
          <button type="button" className="site-header__search" aria-label="Search" onClick={openSearch}>
            <SearchIcon className="site-header__search-icon" />
          </button>
        </div>
        <button
          type="button"
          className="site-header__menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`site-header__mobile-panel${menuOpen ? ' is-open' : ''}`}>
        <nav className="site-header__mobile-nav">
          <Link href="/analysis" onClick={() => setMenuOpen(false)}>
            Analysis
          </Link>
          <Link href="/news" onClick={() => setMenuOpen(false)}>
            News
          </Link>
          <Link href="/careers" onClick={() => setMenuOpen(false)}>
            Careers
          </Link>
        </nav>
        <div className="site-header__mobile-actions">
          <button type="button" className="site-header__search" aria-label="Search" onClick={openSearch}>
            <SearchIcon className="site-header__search-icon" /> Search
          </button>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
