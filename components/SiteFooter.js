import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__logo">Fox &amp; Lion</span>
          <p className="site-footer__copy">
            &copy; {new Date().getFullYear()} Fox and Lion Ltd. All rights reserved.
          </p>
        </div>
        <nav className="site-footer__nav">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
