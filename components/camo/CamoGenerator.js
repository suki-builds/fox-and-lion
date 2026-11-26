'use client';

import { useEffect, useRef, useState } from 'react';
import { FAMILIES } from '../../lib/camo/patterns';
import { TERRAINS } from '../../lib/camo/palettes';
import { designationFor, NOTES } from '../../lib/camo/names';
import { randomSeed } from '../../lib/camo/prng';
import {
  COLOURS_MAX,
  COLOURS_MIN,
  PRESETS,
  SCALE_MAX,
  SCALE_MIN,
  exportImage,
  readState,
  renderPattern,
  toQuery,
} from '../../lib/camo/render';

// The most points the preview samples for the per-pixel families (woodland,
// tiger), so a redraw stays well under 100 ms on a phone. Downloads sample
// every pixel.
const PREVIEW_BUDGET = 110000;

// The camouflage generator at /tools/camo. All of it runs in the browser:
// the settings live in the query string (so a link reproduces the pattern),
// the preview is drawn on a canvas, and downloads are rendered off-screen.
export default function CamoGenerator() {
  // Null until mounted: the seed comes from the URL, or is made up, in the
  // browser - doing that during server rendering would mismatch.
  const [state, setState] = useState(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [busy, setBusy] = useState(null);
  const [status, setStatus] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setState(readState(window.location.search));
  }, []);

  // Keep the address bar in step without a navigation, so the current URL is
  // always the shareable one.
  useEffect(() => {
    if (!state) return;
    window.history.replaceState(null, '', `${window.location.pathname}?${toQuery(state)}`);
  }, [state]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!state || !canvas || !size.width || !size.height) return;
    // Backing store at device resolution (capped at 2x) so it stays sharp.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(size.width * dpr);
    const height = Math.round(size.height * dpr);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const started = performance.now();
    renderPattern(canvas.getContext('2d'), width, height, state, { budget: PREVIEW_BUDGET });
    if (process.env.NODE_ENV !== 'production') {
      canvas.dataset.renderMs = (performance.now() - started).toFixed(1);
    }
  }, [state, size]);

  const designation = state ? designationFor(state.seed, state.family) : '';
  const note = state ? NOTES[state.family] : '';

  function update(changes) {
    setState((current) => ({ ...current, ...changes }));
    setStatus('');
    setFallbackUrl('');
  }

  async function handleCopy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setFallbackUrl('');
      setStatus('Link copied.');
    } catch {
      setFallbackUrl(url);
      setStatus('The link could not be copied automatically. Copy it from the box below.');
    }
  }

  async function handleDownload(presetId) {
    const preset = PRESETS[presetId];
    setBusy(presetId);
    setStatus('');
    // Let the "Preparing" state paint before the heavy render starts.
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      const blob = await exportImage(presetId, state);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${designation.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${preset.slug}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus(`${preset.label} ready.`);
    } catch {
      setStatus('The image could not be created. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="camo">
      <div className="camo__stage">
        <div className="camo__preview" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="camo__canvas"
            role="img"
            aria-label={designation ? `Camouflage pattern preview: ${designation}` : 'Camouflage pattern preview'}
          />
        </div>
        <div className="camo__designation">
          <p className="camo__eyebrow">Designation</p>
          <p className="camo__name">{designation || ' '}</p>
          <p className="camo__note">{note || ' '}</p>
        </div>
      </div>

      <div className="camo__panel">
        <form className="camo__controls" onSubmit={(event) => event.preventDefault()}>
          <div className="camo__field">
            <label htmlFor="camo-family">Pattern family</label>
            <select
              id="camo-family"
              value={state?.family || ''}
              disabled={!state}
              onChange={(event) => update({ family: event.target.value })}
            >
              {FAMILIES.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.label}
                </option>
              ))}
            </select>
          </div>

          <div className="camo__field">
            <label htmlFor="camo-terrain">Terrain</label>
            <select
              id="camo-terrain"
              value={state?.terrain || ''}
              disabled={!state}
              onChange={(event) => update({ terrain: event.target.value })}
            >
              {TERRAINS.map((terrain) => (
                <option key={terrain.id} value={terrain.id}>
                  {terrain.label}
                </option>
              ))}
            </select>
          </div>

          <div className="camo__field">
            <div className="camo__field-head">
              <label htmlFor="camo-colours">Colours</label>
              <output htmlFor="camo-colours">{state?.colours ?? ''}</output>
            </div>
            <input
              id="camo-colours"
              type="range"
              min={COLOURS_MIN}
              max={COLOURS_MAX}
              step={1}
              value={state?.colours ?? COLOURS_MIN}
              disabled={!state}
              onChange={(event) => update({ colours: Number(event.target.value) })}
            />
          </div>

          <div className="camo__field">
            <div className="camo__field-head">
              <label htmlFor="camo-scale">Scale</label>
              <output htmlFor="camo-scale">{state?.scale ?? ''}</output>
            </div>
            <input
              id="camo-scale"
              type="range"
              min={SCALE_MIN}
              max={SCALE_MAX}
              step={1}
              value={state?.scale ?? SCALE_MIN}
              disabled={!state}
              onChange={(event) => update({ scale: Number(event.target.value) })}
            />
          </div>
        </form>

        <div className="camo__actions">
          <button
            type="button"
            className="camo__button"
            disabled={!state}
            onClick={() => update({ seed: randomSeed() })}
          >
            Randomise
          </button>
          <button
            type="button"
            className="camo__button camo__button--secondary"
            disabled={!state}
            onClick={handleCopy}
          >
            Copy link
          </button>
        </div>

        <div className="camo__downloads">
          <p className="camo__eyebrow">Download</p>
          {Object.entries(PRESETS).map(([id, preset]) => (
            <button
              key={id}
              type="button"
              className="camo__button camo__button--secondary camo__button--download"
              disabled={!state || busy !== null}
              onClick={() => handleDownload(id)}
            >
              <span>{busy === id ? 'Preparing image…' : preset.label}</span>
              <span className="camo__button-meta">
                {preset.width} × {preset.height}
              </span>
            </button>
          ))}
        </div>

        <p className="camo__status" aria-live="polite">
          {status}
        </p>
        {fallbackUrl && (
          <input
            className="camo__fallback-url"
            type="text"
            readOnly
            value={fallbackUrl}
            aria-label="Link to this pattern"
            onFocus={(event) => event.target.select()}
          />
        )}
      </div>
    </div>
  );
}
