// FE Dome Model — application state and per-frame Update pipeline.
//
// State fields are intentionally flat so the UI layer can bind directly to
// them. Every mutation goes through setState() which triggers a recompute
// and then emits an 'update' event for the renderer / panel to react.

import { Clamp, Limit01, Limit1, ToRad } from '../math/utils.js';
import { traceDomeCaustic } from '../render/domeCaustic.js';
import { V } from '../math/vect3.js';
import { M } from '../math/mat3.js';
import { CELESTIAL, GEOMETRY, FE_RADIUS, initTimeOrigin } from './constants.js';
import { dateTimeToDate } from './time.js';
import {
  sunEquatorial, moonEquatorial, greenwichSiderealDeg, equatorialToCelestCoord,
  planetEquatorial, PLANET_NAMES, bodyRADec, BODY_NAMES,
  bodyGeocentric, geo as ephGeo, ptol as ephPtol,
  apix as ephApix, vsop as ephVsop,
} from './ephemeris.js';
import { apparentStarPosition } from './ephemerisCommon.js';
import { CEL_NAV_STARS, celNavStarById } from './celnavStars.js';
import { CATALOGUED_STARS, cataloguedStarById } from './constellations.js';
import { BLACK_HOLES, blackHoleById } from './blackHoles.js';
import { QUASARS,      quasarById }    from './quasars.js';
import { GALAXIES,     galaxyById }    from './galaxies.js';
import { SATELLITES,   satelliteById, satelliteSubPoint } from './satellites.js';
import { SATELLITES_EXTRA } from './satellitesExtra.js';
import {
  compTransMatCelestToGlobe, compTransMatLocalFeToGlobalFe, compTransMatVaultToFe,
  celestCoordToLocalGlobeCoord, coordToLatLong, localGlobeCoordToAngles,
  localGlobeCoordToGlobalFeCoord, vaultCoordToGlobalFeCoord,
} from './transforms.js';
import {
  feLatLongToGlobalFeCoord, celestLatLongToVaultCoord, vaultCoordAt,
} from './feGeometry.js';
import { canonicalLatLongToDisc } from './canonical.js';

// Mirrors PLANET_STYLE colours in render/index.js and the Tracker
// button grid. Keep in sync.
const PLANET_GP_COLORS = {
  mercury: 0xd0b090,
  venus:   0xfff0c8,
  mars:    0xd05040,
  jupiter: 0xffa060,
  saturn:  0xe4c888,
  uranus:  0xa8d8e0,
  neptune: 0x7fa6e8,
};
const TRACKED_GP_COLORS_PLANET_DEFAULT = 0xff8c66;

function opticalVaultProject(localGlobe, R, H) {
  return [localGlobe[0] * H, localGlobe[1] * R, localGlobe[2] * R];
}

// z ≤ domeH · √(1 − (r/domeR)²) — ellipsoidal ceiling at a body's AE radius.
function heavenlyVaultCeiling(latDeg, domeSize, domeHeight, feRadius) {
  const r = feRadius * (90 - latDeg) / 180;
  const domeR = domeSize * feRadius;
  const rhoSq = (r * r) / (domeR * domeR);
  if (rhoSq >= 1) return 0;
  return domeHeight * Math.sqrt(1 - rhoSq);
}

// Default state. Distances in FE_RADIUS units.
// Golden-section search over VaultHeight that lands the antipodal
// caustic peak at the same observer-local elevation as the real sun.
// Returns the best dome height in [0.05, 0.7] or NaN if no peak is
// ever above the horizon.
function _fitDomeVaultHeight(sunPos, domeR, obs, targetElDeg) {
  const elevForH = (domeH) => {
    const r = traceDomeCaustic({
      sunPos, domeR, domeH,
      discClipR: FE_RADIUS * 1.4,
      nTheta: 240, nPhi: 120,
    });
    let bestEl = null;
    let bestScore = -Infinity;
    for (const p of (r.peaks || [])) {
      const r2 = (p.x * p.x + p.y * p.y) / (domeR * domeR);
      const peakZ = r2 < 1 ? domeH * Math.sqrt(1 - r2) : 0;
      const dx = p.x - obs[0];
      const dy = p.y - obs[1];
      const dz = peakZ - obs[2];
      const dlen = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dlen < 1e-9 || dz <= 0) continue;
      // Prefer the strongest above-horizon peak.
      const el = Math.asin(dz / dlen) * 180 / Math.PI;
      const score = p.intensity;
      if (score > bestScore) { bestScore = score; bestEl = el; }
    }
    return bestEl;
  };
  const loss = (h) => {
    const e = elevForH(h);
    return e == null ? Infinity : Math.abs(e - targetElDeg);
  };
  let lo = 0.05, hi = 0.7;
  const phi = (Math.sqrt(5) - 1) / 2;
  let h1 = hi - phi * (hi - lo);
  let h2 = lo + phi * (hi - lo);
  let l1 = loss(h1), l2 = loss(h2);
  for (let i = 0; i < 20; i++) {
    if (l1 < l2) { hi = h2; h2 = h1; l2 = l1; h1 = hi - phi * (hi - lo); l1 = loss(h1); }
    else         { lo = h1; h1 = h2; l1 = l2; h2 = lo + phi * (hi - lo); l2 = loss(h2); }
    if (Math.abs(hi - lo) < 0.005) break;
  }
  const best = (l1 < l2) ? h1 : h2;
  return isFinite(loss(best)) ? best : NaN;
}

