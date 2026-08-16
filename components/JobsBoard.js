'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import CompanyLogo from './CompanyLogo';

const PAGE_SIZE = 30;

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function JobsBoard({ jobs, companies }) {
  const [company, setCompany] = useState('all');
  const [roleType, setRoleType] = useState('all');
  const [country, setCountry] = useState('all');
  const [workplaceType, setWorkplaceType] = useState('all');
  // No UI control for this anymore (sort dropdown hidden) - always newest.
  const sort = 'newest';
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const roleTypes = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.roleType))).sort(),
    [jobs]
  );

  const countries = useMemo(
    () =>
      Array.from(
        new Set(jobs.flatMap((job) => job.locations.map((loc) => loc.country).filter(Boolean)))
      ).sort(),
    [jobs]
  );

  const workplaceTypes = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.workplaceType).filter(Boolean))).sort(),
    [jobs]
  );

  const filtered = useMemo(() => {
    let list = jobs;
    if (company !== 'all') list = list.filter((job) => job.companySlug === company);
    if (roleType !== 'all') list = list.filter((job) => job.roleType === roleType);
    if (country !== 'all') {
      list = list.filter((job) => job.locations.some((loc) => loc.country === country));
    }
    if (workplaceType !== 'all') list = list.filter((job) => job.workplaceType === workplaceType);

    const sorted = [...list];
    if (sort === 'newest') {
      sorted.sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''));
    } else if (sort === 'company') {
      sorted.sort((a, b) => a.company.localeCompare(b.company) || a.title.localeCompare(b.title));
    } else if (sort === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [jobs, company, roleType, country, workplaceType, sort]);

  const visible = filtered.slice(0, visibleCount);

  function withPagingReset(setter) {
    return (event) => {
      setter(event.target.value);
      setVisibleCount(PAGE_SIZE);
    };
  }

  return (
    <>
      <div className="jobs-board__filters">
        <div className="jobs-board__filter">
          <label htmlFor="filter-company">Company</label>
          <select
            id="filter-company"
            className="jobs-board__select"
            value={company}
            onChange={withPagingReset(setCompany)}
          >
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="jobs-board__filter">
          <label htmlFor="filter-role">Role type</label>
          <select
            id="filter-role"
            className="jobs-board__select"
            value={roleType}
            onChange={withPagingReset(setRoleType)}
          >
            <option value="all">All role types</option>
            {roleTypes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="jobs-board__filter">
          <label htmlFor="filter-country">Country</label>
          <select
            id="filter-country"
            className="jobs-board__select"
            value={country}
            onChange={withPagingReset(setCountry)}
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="jobs-board__filter">
          <label htmlFor="filter-workplace">Workplace</label>
          <select
            id="filter-workplace"
            className="jobs-board__select"
            value={workplaceType}
            onChange={withPagingReset(setWorkplaceType)}
          >
            <option value="all">All workplace types</option>
            {workplaceTypes.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="jobs-board__count">
        Showing {visible.length} of {filtered.length} open roles
      </p>

      <div className="jobs-board__list">
        {visible.length === 0 && (
          <p className="jobs-board__empty">No roles match those filters.</p>
        )}
        {visible.map((job) => (
          <Link
            href={`/jobs/${job.companySlug}/${job.platformId}`}
            className="job-row"
            key={job.id}
          >
            <CompanyLogo name={job.company} domain={job.companyDomain} className="job-row__avatar" />
            <div className="job-row__main">
              <div className="job-row__title-line">
                <span className="job-row__title">{job.title}</span>
                {job.roleType !== 'Other' && (
                  <span className="job-row__tag">{job.roleType}</span>
                )}
              </div>
              <div className="job-row__company">
                {job.company} &middot; {job.location || 'Location unspecified'}
              </div>
            </div>
            <div className="job-row__meta">
              {formatDate(job.postedAt) && <span>{formatDate(job.postedAt)}</span>}
              {job.workplaceType && <span className="job-row__badge">{job.workplaceType}</span>}
              {job.employmentType && <span className="job-row__badge">{job.employmentType}</span>}
            </div>
          </Link>
        ))}
      </div>

      {visibleCount < filtered.length && (
        <button
          type="button"
          className="jobs-board__load-more"
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
        >
          Load more roles
        </button>
      )}
    </>
  );
}
