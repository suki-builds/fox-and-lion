const AD_DESTINATION_URL = 'https://maryleboneshipyards.com/';

// Swaps between the 728x90 desktop creative and the 320x50 mobile creative
// via <picture>, so only the matching size is ever downloaded.
export default function AdBanner({ className }) {
  return (
    <div className={`ad-banner${className ? ` ${className}` : ''}`}>
      <a
        href={AD_DESTINATION_URL}
        target="_blank"
        // sponsored (not just nofollow) is Google's own recommended rel
        // value for paid/advertising links; noreferrer also keeps this
        // site's URL out of the advertiser's referrer logs.
        rel="sponsored noopener noreferrer"
      >
        <picture>
          <source media="(min-width: 640px)" srcSet="/ads/banner-728x90.png" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ads/banner-320x50.png"
            alt="Advertisement"
            width={728}
            height={90}
            className="ad-banner__img"
          />
        </picture>
      </a>
    </div>
  );
}
