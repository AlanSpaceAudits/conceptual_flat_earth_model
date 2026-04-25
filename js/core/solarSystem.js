// Solar-system bodies for the Bright Star Catalog union. The eight
// planets, sun, and moon carry `kind: 'planet'` so the BSC button
// grid maps them to their existing tracker ids ('sun', 'moon',
// 'mercury', …) and the existing planet renderer paints them at
// their real-time positions. Pluto ships as a static placeholder
// entry — its J2000.0 RA/Dec is rendered through the BSC star
// pipeline (no dynamic ephemeris yet).

export const SOLAR_SYSTEM_BSC = [
  { id: 'sun',     name: 'Sun',     kind: 'planet', color: 0xffc844 },
  { id: 'moon',    name: 'Moon',    kind: 'planet', color: 0xf4f4f4 },
  { id: 'mercury', name: 'Mercury', kind: 'planet', color: 0xd0b090 },
  { id: 'venus',   name: 'Venus',   kind: 'planet', color: 0xfff0c8 },
  { id: 'mars',    name: 'Mars',    kind: 'planet', color: 0xd05040 },
  { id: 'jupiter', name: 'Jupiter', kind: 'planet', color: 0xffa060 },
  { id: 'saturn',  name: 'Saturn',  kind: 'planet', color: 0xe4c888 },
  { id: 'uranus',  name: 'Uranus',  kind: 'planet', color: 0xa8d8e0 },
  { id: 'neptune', name: 'Neptune', kind: 'planet', color: 0x7fa6e8 },

  // Pluto — static placeholder at J2000.0 epoch RA/Dec
  // (≈ 16h 47m 11s, -11° 22' 25"). Uses the standard star
  // pipeline; replace with dynamic ephemeris when the planet
  // pipeline gains a Pluto evaluator.
  { id: 'pluto', name: 'Pluto', raH: 16.78639, decD: -11.37361, mag: 14.5, color: 0xa07c66 },
];
