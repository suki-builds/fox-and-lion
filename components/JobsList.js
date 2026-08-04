// Placeholder listings — not backed by a real jobs board yet.
// Swap ITEMS for a real source (or CMS model) when one is wired up.
const ITEMS = [
  {
    company: 'Anduril Industries',
    initials: 'AN',
    title: 'Principal RF Systems Engineer',
    tag: 'Engineering',
    location: 'Bristol, UK',
    posted: '2d ago',
  },
  {
    company: 'Palantir Technologies',
    initials: 'PA',
    title: 'Forward Deployed Engineer — Defence',
    tag: 'Engineering',
    location: 'London, UK',
    posted: '3d ago',
  },
  {
    company: 'Shield AI',
    initials: 'SH',
    title: 'Head of Government Relations, EMEA',
    tag: 'Growth',
    location: 'Remote',
    posted: '5d ago',
  },
  {
    company: 'Helsing',
    initials: 'HE',
    title: 'Programme Manager — Air Systems',
    tag: 'Operations',
    location: 'Munich, DE',
    posted: '1w ago',
  },
  {
    company: 'Rebellion Defence',
    initials: 'RD',
    title: 'Senior ML Researcher, Autonomy',
    tag: 'Research',
    location: 'London, UK · Hybrid',
    posted: '1w ago',
  },
];

export default function JobsList() {
  return (
    <div className="jobs-panel">
      <div className="jobs-panel__header">
        <div className="jobs-panel__title">
          <span className="section-label">Defence Tech Jobs</span>
          <span className="jobs-panel__chip">Hiring now</span>
        </div>
        <a href="#" className="jobs-panel__cta">
          View all jobs &#8599;
        </a>
      </div>
      {ITEMS.map((job) => (
        <a href="#" className="job-row" key={job.title}>
          <span className="job-row__avatar">{job.initials}</span>
          <div className="job-row__main">
            <div className="job-row__title-line">
              <span className="job-row__title">{job.title}</span>
              <span className="job-row__tag">{job.tag}</span>
            </div>
            <div className="job-row__company">
              {job.company} &middot; {job.location}
            </div>
          </div>
          <div className="job-row__meta">
            <span>{job.posted}</span>
            <span className="job-row__badge">Full-time</span>
          </div>
        </a>
      ))}
    </div>
  );
}
