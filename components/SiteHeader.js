'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchOverlay from './SearchOverlay';
import SearchIcon from './SearchIcon';
import { createClient } from '../lib/supabase/client';

// Mobile shows every section as a tab under the masthead instead of a
// hamburger menu. Desktop keeps the original inline links (see
// globals.css, which switches between the two at 768px).
const TABS = [
  { href: '/', label: 'Home' },
  { href: '/analysis', label: 'Analysis' },
  { href: '/news', label: 'News' },
  { href: '/careers', label: 'Careers' },
  { href: '/about', label: 'About' },
];

function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);

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
      <div className="site-header__masthead">
        <Link href="/" className="site-header__logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Fox and Lion" className="site-header__logo-img" />
        </Link>
        {/* Desktop only - see the tab bar below for mobile. */}
        <nav className="site-header__nav">
          <Link href="/analysis">Analysis</Link>
          <Link href="/news">News</Link>
          <Link href="/careers">Careers</Link>
        </nav>
        <div className="site-header__actions">
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
          <button
            type="button"
            className="site-header__search"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon className="site-header__search-icon" />
          </button>
        </div>
      </div>

      <nav className="site-header__tabs" aria-label="Sections">
        {TABS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`site-header__tab${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
