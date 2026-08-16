import Link from 'next/link';
import { XIcon, DiscordIcon, LinkedInIcon } from './SocialIcons';

const SOCIAL_LINKS = [
  { href: 'https://x.com/VulpesetLeo', label: 'X (Twitter)', Icon: XIcon },
  { href: 'https://discord.gg/8Jm3GYrPVU', label: 'Discord', Icon: DiscordIcon },
  { href: 'https://www.linkedin.com/company/fox-and-lion/', label: 'LinkedIn', Icon: LinkedInIcon },
];

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
          <Link href="/submission-guidelines">Submission Guidelines</Link>
          <Link href="/submission-portal">Submit a Pitch</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="site-footer__socials">
          {SOCIAL_LINKS.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="site-footer__social-link"
            >
              <Icon className="site-footer__social-icon" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