function defaultState() {
  return {
    ObserverLat:  32.0,
    ObserverLong: -100.8387,
    // 0 = N, 90 = E, 180 = S, 270 = W.
    ObserverHeading: 357.3098,
    ObserverElevation: 0,
    CameraDirection: -106.6,
    CameraHeight:    15.2,
    CameraDistance:  GEOMETRY.CameraDistanceDefault,
    Zoom:             4.67,
    // Optical-only. fov = 75° / OpticalZoom.
    OpticalZoom:      1.0,

    // Days since 2017-01-01.
    DateTime:    812.88,
    DayOfYear:   812,
    Time:        21.07,

    VaultSize:   GEOMETRY.VaultSizeDefault,
    VaultHeight: 0.75,

    // H = R → hemispheric Optical projection. Reducing H only affects
    // the Heavenly cap depiction (see OpticalVaultHeightEffective).
    OpticalVaultSize:   GEOMETRY.OpticalVaultRadiusFar,
    OpticalVaultHeight: 0.5,

    RayParameter: 2.0,
    RayTarget:    0,
    RaySource:    0,

    ShowFeGrid:     false,
    ShowShadow:     true,
    ShowVault:      false,
    ShowVaultGrid:   false,
    ShowTruePositions: false,
    ShowSunTrack:   false,
    ShowMoonTrack:  false,
    ShowOpticalVault:     true,
    ShowStars:      true,
    ShowVaultRays:        false,
    ShowOpticalVaultRays: false,
    ShowManyRays:   false,
    ShowProjectionRays: false,
    ShowTropics:       false,
    ShowPolarCircles:  false,
    ShowGroundPoints:  false,
    ShowFacingVector:  false,
    ShowDecCircles:    false,
    ShowLogo:          true,
    ShowTooltips:      true,
    ShowConstellations:      true,
    ShowConstellationLines:  true,
    ShowLongitudeRing:       false,
    ShowAzimuthRing:         false,
    ShowOpticalVaultGrid:    false,
    ShowCelestialPoles:      false,
    DarkBackground:          true,
    ShowLiveEphemeris:       false,
    MoonPhaseExpanded:       false,
    ShowSatellites:          true,
    ShowGPPath:              false,
    GPPathDays:              1,
    // GE-only inscribed/central-angle helpers. ShowCentralAngle
    // draws a great-circle arc from the observer's surface point
    // to the tracked body's GP; ShowInscribedAngle drops a short
    // dashed tick perpendicular to that arc at its midpoint
    // (which sits at central/2 from each endpoint by the
    // inscribed-angle theorem).
    ShowCentralAngle:        false,
    ShowInscribedAngle:      false,
    ShowStellariumOverlay:   false,
    ShowSunMoonNine:         false,
    ShowGPTracer:            false,
    ShowOpticalVaultTrace:   false,
    ShowTraceUnder:          false,
    TraceCelestialFrame:     false,
    ClearTraceCount:         0,
    GPTracerTargets:         [],
    SunMonthMarkers:         [],
    SunVaultArcOn:           false,
    SunMonthMarkersWorldSpace: false,
    SunMonthMarkersOpp:      [],
    SunMonthMarkersOppWorldSpace: false,
    EclipseMapSolar:         [],
    EclipseMapLunar:         [],
    WorldModel:              'fe',
    ShowDomeCaustic:         false,
    DomeCausticDensity:      120,
    MoonMonthMarkers:        [],
    MoonVaultArcOn:          false,
    MoonMonthMarkersWorldSpace: false,
    ShowSunAnalemma:         false,
    ShowMoonAnalemma:        false,
    ShowCelestialBodies:     true,
    ShowCelNav:              true,
    ShowBlackHoles:          true,
    ShowQuasars:             true,
    ShowGalaxies:            true,
    Language:                'en',
    GPOverridePlanets:         false,
    GPOverrideCelNav:          false,
    GPOverrideConstellations:  false,
    GPOverrideBlackHoles:      false,
    GPOverrideQuasars:         false,
    GPOverrideGalaxies:        false,
    GPOverrideSatellites:      false,

    InsideVault: false,

    ObserverFigure: 'nikki',

    // Minutes east of UTC. -360 = CST.
    TimezoneOffsetMinutes: -360,
    StarfieldVaultHeight: 0.485,
    MoonVaultHeight:      0.545,
    SunVaultHeight:       0.545,
    MercuryVaultHeight:   0.545,
    VenusVaultHeight:     0.545,
    MarsVaultHeight:      0.545,
    JupiterVaultHeight:   0.545,
    SaturnVaultHeight:    0.545,
    UranusVaultHeight:    0.545,
    NeptuneVaultHeight:   0.545,

    ShowPlanets: true,

    // When true, starfield fades with sun elevation.
    DynamicStars: false,

    // 'none' | 'yggdrasil' | 'meru' | 'vortex' | 'vortex2' | 'discworld'
    Cosmology: 'none',

    // 'ae' | 'hellerick' | 'blank'. Affects only the map art; physics
    // always runs in the AE frame.
    MapProjection: 'ae',
    MapProjectionGe: 'hq_equirect_night',

    // 'random' | 'chart-dark' | 'chart-light' | 'celnav'
    StarfieldType: 'celnav',

    // 'heliocentric' | 'geocentric' | 'ptolemy' | 'astropixels' | 'vsop87'
    BodySource: 'astropixels',

    // StarTrepidation master forces all three on when true.
    StarApplyPrecession: false,
    StarApplyNutation:   false,
    StarApplyAberration: false,
    StarTrepidation:     true,

    // Eclipse demo state hooks. Registry sets these via intro().
    EclipseActive:     false,
    EclipseKind:       null,
    EclipseEventUTMS:  null,
    EclipsePipeline:   null,
    EclipseMinSepDeg:  null,
    EclipseMagnitude:  null,
    EclipseEventType:  null,
    EclipseSunRadiusFE:      null,
    EclipseMoonRadiusFE:     null,
    // Eclipse ground-shadow feature gate (disabled pending rework).
    ShowEclipseShadow:       false,
    // Deprecated circular-decal overrides, kept for URL back-compat.
    EclipseUmbraRadiusFE:    null,
    EclipsePenumbraRadiusFE: null,

    // Pins NightFactor = 1.0.
    PermanentNight: false,

    // Ids: 'sun' / 'moon' / planet name / 'star:<id>'. Empty = HUD collapsed.
    TrackerTargets: [
      'sun', 'moon',
      'mercury', 'venus', 'mars', 'jupiter',
      'saturn', 'uranus', 'neptune',
      ...CEL_NAV_STARS.map((x) => `star:${x.id}`),
      ...CATALOGUED_STARS.map((x) => `star:${x.id}`),
      ...BLACK_HOLES.map((x) => `star:${x.id}`),
      ...QUASARS.map((x) => `star:${x.id}`),
      ...GALAXIES.map((x) => `star:${x.id}`),
      ...SATELLITES.map((x) => `star:${x.id}`),
    ],

    ShowEphemerisReadings: false,

    // When true, only tracked bodies + their GPs render.
    SpecifiedTrackerMode: false,

    // When true, tracker GP dots/lines render for every tracked
    // target regardless of the master `ShowGroundPoints` toggle.
    TrackerGPOverride: false,

    Description: '',
    PointerFrom: [0, 0],
    PointerTo:   [0, 0],
    PointerText: '',

    // Degrees; set by mouseHandler, null in Heavenly / off-canvas.
    MouseElevation: null,
    MouseAzimuth:   null,

    FollowTarget:   null,
    FreeCamActive:  false,
    FreeCameraMode: false,
  };
}

export class FeModel extends EventTarget {
  constructor() {
    super();
    initTimeOrigin();

    this.state = defaultState();

    // Written by update(), read by renderer.
    this.computed = {
      TransMatSkyRot:            M.Unit(),
      TransMatCelestToGlobe:     M.Unit(),
      TransMatLocalFeToGlobalFe: M.Unit(),
      TransMatVaultToFe:         M.Unit(),

      SkyRotAngle:     0,
      SunCelestAngle:  0,
      MoonCelestAngle: 0,
      SunRA:  0, SunDec:  0,
      MoonRA: 0, MoonDec: 0,

      SunCelestCoord:        [0, 0, 0],
      SunCelestLatLong:      { lat: 0, lng: 0 },
      SunAnglesGlobe:        { azimuth: 0, elevation: 0 },
      SunVaultCoord:          [0, 0, 0],
      SunLocalGlobeCoord:    [0, 0, 0],
      SunOpticalVaultCoord:      [0, 0, 0],

      MoonCelestCoord:       [0, 0, 0],
      MoonNorthCelestCoord:  [0, 0, 0],
      MoonCelestLatLong:     { lat: 0, lng: 0 },
      MoonAnglesGlobe:       { azimuth: 0, elevation: 0 },
      MoonVaultCoord:         [0, 0, 0],
      MoonLocalGlobeCoord:   [0, 0, 0],
      MoonOpticalVaultCoord:     [0, 0, 0],

      MoonPhase:             0,   // 0=new, PI=full
      MoonPhaseFraction:     0,   // 0..1 illuminated fraction
      MoonRotation:          0,

      // 0 = day, 1 = full night
      NightFactor: 0,

      ObserverFeCoord: [0, 0, 0],

      OpticalVaultRadius: GEOMETRY.OpticalVaultRadiusFar,
      OpticalVaultHeight: GEOMETRY.OpticalVaultHeightFar,

      Planets: {},
    };

    this._dayOfYearLast = this.state.DayOfYear;
    this._timeLast = this.state.Time;
    this._dateTimeLast = this.state.DateTime;
  }

