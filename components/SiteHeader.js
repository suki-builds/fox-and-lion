import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo">
          Fox and Lion
        </Link>
        <nav className="site-header__nav">
          <Link href="/analysis">Analysis</Link>
          <Link href="/news">News</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
