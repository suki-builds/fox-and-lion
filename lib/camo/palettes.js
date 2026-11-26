// Terrain palettes for the camouflage generator. Five colours each, in
// order of use: the first is the ground colour that fills the background,
// and the colour count control (3 to 5) takes the first N.

export const TERRAINS = [
  {
    id: 'temperate',
    label: 'Temperate',
    colours: ['#5b6340', '#3d4a2c', '#7a6a48', '#26281f', '#8e8f6b'],
  },
  {
    id: 'arid',
    label: 'Arid',
    colours: ['#c8b08a', '#a68a62', '#dccaa4', '#7a654a', '#5d5040'],
  },
  {
    id: 'arctic',
    label: 'Arctic',
    colours: ['#e8ebed', '#c6cdd3', '#98a2ab', '#6b747d', '#3d444b'],
  },
  {
    id: 'urban',
    label: 'Urban',
    colours: ['#86898c', '#5c6064', '#b2b4b2', '#36393c', '#6e6962'],
  },
  {
    id: 'maritime',
    label: 'Maritime',
    colours: ['#3c4f63', '#26343f', '#5d7385', '#18212b', '#7f8f9a'],
  },
];

export const TERRAIN_BY_ID = Object.fromEntries(TERRAINS.map((t) => [t.id, t]));

export function paletteFor(terrainId, count) {
  const terrain = TERRAIN_BY_ID[terrainId] || TERRAINS[0];
  return terrain.colours.slice(0, count);
}