  setState(patch, emit = true) {
    Object.assign(this.state, patch);
    this.update();
    if (emit) this.dispatchEvent(new CustomEvent('update', { detail: this }));
  }

  resetDescription() {
    this.state.Description = '';
    this.state.PointerFrom = [0, 0];
    this.state.PointerTo   = [0, 0];
    this.state.PointerText = '';
  }

  update() {
    const s = this.state;
    const c = this.computed;

    // clamp
    s.ObserverLat  = Clamp(s.ObserverLat, -90, 90);
    s.ObserverElevation = Clamp(s.ObserverElevation, 0, 0.5);
    s.ObserverLong = ((s.ObserverLong + 180) % 360 + 360) % 360 - 180;
    s.CameraHeight = Clamp(s.CameraHeight, s.WorldModel === 'ge' ? -89.9 : -30, 89.9);
    s.CameraDirection = ((s.CameraDirection + 180) % 360 + 360) % 360 - 180;
    s.ObserverHeading = ((s.ObserverHeading % 360) + 360) % 360;
    s.Zoom         = Clamp(s.Zoom, 0.1, 10);
    s.OpticalZoom  = Clamp(s.OpticalZoom, 0.2, 75);
    s.VaultSize     = Clamp(s.VaultSize, GEOMETRY.VaultSizeMin, GEOMETRY.VaultSizeMax);
    // VaultHeight floor derives from StarfieldVaultHeight + body
    // band (HEADROOM 0.06 + SUN_RANGE 0.20 = 0.26).
    const _vhFloor = Math.max(GEOMETRY.VaultHeightMin, s.StarfieldVaultHeight + 0.26);
    s.VaultHeight   = Clamp(s.VaultHeight, _vhFloor, GEOMETRY.VaultHeightMax);
    s.OpticalVaultSize   = Clamp(s.OpticalVaultSize,
                                 GEOMETRY.OpticalVaultSizeMin, GEOMETRY.OpticalVaultSizeMax);
    s.OpticalVaultHeight = Clamp(s.OpticalVaultHeight,
                                 GEOMETRY.OpticalVaultHeightMin, GEOMETRY.OpticalVaultHeightMax);
    s.RayParameter = Clamp(s.RayParameter, 0.5, 2.0);

    const camDistMin = GEOMETRY.CameraDistanceMinRel * s.VaultSize * FE_RADIUS;
    if (s.CameraDistance < camDistMin) s.CameraDistance = camDistMin;

    // date/time sync
    s.DayOfYear = Math.round(s.DayOfYear);
    if (s.DayOfYear !== this._dayOfYearLast || s.Time !== this._timeLast) {
      s.DateTime = s.DayOfYear + s.Time / 24;
    } else {
      s.DayOfYear = Math.floor(s.DateTime);
      s.Time = (s.DateTime - s.DayOfYear) * 24;
    }
    this._dateTimeLast = s.DateTime;
    this._dayOfYearLast = s.DayOfYear;
    this._timeLast = s.Time;

    const utcDate = dateTimeToDate(s.DateTime);
    // Legacy 'heliocentric' BodySource (removed) maps to 'geocentric'
    // — the underlying pipeline always returned geocentric apparent
    // anyway, so no behaviour shift for users with old URL state.
    const bodySource = (s.BodySource === 'heliocentric')
      ? 'geocentric'
      : (s.BodySource || 'geocentric');
    const sunEq  = bodyRADec('sun',  utcDate, bodySource);
    const moonEq = bodyRADec('moon', utcDate, bodySource);
    const gmstDeg = greenwichSiderealDeg(utcDate);

    c.SkyRotAngle      = gmstDeg;
    c.TransMatSkyRot   = M.RotatingZ(ToRad(-c.SkyRotAngle));
    c.TransMatCelestToGlobe = compTransMatCelestToGlobe(
      s.ObserverLat, s.ObserverLong, c.SkyRotAngle,
    );
    c.TransMatVaultToFe = compTransMatVaultToFe(c.SkyRotAngle);
    c.ObserverFeCoord   = feLatLongToGlobalFeCoord(s.ObserverLat, s.ObserverLong, FE_RADIUS);
    c.TransMatLocalFeToGlobalFe = compTransMatLocalFeToGlobalFe(
      c.ObserverFeCoord, s.ObserverLong,
    );

    // Globe-Earth observer placement: a unit sphere of radius
    // GLOBE_RADIUS (matching FE_RADIUS so the camera scale is stable).
    // Position uses standard spherical → cartesian; orientation is
    // built so local +x = north, +y = east, +z = up (radial outward),
    // matching the optical-vault hemisphere geometry. Stored as a
    // row-major 3x3 the renderer can copy directly into a Matrix4.
    {
      const GLOBE_RADIUS = FE_RADIUS;
      const latR = ToRad(s.ObserverLat);
      const lonR = ToRad(s.ObserverLong);
      const cl = Math.cos(latR), sl = Math.sin(latR);
      const co = Math.cos(lonR), so = Math.sin(lonR);
      const px = GLOBE_RADIUS * cl * co;
      const py = GLOBE_RADIUS * cl * so;
      const pz = GLOBE_RADIUS * sl;
      // Local axes at (lat, lon):
      //   up    = ( cl*co,  cl*so,  sl)   radial outward
      //   north = (-sl*co, -sl*so,  cl)   along ∂/∂lat
      //   east  = (-so,     co,     0 )   along ∂/∂lon at the equator
      c.GlobeObserverCoord = [px, py, pz];
      c.GlobeObserverFrame = {
        northX: -sl * co, northY: -sl * so, northZ:  cl,
        eastX:  -so,      eastY:   co,      eastZ:   0,
        upX:     cl * co, upY:     cl * so, upZ:     sl,
      };
      // Celestial sphere expanded to 2·GLOBE_RADIUS so its surface
      // grazes the apex of the observer's optical dome (the dome
      // sits tangent at the observer with radius FE_RADIUS, so its
      // apex is at 2·FE_RADIUS from the world origin).
      c.GlobeVaultRadius = GLOBE_RADIUS * 2;
    }
    // helper: place a celestial point on the globe heavenly-vault
    // shell at (declination, GP longitude). GP longitude folds GMST
    // out of RA so the vault co-rotates with Earth — same convention
    // the FE vault uses, just on a sphere instead of a dome.
    const _globeVaultAt = (decDeg, gpLonDeg) => {
      const R = c.GlobeVaultRadius;
      const phi = ToRad(decDeg);
      const lam = ToRad(gpLonDeg);
      const cp = Math.cos(phi);
      return [R * cp * Math.cos(lam), R * cp * Math.sin(lam), R * Math.sin(phi)];
    };
    const _wrapLon180 = (x) => ((x + 180) % 360 + 360) % 360 - 180;

    // GE optical-vault projection. Takes a `localGlobe` vector
    // (components: zenith, east, north) and returns the body's
    // world position on the GE optical cap (hemisphere of radius
    // FE_RADIUS tangent at the observer). Sub-horizon bodies
    // (zenith ≤ 0) are parked at the far-below sentinel so they
    // disappear as their elevation crosses the horizon — same
    // convention as the FE vault.
    const _globeOpticalProject = (localGlobe) => {
      const f = c.GlobeObserverFrame;
      const obs = c.GlobeObserverCoord;
      if (!f || !obs) return [0, 0, -1000];
      if (localGlobe[0] <= 0) return [0, 0, -1000];
      const R = FE_RADIUS;
      const ax = localGlobe[2];   // north
      const ay = localGlobe[1];   // east
      const az = localGlobe[0];   // zenith
      return [
        obs[0] + R * (ax * f.northX + ay * f.eastX + az * f.upX),
        obs[1] + R * (ax * f.northY + ay * f.eastY + az * f.upY),
        obs[2] + R * (ax * f.northZ + ay * f.eastZ + az * f.upZ),
      ];
    };

    // --- sun ---
    c.SunRA = sunEq.ra; c.SunDec = sunEq.dec;
    c.SunCelestCoord   = equatorialToCelestCoord(sunEq);
    c.SunCelestLatLong = coordToLatLong(c.SunCelestCoord);
    c.SunCelestAngle   = c.SunCelestLatLong.lng;
    // Sun is master elevation reference. Moon scales by its dec-range
    // ratio; planets share SUN_RANGE.
    const HEADROOM = 0.06;
    const SUN_RANGE    = 0.20;
    const SUN_DEC_DEG  = 23.44;
    const MOON_DEC_DEG = 28.50;
    const sunDecNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
      c.SunCelestLatLong.lat / SUN_DEC_DEG));
    const sunCeil = heavenlyVaultCeiling(
      c.SunCelestLatLong.lat, s.VaultSize, s.VaultHeight, FE_RADIUS,
    );
    s.SunVaultHeight = Math.min(
      sunCeil,
      s.StarfieldVaultHeight + HEADROOM + sunDecNorm * SUN_RANGE,
    );
    c.SunGlobeVaultCoord = _globeVaultAt(
      c.SunCelestLatLong.lat,
      _wrapLon180(c.SunRA * 180 / Math.PI - c.SkyRotAngle),
    );
    c.SunVaultCoord = vaultCoordToGlobalFeCoord(
      vaultCoordAt(c.SunCelestLatLong.lat, c.SunCelestLatLong.lng,
                   s.SunVaultHeight, FE_RADIUS),
      c.TransMatVaultToFe,
    );
    c.SunLocalGlobeCoord = celestCoordToLocalGlobeCoord(
      c.SunCelestCoord, c.TransMatCelestToGlobe,
    );
    c.SunAnglesGlobe     = localGlobeCoordToAngles(c.SunLocalGlobeCoord);
    c.SunOpticalVaultCoord   = localGlobeCoordToGlobalFeCoord(
      opticalVaultProject(c.SunLocalGlobeCoord, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
      c.TransMatLocalFeToGlobalFe,
    );
    c.SunGlobeOpticalVaultCoord = _globeOpticalProject(c.SunLocalGlobeCoord);

    // --- moon ---
    c.MoonRA = moonEq.ra; c.MoonDec = moonEq.dec;
    c.MoonCelestCoord    = equatorialToCelestCoord(moonEq);
    c.MoonCelestLatLong  = coordToLatLong(c.MoonCelestCoord);
    c.MoonCelestAngle    = c.MoonCelestLatLong.lng;
    c.MoonNorthCelestCoord = [0, 0, 1];
    // Moon slaves to the sun's ecliptic too — height = sun's
    // current vault z plus a small offset proportional to the
    // moon's ecliptic latitude β (lunar inclination ±5.14°). β
    // computed by rotating the equatorial unit vector
    // (RA, Dec) by the obliquity ε about the x-axis, taking
    // arcsin of the z component. With β = 0 the moon sits at the
    // sun's exact height — the geometric pre-condition for solar
    // eclipses, so the eclipse demos visually align when the
    // moon crosses the ecliptic.
    const ECL_OBLIQ_RAD = SUN_DEC_DEG * Math.PI / 180;
    const ECL_COS = Math.cos(ECL_OBLIQ_RAD);
    const ECL_SIN = Math.sin(ECL_OBLIQ_RAD);
    const eclipticBeta = (raRad, decRad) => Math.asin(
      Math.max(-1, Math.min(1,
        ECL_COS * Math.sin(decRad)
        - ECL_SIN * Math.cos(decRad) * Math.sin(raRad),
      )),
    );
    // Slope: 0.20 / 23.44° ≈ 0.00427 per degree. Same slope the
    // sun uses for dec → height, so β offsets sit on the same
    // proportional scale as the rest of the dome.
    const ECLIPTIC_HEIGHT_PER_DEG = SUN_RANGE / (2 * SUN_DEC_DEG);
    const moonBetaDeg = eclipticBeta(c.MoonRA, c.MoonDec) * 180 / Math.PI;
    const moonCeil = heavenlyVaultCeiling(
      c.MoonCelestLatLong.lat, s.VaultSize, s.VaultHeight, FE_RADIUS,
    );
    const moonFloor = s.StarfieldVaultHeight + HEADROOM;
    s.MoonVaultHeight = Math.max(
      moonFloor,
      Math.min(moonCeil, s.SunVaultHeight + moonBetaDeg * ECLIPTIC_HEIGHT_PER_DEG),
    );
    c.MoonGlobeVaultCoord = _globeVaultAt(
      c.MoonCelestLatLong.lat,
      _wrapLon180(c.MoonRA * 180 / Math.PI - c.SkyRotAngle),
    );
    c.MoonVaultCoord = vaultCoordToGlobalFeCoord(
      vaultCoordAt(c.MoonCelestLatLong.lat, c.MoonCelestLatLong.lng,
                   s.MoonVaultHeight, FE_RADIUS),
      c.TransMatVaultToFe,
    );
    c.MoonLocalGlobeCoord = celestCoordToLocalGlobeCoord(
      c.MoonCelestCoord, c.TransMatCelestToGlobe,
    );
    c.MoonAnglesGlobe     = localGlobeCoordToAngles(c.MoonLocalGlobeCoord);
    c.MoonOpticalVaultCoord   = localGlobeCoordToGlobalFeCoord(
      opticalVaultProject(c.MoonLocalGlobeCoord, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
      c.TransMatLocalFeToGlobalFe,
    );
    c.MoonGlobeOpticalVaultCoord = _globeOpticalProject(c.MoonLocalGlobeCoord);

    // --- analemma accumulators ---
    // One vault-coord point per integer day-of-year while the
    // corresponding flag is on. Cleared whenever the cache key
    // (observer / time-of-day / year / bodySource) changes.
    // WorldModel folded into the cache key: switching FE↔GE resets
    // the trace because the source coord changes (FE optical-vault →
    // globe optical-vault projection).
    const _ge = s.WorldModel === 'ge';
    const analKey = `${s.WorldModel}|${s.ObserverLat}|${s.ObserverLong}|${s.ObserverHeading}|${Math.round(s.Time*1000)/1000}|${utcDate.getUTCFullYear()}|${bodySource}`;
    this._sunAnalemma  = this._sunAnalemma  || { points: [], lastDay: -1, key: null };
    this._moonAnalemma = this._moonAnalemma || { points: [], lastDay: -1, key: null };
    const stepAnalemma = (slot, flag, srcCoord) => {
      if (!flag) {
        slot.points.length = 0; slot.lastDay = -1; slot.key = null;
        return;
      }
      if (slot.key !== analKey) {
        slot.points.length = 0; slot.lastDay = -1; slot.key = analKey;
      }
      // Skip below-horizon sentinel — same convention as stepVaultArc.
      if (!srcCoord || srcCoord[2] === -1000) return;
      if (s.DayOfYear !== slot.lastDay) {
        slot.points.push(srcCoord[0], srcCoord[1], srcCoord[2]);
        slot.lastDay = s.DayOfYear;
      }
    };
    const sunOptSrc  = _ge ? (c.SunGlobeOpticalVaultCoord  || c.SunOpticalVaultCoord)  : c.SunOpticalVaultCoord;
    const moonOptSrc = _ge ? (c.MoonGlobeOpticalVaultCoord || c.MoonOpticalVaultCoord) : c.MoonOpticalVaultCoord;
    stepAnalemma(this._sunAnalemma,  s.ShowSunAnalemma,  sunOptSrc);
    stepAnalemma(this._moonAnalemma, s.ShowMoonAnalemma, moonOptSrc);
    c.SunAnalemmaPoints  = this._sunAnalemma.points;
    c.MoonAnalemmaPoints = this._moonAnalemma.points;

    // Heavenly-vault sun-arc accumulator: appends the heavenly vault
    // sun coord every frame the flag is on. Disc-anchored (not
    // observer-local), so the resulting curve sits over the disc grid
    // — that's what binds the analemma to the FE sky like the
    // tropic / equator rings imply. Reset on flag off→on.
    const stepVaultArc = (slot, on, srcCoord) => {
      if (!on) {
        slot.points.length = 0;
        slot.wasOn = false;
        slot.key = null;
        return;
      }
      const arcKey = `${s.WorldModel}|${s.ObserverLat}|${utcDate.getUTCFullYear()}|${bodySource}`;
      if (!slot.wasOn || slot.key !== arcKey) {
        slot.points.length = 0;
        slot.key = arcKey;
        slot.wasOn = true;
      }
      // Skip the below-horizon sentinel ([0, 0, -1000]) the GE
      // optical-vault projection emits — appending it produces a
      // vertical line dropping off the sphere.
      if (!srcCoord || srcCoord[2] === -1000) return;
      const pts = slot.points;
      const n = pts.length;
      if (n < 3
          || pts[n - 3] !== srcCoord[0]
          || pts[n - 2] !== srcCoord[1]
          || pts[n - 1] !== srcCoord[2]) {
        pts.push(srcCoord[0], srcCoord[1], srcCoord[2]);
      }
    };
    this._sunVaultArc  = this._sunVaultArc  || { points: [], wasOn: false, key: null };
    this._moonVaultArc = this._moonVaultArc || { points: [], wasOn: false, key: null };
    // GE branch uses the observer-local optical-vault coord (sun /
    // moon position on the local sky hemisphere) so daily-arc motion
    // is captured. The heavenly-vault coord on the globe is fixed to
    // the celestial sphere and only drifts ~1°/day, which would
    // produce a zig-zag through 12 widely-spaced monthly points.
    const sunArcSrc  = _ge ? (c.SunGlobeOpticalVaultCoord  || c.SunVaultCoord)  : c.SunVaultCoord;
    const moonArcSrc = _ge ? (c.MoonGlobeOpticalVaultCoord || c.MoonVaultCoord) : c.MoonVaultCoord;
    stepVaultArc(this._sunVaultArc,  s.SunVaultArcOn,  sunArcSrc);
    stepVaultArc(this._moonVaultArc, s.MoonVaultArcOn, moonArcSrc);
    c.SunVaultArcPoints  = this._sunVaultArc.points;
    c.MoonVaultArcPoints = this._moonVaultArc.points;

    // Dome caustic: optional. When ShowDomeCaustic is on, ray-trace
    // the heavenly-vault interior reflection of the sun and bin the
    // hits into a density grid; renderer reads the local-max peaks.
    if (s.ShowDomeCaustic) {
      const domeR = s.VaultSize * FE_RADIUS;
      const domeH = s.VaultHeight;

      // Cache key — re-trace only when sun position, dome shape, or
      // observer placement actually changed. Each setState triggers a
      // full update(), so without the cache the 28k-ray trace would
      // run every time a UI toggle flips, dragging the Heavenly ↔
      // Optical swap into multi-frame stalls.
      const sv = c.SunVaultCoord;
      const ob = c.ObserverFeCoord || [0, 0, 0];
      const key = `${sv[0].toFixed(5)}|${sv[1].toFixed(5)}|${sv[2].toFixed(5)}|`
                + `${domeR.toFixed(4)}|${domeH.toFixed(4)}|`
                + `${ob[0].toFixed(5)}|${ob[1].toFixed(5)}|${ob[2].toFixed(5)}`;
      let result;
      if (this._domeCausticKey === key && this._domeCausticResult) {
        result = this._domeCausticResult;
      } else {
        result = traceDomeCaustic({
          sunPos:  sv,
          domeR, domeH,
          discClipR: FE_RADIUS * 1.4,
          nTheta: 240, nPhi: 120,
          observerCoord: ob,
        });
        this._domeCausticKey = key;
        this._domeCausticResult = result;
      }
      c.DomeCausticPeaks    = result.peaks;
      c.DomeCausticPeakMax  = result.peakMax;
      c.DomeCausticPeakSun  = result.peakSun;

      // Optical-vault orange ghost sun — mirror of the apparent sun
      // through the observer's zenith axis. Light from the real sun
      // reaches the observer along two paths: the direct line (the
      // apparent sun) and a wrap-around path through the dome that,
      // by symmetry, converges at the same elevation but the
      // antipodal azimuth. As the apparent sun (yellow) traces its
      // arc, the orange traces an exactly mirrored arc on the
      // opposite side at the same elevation.
      const opticals = [];
      const obs = c.ObserverFeCoord || [0, 0, 0];
      const sopt = c.SunOpticalVaultCoord;
      if (sopt) {
        const lx = sopt[0] - obs[0];
        const ly = sopt[1] - obs[1];
        const lz = sopt[2] - obs[2];
        if (lz > 0) {
          opticals.push({
            x: obs[0] - lx,
            y: obs[1] - ly,
            z: obs[2] + lz,
            intensity: 1,
          });
        }
      }
      c.DomeCausticOpticalPeaks = opticals;
    } else {
      c.DomeCausticPeaks         = null;
      c.DomeCausticPeakMax       = 0;
      c.DomeCausticPeakSun       = null;
      c.DomeCausticOpticalPeaks  = null;
      this._domeCausticKey = null;
      this._domeCausticResult = null;
    }

    // Moon phase. Both `SunCelestCoord` and `MoonCelestCoord` are
    // unit direction vectors from `equatorialToCelestCoord` of the
    // body's geocentric apparent RA / Dec — distance / AU are not
    // involved. The "sun-at-infinity" approximation
    // (moon→sun ≈ SunCelestCoord) introduces ~0.5° error worst-case
    // (sin(parallax) ≈ moon-AU / sun-AU ≈ 0.0026).
    // `MoonPhase` is in [0, π]: 0 = full (sun and moon on opposite
    // celestial directions, terminator at 1.0 illumination),
    // π = new. `MoonPhaseFraction` = 0.5·(1 + cos MoonPhase) maps
    // back to a [0..1] illuminated fraction.
    const moonToGlobe = V.Norm(V.Scale(c.MoonCelestCoord, -1));
    const moonToSun   = V.Norm(V.Sub(c.SunCelestCoord, V.Scale(c.MoonCelestCoord, 0)));
    const shadowUp    = V.Norm(V.Mult(moonToSun, moonToGlobe));
    c.MoonPhase = Math.acos(Limit1(V.ScalarProd(moonToSun, moonToGlobe)));
    c.MoonPhaseFraction = 0.5 * (1 + Math.cos(c.MoonPhase));

    // Terminator rotation as seen from the observer.
    const globeToMoon = V.Scale(celestCoordToLocalGlobeCoord(
      V.Scale(moonToGlobe, -1), c.TransMatCelestToGlobe,
    ), 1);
    let camRight = V.Mult(globeToMoon, [1, 0, 0]);
    if (V.Length(camRight) === 0) {
      camRight = V.Mult(globeToMoon, [0, 1, 0]);
    }
    camRight = V.Norm(camRight);
    const camUp = V.Mult(camRight, globeToMoon);
    const moonShadowUpLocal = celestCoordToLocalGlobeCoord(shadowUp, c.TransMatCelestToGlobe);
    let rot = Math.acos(Limit1(V.ScalarProd(camUp, moonShadowUpLocal)));
    if (V.ScalarProd(moonShadowUpLocal, camRight) > 0) rot = -rot;
    c.MoonRotation = rot;

    // Optical vault dimensions. Cap height clamped under VaultHeight.
    // Inside Optical mode H := R (strict hemisphere, 1:1 elevation).
    // In Heavenly H := OpticalVaultHeight (flattened cap depiction).
    // In GE the cap geometry "wraps" the upper hemisphere of the
    // terrestrial sphere — apex at the observer, rim on the great
    // circle 90° from the observer's zenith. Radius and height both
    // = FE_RADIUS so the unit hemisphere mesh, after the renderer
    // anchors it at the world origin, exactly covers the visible
    // half of the terrestrial sphere.
    if (s.WorldModel === 'ge') {
      c.OpticalVaultRadius = FE_RADIUS;
      c.OpticalVaultHeight = FE_RADIUS;
    } else {
      c.OpticalVaultRadius = s.OpticalVaultSize;
      c.OpticalVaultHeight = Math.min(s.OpticalVaultHeight, s.VaultHeight);
    }
    c.OpticalVaultHeightEffective = s.InsideVault
      ? c.OpticalVaultRadius
      : c.OpticalVaultHeight;

    // Linear fade across civil twilight: 0 at sun elev ≥ 0°, 1 at ≤ -12°.
    if (s.PermanentNight) {
      c.NightFactor = 1;
    } else {
      const sunElev = c.SunAnglesGlobe.elevation;
      c.NightFactor = Limit01((-sunElev) / 12.0);
    }

    // Planets slave to the sun's ecliptic. Default height tracks
    // s.SunVaultHeight plus a small offset proportional to the
    // planet's ecliptic latitude β. Real-world solar-system
    // |β|max stays under ~7° (Mercury) so the offset is tiny in
    // proportion to the sim's height range — the offsets read as
    // a thin band of bodies riding the sun's arc.
    const PLANET_RANGE_KEY = {
      mercury: 'MercuryVaultHeight', venus: 'VenusVaultHeight',
      mars: 'MarsVaultHeight', jupiter: 'JupiterVaultHeight',
      saturn: 'SaturnVaultHeight',
      uranus: 'UranusVaultHeight', neptune: 'NeptuneVaultHeight',
    };
    const sunVaultZ = s.SunVaultHeight;

    c.Planets = {};
    for (const name of PLANET_NAMES) {
      const eq = bodyRADec(name, utcDate, bodySource);
      // NaN = pipeline lacks this body; skip geometry + marker.
      if (!Number.isFinite(eq.ra) || !Number.isFinite(eq.dec)) continue;
      const celestCoord = equatorialToCelestCoord(eq);
      const ll = coordToLatLong(celestCoord);
      // Default height: sun's vault z + (planet's ecliptic
      // latitude β) × the same dec → height slope the sun uses
      // (`SUN_RANGE / (2·SUN_DEC_DEG)` ≈ 0.00427 / °). With β =
      // 0 a planet sits exactly at the sun's height — the
      // visualisation places every body on the sun's arc with a
      // small perpendicular offset for its inclination off the
      // ecliptic plane. Manual panel slider edits aren't
      // preserved across frames yet; a future serial can add
      // `*VaultManual` flags to lock manual values.
      const planetBetaDeg = eclipticBeta(eq.ra, eq.dec) * 180 / Math.PI;
      const desired = sunVaultZ + planetBetaDeg * ECLIPTIC_HEIGHT_PER_DEG;
      const planetCeil = heavenlyVaultCeiling(ll.lat, s.VaultSize, s.VaultHeight, FE_RADIUS);
      const planetFloor = s.StarfieldVaultHeight + HEADROOM;
      const planetZ = Math.max(planetFloor, Math.min(planetCeil, desired));
      s[PLANET_RANGE_KEY[name]] = planetZ;
      const vaultCoord = vaultCoordToGlobalFeCoord(
        vaultCoordAt(ll.lat, ll.lng, planetZ, FE_RADIUS),
        c.TransMatVaultToFe,
      );
      const globeVaultCoord = _globeVaultAt(
        ll.lat,
        _wrapLon180(eq.ra * 180 / Math.PI - c.SkyRotAngle),
      );
      const localGlobe = celestCoordToLocalGlobeCoord(celestCoord, c.TransMatCelestToGlobe);
      const anglesGlobe = localGlobeCoordToAngles(localGlobe);
      const opticalVaultCoord = localGlobeCoordToGlobalFeCoord(
        opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
        c.TransMatLocalFeToGlobalFe,
      );
      const globeOpticalVaultCoord = _globeOpticalProject(localGlobe);
      c.Planets[name] = {
        ra: eq.ra, dec: eq.dec,
        celestCoord, celestLatLong: ll,
        vaultCoord, globeVaultCoord, opticalVaultCoord, globeOpticalVaultCoord,
        anglesGlobe,
      };
    }

    // Star projection. Trepidation master forces all three apparent-of-
    // date corrections; otherwise the three booleans apply independently.
    const starOpts = s.StarTrepidation
      ? { precession: true, nutation: true, aberration: true }
      : {
          precession: !!s.StarApplyPrecession,
          nutation:   !!s.StarApplyNutation,
          aberration: !!s.StarApplyAberration,
        };
    const STAR_VAULT_HEIGHT = s.StarfieldVaultHeight;
    const projectStar = (star) => {
      const raJ2000  = (star.raH / 24) * 2 * Math.PI;
      const decJ2000 = star.decD * Math.PI / 180;
      const apparent = apparentStarPosition(raJ2000, decJ2000, utcDate, starOpts);
      const ra  = apparent.ra;
      const dec = apparent.dec;
      const celestCoord   = equatorialToCelestCoord({ ra, dec });
      const celestLatLong = coordToLatLong(celestCoord);
      const vaultCoord    = vaultCoordToGlobalFeCoord(
        vaultCoordAt(celestLatLong.lat, celestLatLong.lng, STAR_VAULT_HEIGHT, FE_RADIUS),
        c.TransMatVaultToFe,
      );
      const globeVaultCoord = _globeVaultAt(
        celestLatLong.lat,
        _wrapLon180(ra * 180 / Math.PI - c.SkyRotAngle),
      );
      const localGlobe  = celestCoordToLocalGlobeCoord(celestCoord, c.TransMatCelestToGlobe);
      const anglesGlobe = localGlobeCoordToAngles(localGlobe);
      const opticalVaultCoord = localGlobeCoordToGlobalFeCoord(
        opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
        c.TransMatLocalFeToGlobalFe,
      );
      const globeOpticalVaultCoord = _globeOpticalProject(localGlobe);
      return {
        id:   star.id,
        name: star.name,
        mag:  star.mag,
        ra, dec,
        celestCoord, celestLatLong,
        vaultCoord, globeVaultCoord, opticalVaultCoord, globeOpticalVaultCoord,
        anglesGlobe,
      };
    };
    c.CelNavStars     = CEL_NAV_STARS.map(projectStar);
    c.CataloguedStars = CATALOGUED_STARS.map(projectStar);
    c.BlackHoles      = BLACK_HOLES.map(projectStar);
    c.Quasars         = QUASARS.map(projectStar);
    c.Galaxies        = GALAXIES.map(projectStar);

    // Satellites: sub-point (lat, lon) computed per-frame from
    // two-body Kepler; projected through the same vault /
    // local-globe / optical-vault machinery as stars. Built when
    // ShowSatellites is on OR when any `star:sat_*` id sits in the
    // tracker — so per-chip clicks alone are enough to make a
    // satellite render without also flipping the master.
    const SAT_VAULT_HEIGHT = 0.15;
    const _trackerHasSat = (Array.isArray(s.TrackerTargets) ? s.TrackerTargets : [])
      .some((t) => typeof t === 'string' && t.startsWith('star:sat_'));
    const _followIsSat = typeof s.FollowTarget === 'string' && s.FollowTarget.startsWith('star:sat_');
    if (s.ShowSatellites || _trackerHasSat || _followIsSat) {
      const projectSatellite = (sat) => {
        const sub = satelliteSubPoint(sat, utcDate);
        const decRad = sub.lat * Math.PI / 180;
        const raRad  = (sub.lon + c.SkyRotAngle) * Math.PI / 180;
        const celestCoord   = equatorialToCelestCoord({ ra: raRad, dec: decRad });
        const celestLatLong = coordToLatLong(celestCoord);
        const vaultCoord    = vaultCoordToGlobalFeCoord(
          vaultCoordAt(celestLatLong.lat, celestLatLong.lng, SAT_VAULT_HEIGHT, FE_RADIUS),
          c.TransMatVaultToFe,
        );
        const globeVaultCoord = _globeVaultAt(celestLatLong.lat, sub.lon);
        const localGlobe  = celestCoordToLocalGlobeCoord(celestCoord, c.TransMatCelestToGlobe);
        const anglesGlobe = localGlobeCoordToAngles(localGlobe);
        const opticalVaultCoord = localGlobeCoordToGlobalFeCoord(
          opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
          c.TransMatLocalFeToGlobalFe,
        );
        const globeOpticalVaultCoord = _globeOpticalProject(localGlobe);
        return {
          id: sat.id, name: sat.name,
          ra: raRad, dec: decRad,
          celestCoord, celestLatLong, globeVaultCoord,
          vaultCoord, opticalVaultCoord, globeOpticalVaultCoord,
          anglesGlobe,
        };
      };
      c.Satellites = [...SATELLITES, ...SATELLITES_EXTRA].map(projectSatellite);
    } else {
      c.Satellites = [];
    }

    // GP path overlay: per-category 24 h sub-point traces. Flat map
    // from a unique id → { pts, color } so the renderer doesn't need
    // category metadata. Each category's contribution is gated by its
    // own GPPath<Category> state flag.
    c.GPPaths = {};
    const gmstDegAt = (date) => {
      const jd = date.getTime() / 86400000 + 2440587.5;
      const T = (jd - 2451545.0) / 36525;
      let g = (280.46061837 + 360.98564736629 * (jd - 2451545.0)
              + 0.000387933 * T * T) % 360;
      if (g < 0) g += 360;
      return g;
    };
    const dayMs  = utcDate.getTime();
    // GP path span. Default 1 day = the body's diurnal rotation.
    // When the user bumps `GPPathDays` up to e.g. 365, the trace
    // covers a full year so planets / sun / moon's declination
    // drift is visible as a band, not just a circle. Sample count
    // scales with span so the trace stays smooth for both short
    // and long horizons.
    const _gpDays   = Math.max(0.0417, Math.min(3650, +s.GPPathDays || 1));
    const _gpSpanMs = _gpDays * 86400000;
    const N_GP = Math.max(48, Math.min(2048, Math.round(48 * Math.sqrt(_gpDays))));
    const sampleFrom = (getRaDec) => {
      const pts = [];
      const latLon = [];
      for (let i = 0; i <= N_GP; i++) {
        const d = new Date(dayMs + (i / N_GP) * _gpSpanMs);
        const eq = getRaDec(d);
        if (!eq || !Number.isFinite(eq.ra) || !Number.isFinite(eq.dec)) return null;
        const gpLat = eq.dec * 180 / Math.PI;
        const raDeg = ((eq.ra * 180 / Math.PI) % 360 + 360) % 360;
        let gpLon = raDeg - gmstDegAt(d);
        gpLon = ((gpLon + 180) % 360 + 360) % 360 - 180;
        pts.push(canonicalLatLongToDisc(gpLat, gpLon, FE_RADIUS));
        latLon.push([gpLat, gpLon]);
      }
      return { pts, latLon };
    };
    const sampleFromSubPointFn = (subFn) => {
      const pts = [];
      const latLon = [];
      for (let i = 0; i <= N_GP; i++) {
        const d = new Date(dayMs + (i / N_GP) * _gpSpanMs);
        const sub = subFn(d);
        pts.push(canonicalLatLongToDisc(sub.lat, sub.lon, FE_RADIUS));
        latLon.push([sub.lat, sub.lon]);
      }
      return { pts, latLon };
    };

    // Single master toggle — `ShowGPPath` (lives in Tracker Options).
    // Traces are drawn only for bodies currently in TrackerTargets
    // (plus FollowTarget), so the disc doesn't fill with every star
    // circle when the user just wants to see a handful of paths.
    if (s.ShowGPPath) {
      const activeEph = bodySource === 'geocentric'   ? ephGeo
                      : bodySource === 'ptolemy'      ? ephPtol
                      : bodySource === 'vsop87'       ? ephVsop
                      :                                 ephApix;
      const trackerTargetArr = Array.isArray(s.TrackerTargets) ? s.TrackerTargets : [];
      const gpSet = new Set(trackerTargetArr);
      if (s.FollowTarget) gpSet.add(s.FollowTarget);

      const PLANET_COLORS = {
        sun: 0xffc844, moon: 0xf4f4f4,
        mercury: 0xd0b090, venus: 0xfff0c8, mars: 0xd05040,
        jupiter: 0xffa060, saturn: 0xe4c888,
        uranus: 0xa8d8e0, neptune: 0x7fa6e8,
      };
      for (const [body, color] of Object.entries(PLANET_COLORS)) {
        if (!gpSet.has(body)) continue;
        const sampled = sampleFrom((d) => {
          try { return activeEph.bodyGeocentric(body, d); } catch { return null; }
        });
        if (sampled) {
          c.GPPaths[`p:${body}`] = { pts: sampled.pts, latLon: sampled.latLon, color };
        }
      }

      // Stars: use `apparentStarPosition` with full apparent-of-date
      // corrections so precession + nutation + aberration produce a
      // visible declination drift across a year (~50″/yr precession,
      // 9″ nutation oscillation, 20″ aberration ellipse). Without
      // these the star's GP collapses to a single circle of constant
      // latitude regardless of how long the path span is.
      const sampleFixedStar = (raRad, decRad) =>
        sampleFrom((d) => apparentStarPosition(raRad, decRad, d, {
          precession: true, nutation: true, aberration: true,
        }));
      const starCategories = [
        [CEL_NAV_STARS,    0xffe8a0, 'cn'],
        [CATALOGUED_STARS, 0xffffff, 'cat'],
        [BLACK_HOLES,      0x9966ff, 'bh'],
        [QUASARS,          0x40e0d0, 'q'],
        [GALAXIES,         0xff80c0, 'gal'],
      ];
      for (const [list, color, prefix] of starCategories) {
        for (const star of list) {
          if (!gpSet.has(`star:${star.id}`)) continue;
          const raRad  = (star.raH / 24) * 2 * Math.PI;
          const decRad = star.decD * Math.PI / 180;
          const sampled = sampleFixedStar(raRad, decRad);
          if (sampled) {
            c.GPPaths[`${prefix}:${star.id}`] = {
              pts: sampled.pts, latLon: sampled.latLon, color,
            };
          }
        }
      }

      for (const sat of [...SATELLITES, ...SATELLITES_EXTRA]) {
        if (!gpSet.has(`star:${sat.id}`)) continue;
        const sampled = sampleFromSubPointFn((d) => satelliteSubPoint(sat, d));
        c.GPPaths[`sat:${sat.id}`] = {
          pts: sampled.pts, latLon: sampled.latLon, color: 0x66ff88,
        };
      }
    }

    c.TrackerInfos = [];
    const targets = Array.isArray(s.TrackerTargets) ? [...s.TrackerTargets] : [];
    const followOnlyIds = new Set();
    if (s.FollowTarget && !targets.includes(s.FollowTarget)) {
      targets.push(s.FollowTarget);
      followOnlyIds.add(s.FollowTarget);
    }
    const wrapLon = (x) => ((x + 180) % 360 + 360) % 360 - 180;

    for (const target of targets) {
      let info = null;

      if (target === 'sun') {
        const rGeo   = ephGeo.bodyGeocentric('sun', utcDate);
        const rPtol  = ephPtol.bodyGeocentric('sun', utcDate);
        const rApix  = ephApix.bodyGeocentric('sun', utcDate);
        const rVsop  = ephVsop.bodyGeocentric('sun', utcDate);
        info = {
          target, name: 'Sun', category: 'luminary',
          azimuth: c.SunAnglesGlobe.azimuth,
          elevation: c.SunAnglesGlobe.elevation,
          geoReading:        { ra: rGeo.ra,   dec: rGeo.dec   },
          ptolemyReading:    { ra: rPtol.ra,  dec: rPtol.dec  },
          astropixelsReading:{ ra: rApix.ra,  dec: rApix.dec  },
          vsop87Reading:     { ra: rVsop.ra,  dec: rVsop.dec  },
          gpLat: c.SunCelestLatLong.lat,
          gpLon: wrapLon(c.SunRA * 180 / Math.PI - c.SkyRotAngle),
          vaultCoord: c.SunVaultCoord,
        };
      } else if (target === 'moon') {
        const rGeo   = ephGeo.bodyGeocentric('moon', utcDate);
        const rPtol  = ephPtol.bodyGeocentric('moon', utcDate);
        const rApix  = ephApix.bodyGeocentric('moon', utcDate);
        const rVsop  = ephVsop.bodyGeocentric('moon', utcDate);
        info = {
          target, name: 'Moon', category: 'luminary',
          azimuth: c.MoonAnglesGlobe.azimuth,
          elevation: c.MoonAnglesGlobe.elevation,
          geoReading:        { ra: rGeo.ra,   dec: rGeo.dec   },
          ptolemyReading:    { ra: rPtol.ra,  dec: rPtol.dec  },
          astropixelsReading:{ ra: rApix.ra,  dec: rApix.dec  },
          vsop87Reading:     { ra: rVsop.ra,  dec: rVsop.dec  },
          gpLat: c.MoonCelestLatLong.lat,
          gpLon: wrapLon(c.MoonRA * 180 / Math.PI - c.SkyRotAngle),
          vaultCoord: c.MoonVaultCoord,
        };
      } else if (PLANET_NAMES.includes(target)) {
        const p = c.Planets[target];
        if (p) {
          const rGeo   = ephGeo.bodyGeocentric(target, utcDate);
          const rPtol  = ephPtol.bodyGeocentric(target, utcDate);
          const rApix  = ephApix.bodyGeocentric(target, utcDate);
          const rVsop  = ephVsop.bodyGeocentric(target, utcDate);
          const gpColor = PLANET_GP_COLORS[target] || TRACKED_GP_COLORS_PLANET_DEFAULT;
          info = {
            target,
            name: target[0].toUpperCase() + target.slice(1),
            category: 'planet',
            gpColor,
            azimuth: p.anglesGlobe.azimuth,
            elevation: p.anglesGlobe.elevation,
            geoReading:        { ra: rGeo.ra,   dec: rGeo.dec   },
            ptolemyReading:    { ra: rPtol.ra,  dec: rPtol.dec  },
            astropixelsReading:{ ra: rApix.ra,  dec: rApix.dec  },
            vsop87Reading:     { ra: rVsop.ra,  dec: rVsop.dec  },
            gpLat: p.celestLatLong.lat,
            gpLon: wrapLon(p.ra * 180 / Math.PI - c.SkyRotAngle),
            vaultCoord: p.vaultCoord,
          };
        }
      } else if (target.startsWith('star:')) {
        const starId = target.slice(5);
        let entry = c.CelNavStars.find((x) => x.id === starId);
        let def   = celNavStarById(starId);
        let cat   = 'celnav';
        if (!entry) {
          entry = c.CataloguedStars.find((x) => x.id === starId);
          def   = cataloguedStarById(starId);
          if (entry) cat = 'catalogued';
        }
        if (!entry) {
          entry = c.BlackHoles.find((x) => x.id === starId);
          def   = blackHoleById(starId);
          if (entry) cat = 'blackhole';
        }
        if (!entry) {
          entry = c.Quasars.find((x) => x.id === starId);
          def   = quasarById(starId);
          if (entry) cat = 'quasar';
        }
        if (!entry) {
          entry = c.Galaxies.find((x) => x.id === starId);
          def   = galaxyById(starId);
          if (entry) cat = 'galaxy';
        }
        if (!entry) {
          entry = c.Satellites.find((x) => x.id === starId);
          def   = satelliteById(starId) || (entry ? { name: entry.name, mag: -1.5 } : null);
          if (entry) cat = 'satellite';
        }
        if (entry && def) {
          // Star RA/Dec is pipeline-independent; all five readings share it.
          const gpColorByCat = {
            celnav:     0xffe8a0,  // warm yellow
            catalogued: 0xffffff,  // white
            blackhole:  0x9966ff,  // purple
            quasar:     0x40e0d0,  // cyan
            galaxy:     0xff80c0,  // pink
            satellite:  0x66ff88,  // lime green
          };
          // Stars carry a single catalog RA / Dec — no five-pipeline
          // ephemeris comparison applies. Drop the redundant
          // `*Reading` copies; the tracker HUD already gates the
          // comparison block on `info.category !== 'star'`, and the
          // tracking-info popup reads `info.ra` / `info.dec` for
          // stars (with fallbacks for sun / moon / planets that do
          // populate the per-pipeline readings).
          info = {
            target, name: def.name, category: 'star', subCategory: cat, mag: def.mag,
            gpColor: gpColorByCat[cat] || 0xffffff,
            azimuth: entry.anglesGlobe.azimuth,
            elevation: entry.anglesGlobe.elevation,
            ra:  entry.ra,
            dec: entry.dec,
            gpLat: entry.celestLatLong.lat,
            gpLon: wrapLon(entry.ra * 180 / Math.PI - c.SkyRotAngle),
            vaultCoord: entry.vaultCoord,
          };
        }
      }

      if (info) {
        info.activeSource = bodySource;
        info.utcMs = utcDate.getTime();
        info._followOnly = followOnlyIds.has(target);
        c.TrackerInfos.push(info);
      }
    }
  }
}
