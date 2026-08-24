'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SearchOverlay from './SearchOverlay';
import SearchIcon from './SearchIcon';
import { createClient } from '../lib/supabase/client';

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);

  function openSearch() {
    setMenuOpen(false);
    setSearchOpen(true);
  }

  // Client-side, not read in a Server Component - most pages on this site
  // rely on ISR (revalidate = 3600); reading auth cookies anywhere in the
  // server render tree would force every page dynamic just to show a
  // header avatar. Costs a brief signed-out flash on load instead.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

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
          {user ? (
            <Link href="/account" className="site-header__avatar-link" aria-label="Account">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* referrerPolicy is required - Google's photo CDN
                  (lh3.googleusercontent.com) can reject the request based
                  on the page's Referer header without it. */}
              <img
                src={avatarUrl}
                alt=""
                className="site-header__avatar"
                referrerPolicy="no-referrer"
              />
            </Link>
          ) : (
            <Link href="/sign-in" className="site-header__sign-in">
              Sign In
            </Link>
          )}
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
          {user ? (
            <Link href="/account" className="site-header__sign-in" onClick={() => setMenuOpen(false)}>
              Account
            </Link>
          ) : (
            <Link href="/sign-in" className="site-header__sign-in" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
