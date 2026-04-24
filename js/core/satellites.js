// Simplified two-body orbital elements for a small catalogue of
// notable Earth satellites. Each entry carries:
//   id, name
//   epoch        — reference JD (all share 2024-04-15 00:00 UTC)
//   incl         — inclination, degrees
//   raan         — right ascension of ascending node at epoch, degrees
//   argPerigee   — argument of perigee at epoch, degrees
//   meanAnom     — mean anomaly at epoch, degrees
//   meanMotion   — revolutions per day
//   ecc          — eccentricity (near-circular orbits so M ≈ E ≈ ν)
//
// The two-body model ignores J2, drag, luni-solar perturbations, and
// atmospheric effects. Real-world tracks drift on the order of
// 1°/day after the epoch; this is fine for conceptual display but
// nowhere near precise-tracking-grade.

export const SATELLITES = [
  { id: 'sat_iss',       name: 'ISS (ZARYA)',     epoch: 2460400.5,
    incl: 51.6400, raan:  50.00, argPerigee: 90.00, meanAnom:   0.00,
    meanMotion: 15.5300, ecc: 0.0006 },
  { id: 'sat_hubble',    name: 'Hubble',          epoch: 2460400.5,
    incl: 28.4700, raan:  10.00, argPerigee: 90.00, meanAnom:   0.00,
    meanMotion: 15.0900, ecc: 0.0003 },
  { id: 'sat_tiangong',  name: 'Tiangong',        epoch: 2460400.5,
    incl: 41.4700, raan:   0.00, argPerigee: 90.00, meanAnom:   0.00,
    meanMotion: 15.6300, ecc: 0.0006 },
  { id: 'sat_sl_1100',   name: 'Starlink-1100',   epoch: 2460400.5,
    incl: 53.0500, raan:   0.00, argPerigee: 90.00, meanAnom:   0.00,
    meanMotion: 15.4300, ecc: 0.0001 },
  { id: 'sat_sl_1200',   name: 'Starlink-1200',   epoch: 2460400.5,
    incl: 53.0500, raan:  45.00, argPerigee: 90.00, meanAnom:  30.00,
    meanMotion: 15.4300, ecc: 0.0001 },
  { id: 'sat_sl_1300',   name: 'Starlink-1300',   epoch: 2460400.5,
    incl: 53.0500, raan:  90.00, argPerigee: 90.00, meanAnom:  60.00,
    meanMotion: 15.4300, ecc: 0.0001 },
  { id: 'sat_sl_1400',   name: 'Starlink-1400',   epoch: 2460400.5,
    incl: 53.0500, raan: 135.00, argPerigee: 90.00, meanAnom:  90.00,
    meanMotion: 15.4300, ecc: 0.0001 },
  { id: 'sat_sl_1500',   name: 'Starlink-1500',   epoch: 2460400.5,
    incl: 53.0500, raan: 180.00, argPerigee: 90.00, meanAnom: 120.00,
    meanMotion: 15.4300, ecc: 0.0001 },
  { id: 'sat_sl_1600',   name: 'Starlink-1600',   epoch: 2460400.5,
    incl: 53.0500, raan: 225.00, argPerigee: 90.00, meanAnom: 150.00,
    meanMotion: 15.4300, ecc: 0.0001 },
  { id: 'sat_sl_1700',   name: 'Starlink-1700',   epoch: 2460400.5,
    incl: 53.0500, raan: 270.00, argPerigee: 90.00, meanAnom: 180.00,
    meanMotion: 15.4300, ecc: 0.0001 },
  { id: 'sat_sl_1800',   name: 'Starlink-1800',   epoch: 2460400.5,
    incl: 53.0500, raan: 315.00, argPerigee: 90.00, meanAnom: 210.00,
    meanMotion: 15.4300, ecc: 0.0001 },
  { id: 'sat_hst2',      name: 'James Webb (L2)', epoch: 2460400.5,
    incl: 28.4700, raan: 170.00, argPerigee: 90.00, meanAnom:   0.00,
    meanMotion:  0.0027, ecc: 0.1000 },
];

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// Geographic sub-point (lat, lon) at time `utcDate`. Near-circular
// approximation: M ≈ E ≈ ν; error stays under a few tenths of a
// degree for ecc ≪ 0.01. lon wrapped to (-180, 180].
export function satelliteSubPoint(sat, utcDate) {
  const jd = utcDate.getTime() / 86400000 + 2440587.5;
  const dtDays = jd - sat.epoch;
  let M = (sat.meanAnom + sat.meanMotion * 360 * dtDays) % 360;
  if (M < 0) M += 360;
  const nu = M;
  const u = sat.argPerigee + nu;
  const uR    = u    * D2R;
  const raanR = sat.raan * D2R;
  const iR    = sat.incl * D2R;
  const cR = Math.cos(raanR), sR = Math.sin(raanR);
  const cU = Math.cos(uR),    sU = Math.sin(uR);
  const cI = Math.cos(iR),    sI = Math.sin(iR);
  const x = cR * cU - sR * sU * cI;
  const y = sR * cU + cR * sU * cI;
  const z = sU * sI;
  const latR = Math.asin(Math.max(-1, Math.min(1, z)));
  const lonEciR = Math.atan2(y, x);
  const T = (jd - 2451545.0) / 36525;
  let gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T) % 360;
  if (gmst < 0) gmst += 360;
  const lonR = lonEciR - gmst * D2R;
  let lonDeg = lonR * R2D;
  lonDeg = ((lonDeg + 180) % 360 + 360) % 360 - 180;
  return { lat: latR * R2D, lon: lonDeg };
}

const _SAT_BY_ID = new Map(SATELLITES.map((s) => [s.id, s]));
export function satelliteById(id) { return _SAT_BY_ID.get(id) || null; }
