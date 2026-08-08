'use client';

import { useState } from 'react';
import { initials } from './PostCard';

// Clearbit's free logo API (logo.clearbit.com) is dead — the domain no
// longer resolves as of writing, likely retired after HubSpot's
// acquisition of Clearbit. Google's favicon service is the reliable public
// fallback; if even that fails to load, we fall back to an initials square
// like before.
function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export default function CompanyLogo({ name, domain, className = 'job-row__avatar' }) {
  const [failed, setFailed] = useState(false);

  if (!domain || failed) {
    return <span className={className}>{initials(name)}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={faviconUrl(domain)}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}
