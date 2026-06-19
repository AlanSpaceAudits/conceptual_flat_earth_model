// Topocentric parallax — geocentric place -> what an observer on the surface
// actually sees.
//
// Pure angles and ratios. The only "distance" input is sinHP = sin(horizontal
// parallax) = R⊕/d, a dimensionless ratio the ephemeris supplies for each body
// (Moon ≈ 0.0166, Sun ≈ 4.3e-5, planets smaller, stars 0). This is the
// units_of_measurement parallax law d = R/sinθ read the other way: sinθ = R/d,
// so the correction never needs an absolute length. The shared celestial sphere
// stays geocentric; this shift is applied at the observer's eye, exactly like
// refraction (js/core/refraction.js) — both are per-observer view corrections,
// not properties of the sphere.
//
// The model's Earth is a sphere, so the observer's geographic vertical is the
// geocentric vertical (ρ = 1, φ' = φ; no flattening term), and geometric
// parallax is a pure push toward the horizon along the vertical circle: the
// altitude drops, the azimuth is unchanged.

// Apply parallax directly in the local-sky frame the renderer uses. That
// frame's X axis is the zenith (see transforms.js localSkyCoordToAngles), so:
//   altitude h  = asin(x / |v|)
//   parallax p  = asin(sinHP · cos h)     (p -> HP at the horizon, 0 at zenith)
//   h' = h - p,  azimuth (the y,z direction) and vector length preserved.
// This mirrors applyRefractionLocalSky, which adds a lift instead of a drop.
export function parallaxAltitudeLocalSky(v, sinHP) {
  if (!sinHP) return v;
  const x = v[0], y = v[1], z = v[2];
  const len = Math.hypot(x, y, z);
  if (len === 0) return v;
  const alt = Math.asin(Math.max(-1, Math.min(1, x / len)));
  const p   = Math.asin(Math.max(-1, Math.min(1, sinHP * Math.cos(alt))));
  const altT = alt - p;
  const yz = Math.hypot(y, z);
  const newZenith = Math.sin(altT) * len;
  const newHoriz  = Math.cos(altT) * len;
  if (yz === 0) return [newZenith, y, z];
  const k = newHoriz / yz;
  return [newZenith, y * k, z * k];
}

// Equatorial form (Meeus, Astronomical Algorithms, Ch. 40, spherical ρ = 1).
// Geocentric (ra, dec) in radians -> topocentric, for an observer at geographic
// latitude `latRad` with local apparent sidereal time `lstRad`. Same sinHP
// ratio; used where the work is in RA/Dec (e.g. eclipse separation) rather than
// in the local-sky frame.
export function topocentricRaDec(ra, dec, sinHP, latRad, lstRad) {
  if (!sinHP) return { ra, dec };
  const H = lstRad - ra;                                  // local hour angle
  const sphi = Math.sin(latRad), cphi = Math.cos(latRad); // sphere: ρ = 1, φ' = φ
  const dRa = Math.atan2(-cphi * sinHP * Math.sin(H),
                          Math.cos(dec) - cphi * sinHP * Math.cos(H));
  const decT = Math.atan2((Math.sin(dec) - sphi * sinHP) * Math.cos(dRa),
                           Math.cos(dec) - cphi * sinHP * Math.cos(H));
  return { ra: ra + dRa, dec: decT };
}
