// FE interpreter — flat-earth disc + dome geometry.
//
// One of two independent interpretations of the shared (Tang-canonical)
// celestial sphere. This module knows ONLY the flat-earth disc + vault
// model: the stationary disc, the rotating Heavenly vault overhead, and
// the observer's local optical vault. It imports nothing from the GE
// interpreter and holds no globe geometry. Distances in this frame read
// out in li / bu (handled by the HUD via js/tang/units.js).
//
// Inputs are the shared per-body quantities the app computes once from the
// Tang frame (celestial lat/long, the observer's local-sky direction
// vector, a vault height); the outputs are positions on the flat disc /
// dome in global-FE coordinates (FE_RADIUS units).

import { localSkyCoordToGlobalFeCoord } from '../transforms.js';
import { vaultCoordAt } from '../feGeometry.js';

// Optical-vault projection: a local-sky direction (zenith, east, north)
// flattened onto the observer's optical cap (radius R, height H).
export function opticalVaultProject(localSky, R, H) {
  return [localSky[0] * H, localSky[1] * R, localSky[2] * R];
}

// Ellipsoidal ceiling at a body's AE radius:
// z <= domeH * sqrt(1 - (r/domeR)^2), r the body's AE-projected disc radius.
export function heavenlyVaultCeiling(latDeg, domeSize, domeHeight, feRadius) {
  const r = feRadius * (90 - latDeg) / 180;
  const domeR = domeSize * feRadius;
  const rhoSq = (r * r) / (domeR * domeR);
  if (rhoSq >= 1) return 0;
  return domeHeight * Math.sqrt(1 - rhoSq);
}

// Heavenly-vault placement on the flat disc / dome. Sky rotation is folded
// into the longitude before projecting (so AE and DP both stay on-axis
// with the body's ground point); the body sits at a fixed altitude `height`.
export function heavenlyVaultCoord(latDeg, lngCelestDeg, height, skyRotAngleDeg, feRadius) {
  return vaultCoordAt(latDeg, lngCelestDeg - skyRotAngleDeg, height, feRadius);
}

// Observer optical-vault placement in global-FE coordinates: project the
// body's local-sky direction onto the optical cap, then map that local-FE
// point into the global disc frame.
export function opticalVaultCoord(localSky, opticalRadius, opticalHeightEff, transMatLocalFeToGlobalFe) {
  return localSkyCoordToGlobalFeCoord(
    opticalVaultProject(localSky, opticalRadius, opticalHeightEff),
    transMatLocalFeToGlobalFe,
  );
}
