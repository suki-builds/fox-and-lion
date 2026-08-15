'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';

const DEBOUNCE_MS = 250;

// Module-scope, not component state — persists across the overlay being
// closed/reopened within the same page session, so repeat searches don't
// re-fetch /api/search-index. Resets naturally on a full page reload.
let indexCache = null;
let indexPromise = null;

function fetchIndex() {
  if (indexCache) return Promise.resolve(indexCache);
  if (!indexPromise) {
    indexPromise = fetch('/api/search-index')
      .then((res) => res.json())
      .then((data) => {
        indexCache = data;
        return data;
      })
      .catch((err) => {
        indexPromise = null; // allow retry on next open
        throw err;
      });
  }
  return indexPromise;
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SearchOverlay({ open, onClose }) {
  const [items, setItems] = useState(indexCache);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    if (!items) {
      fetchIndex()
        .then(setItems)
        .catch(() => setLoadError(true));
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, items]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [open]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const fuse = useMemo(() => {
    if (!items) return null;
    return new Fuse(items, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'excerpt', weight: 0.2 },
        { name: 'type', weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [items]);

  const results = useMemo(() => {
    if (!fuse || !debouncedQuery) return [];
    return fuse.search(debouncedQuery, { limit: 30 }).map((result) => result.item);
  }, [fuse, debouncedQuery]);

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-overlay__panel" onClick={(event) => event.stopPropagation()}>
        <div className="search-overlay__input-row">
          <span className="search-overlay__icon" aria-hidden="true">
            &#128269;
          </span>
          <input
            ref={inputRef}
            type="text"
            className="search-overlay__input"
            placeholder="Search Analysis and News…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search"
          />
          <button
            type="button"
            className="search-overlay__close"
            onClick={onClose}
            aria-label="Close search"
          >
            &#10005;
          </button>
        </div>

        <div className="search-overlay__results">
          {loadError && (
            <p className="search-overlay__status">
              Couldn&rsquo;t load search — please try again.
            </p>
          )}
          {!loadError && !items && (
            <p className="search-overlay__status">Loading search index&hellip;</p>
          )}
          {!loadError && items && !debouncedQuery && (
            <p className="search-overlay__status">Start typing to search Analysis and News.</p>
          )}
          {!loadError && items && debouncedQuery && results.length === 0 && (
            <p className="search-overlay__status">No results for &ldquo;{debouncedQuery}&rdquo;.</p>
          )}
          {results.length > 0 && (
            <ul className="search-results">
              {results.map((item, index) => (
                <li key={`${item.type}-${item.url}-${index}`}>
                  <Link href={item.url} className="search-result" onClick={onClose}>
                    <div className="search-result__head">
                      <span className="search-result__type">{item.type}</span>
                      {item.date && (
                        <span className="search-result__date">{formatDate(item.date)}</span>
                      )}
                    </div>
                    <h3 className="search-result__title">{item.title}</h3>
                    {item.excerpt && <p className="search-result__excerpt">{item.excerpt}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link href="/jobs" className="search-overlay__careers-link" onClick={onClose}>
          Looking for a job? Browse Careers &rarr;
        </Link>
      </div>
    </div>
  );
}
