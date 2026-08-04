// Placeholder wire-headline aggregator — not backed by a real feed yet.
// Swap ITEMS for a real news-aggregation source when one is wired up.
const ITEMS = [
  {
    headline: 'Pentagon awards $2.4bn contract for next-generation electronic warfare systems',
    source: 'Defense News',
    time: '1h ago',
  },
  {
    headline: 'UK Ministry of Defence confirms Challenger 3 upgrade delays amid supply chain strain',
    source: 'Reuters',
    time: '2h ago',
  },
  {
    headline: 'NATO allies agree framework for shared drone logistics across eastern flank',
    source: 'Politico Europe',
    time: '3h ago',
  },
  {
    headline: "Israel's Rafael unveils new loitering munition variant with extended 12-hour endurance",
    source: 'Breaking Defense',
    time: '4h ago',
  },
  {
    headline: 'Australia accelerates sovereign missile production amid Indo-Pacific readiness review',
    source: 'The Australian',
    time: '5h ago',
  },
  {
    headline: 'US Space Force seeks industry proposals for proliferated LEO ground architecture',
    source: 'SpaceNews',
    time: '6h ago',
  },
  {
    headline: 'Germany approves €1.1bn Patriot battery transfer to Ukraine after parliamentary vote',
    source: 'Der Spiegel',
    time: '8h ago',
  },
  {
    headline: "DSEI 2026: Key themes emerging ahead of London's largest defence exhibition",
    source: 'Janes',
    time: '10h ago',
  },
];

export default function DefenceNewsList() {
  return (
    <div className="news-list">
      {ITEMS.map((item, index) => (
        <div className="news-list__item" key={item.headline}>
          <span className="news-list__index">{String(index + 1).padStart(2, '0')}</span>
          <div>
            <h3 className="news-list__headline">{item.headline}</h3>
            <span className="news-list__source">via {item.source}</span>
            <span className="news-list__time">{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
