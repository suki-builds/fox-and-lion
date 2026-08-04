import Link from 'next/link';

export default function SiteHeader() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="site-header">
      <div className="site-header__utility">
        <div className="site-header__utility-inner">
          <span>Defence &middot; Technology &middot; Strategy</span>
          <div className="site-header__utility-links">
            <span>{today}</span>
            <Link href="/contact">Sign in</Link>
          </div>
        </div>
      </div>
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo">
          <span className="site-header__logo-mark">Fox &amp; Lion</span>
          <span className="site-header__logo-sub">Defence Review</span>
        </Link>
        <nav className="site-header__nav">
          <Link href="/analysis">Analysis</Link>
          <Link href="/news">News</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/jobs">Jobs</Link>
        </nav>
        <div className="site-header__actions">
          <button type="button" className="site-header__search" aria-label="Search">
            &#128269;
          </button>
          <Link href="/contact" className="site-header__subscribe">
            Subscribe
          </Link>
        </div>
      </div>
    </header>
  );
}
