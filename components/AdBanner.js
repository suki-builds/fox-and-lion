// Static placeholder banner - swaps between the 728x90 desktop creative and
// the 320x50 mobile creative via <picture>, so only the matching size is
// ever downloaded. Not yet linked anywhere (no advertiser URL supplied) -
// this is for testing placement/layout, not a live clickable ad.
export default function AdBanner({ className }) {
  return (
    <div className={`ad-banner${className ? ` ${className}` : ''}`}>
      <span className="ad-banner__label">Advertisement</span>
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
    </div>
  );
}
