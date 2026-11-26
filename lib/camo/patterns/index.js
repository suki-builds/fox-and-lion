import woodland from './woodland';
import brushstroke from './brushstroke';
import splinter from './splinter';
import tiger from './tiger';
import digital from './digital';

// The pattern families, in the order they appear in the menu. To add one:
// write a module exporting { id, label, render(ctx, width, height, opts) },
// add it here, and add its nouns and note in ../names.js.
//
// render() must fill the whole canvas, starting with palette[0], and use
// only opts.rng and opts.noise for randomness so a seed always draws the
// same thing. opts: { rng, noise, palette, feature, budget } - feature is
// the typical shape size in pixels, budget the most points a per-pixel
// renderer may sample (see paintField in ../canvas.js).
export const FAMILIES = [woodland, brushstroke, splinter, tiger, digital];

export const FAMILY_BY_ID = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));
