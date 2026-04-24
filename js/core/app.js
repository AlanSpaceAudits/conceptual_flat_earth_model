// FE Dome Model — application state and per-frame Update pipeline.
//
// State fields are intentionally flat so the UI layer can bind directly to
// them. Every mutation goes through setState() which triggers a recompute
// and then emits an 'update' event for the renderer / panel to react.

import { Clamp, Limit01, Limit1, ToRad } from '../math/utils.js';
import { V } from '../math/vect3.js';
import { M } from '../math/mat3.js';
import { CELESTIAL, GEOMETRY, FE_RADIUS, initTimeOrigin } from './constants.js';
import { dateTimeToDate } from './time.js';
import {
  sunEquatorial, moonEquatorial, greenwichSiderealDeg, equatorialToCelestCoord,
  planetEquatorial, PLANET_NAMES, bodyRADec, BODY_NAMES,
  bodyGeocentric, helio as ephHelio, geo as ephGeo, ptol as ephPtol,
  apix as ephApix, vsop as ephVsop,
} from './ephemeris.js';
import { apparentStarPosition } from './ephemerisCommon.js';
import { CEL_NAV_STARS, celNavStarById } from './celnavStars.js';
import { CATALOGUED_STARS, cataloguedStarById } from './constellations.js';
import { BLACK_HOLES, blackHoleById } from './blackHoles.js';
import { QUASARS,      quasarById }    from './quasars.js';
import { GALAXIES,     galaxyById }    from './galaxies.js';
import { BRIGHT_STAR_CATALOG, bscStarById } from './brightStarCatalog.js';
import { SATELLITES,   satelliteById, satelliteSubPoint } from './satellites.js';
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
    VaultHeight: 0.4,

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
    ShowLatitudeLines: false,
    ShowGroundPoints:  false,
    ShowFacingVector:  false,
    ShowDecCircles:    false,
    ShowLogo:          true,
    ShowConstellations:      true,
    ShowConstellationLines:  true,
    ShowLongitudeRing:       false,
    ShowAzimuthRing:         true,
    ShowOpticalVaultGrid:    false,
    ShowCelestialPoles:      false,
    DarkBackground:          true,
    ShowLiveEphemeris:       false,
    MoonPhaseExpanded:       false,
    ShowSatellites:          true,
    ShowGPPath:              false,
    ShowSunAnalemma:         false,
    ShowMoonAnalemma:        false,
    ShowCelestialBodies:     true,
    ShowCelNav:              true,
    ShowBlackHoles:          true,
    ShowQuasars:             true,
    ShowGalaxies:            true,
    ShowBsc:                 false,
    GPOverridePlanets:         false,
    GPOverrideCelNav:          false,
    GPOverrideConstellations:  false,
    GPOverrideBlackHoles:      false,
    GPOverrideQuasars:         false,
    GPOverrideGalaxies:        false,
    GPOverrideBsc:             false,
    GPOverrideSatellites:      false,

    InsideVault: false,

    ObserverFigure: 'bear',

    // Minutes east of UTC. -360 = CST.
    TimezoneOffsetMinutes: -360,
    StarfieldVaultHeight: 0.28,
    MoonVaultHeight:      0.346,
    SunVaultHeight:       0.346,
    MercuryVaultHeight:   0.346,
    VenusVaultHeight:     0.346,
    MarsVaultHeight:      0.346,
    JupiterVaultHeight:   0.346,
    SaturnVaultHeight:    0.346,
    UranusVaultHeight:    0.346,
    NeptuneVaultHeight:   0.346,

    ShowPlanets: true,

    // When true, starfield fades with sun elevation.
    DynamicStars: true,

    // 'none' | 'yggdrasil' | 'meru' | 'vortex' | 'vortex2' | 'discworld'
    Cosmology: 'none',

    // 'ae' | 'hellerick' | 'blank'. Affects only the map art; physics
    // always runs in the AE frame.
    MapProjection: 'ae',

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
    s.CameraHeight = Clamp(s.CameraHeight, -30, 89.9);
    s.CameraDirection = ((s.CameraDirection + 180) % 360 + 360) % 360 - 180;
    s.ObserverHeading = ((s.ObserverHeading % 360) + 360) % 360;
    s.Zoom         = Clamp(s.Zoom, 0.1, 10);
    s.OpticalZoom  = Clamp(s.OpticalZoom, 0.2, 75);
    s.VaultSize     = Clamp(s.VaultSize, GEOMETRY.VaultSizeMin, GEOMETRY.VaultSizeMax);
    s.VaultHeight   = Clamp(s.VaultHeight, GEOMETRY.VaultHeightMin, GEOMETRY.VaultHeightMax);
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
    const bodySource = s.BodySource || 'geocentric';
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

    // --- moon ---
    c.MoonRA = moonEq.ra; c.MoonDec = moonEq.dec;
    c.MoonCelestCoord    = equatorialToCelestCoord(moonEq);
    c.MoonCelestLatLong  = coordToLatLong(c.MoonCelestCoord);
    c.MoonCelestAngle    = c.MoonCelestLatLong.lng;
    c.MoonNorthCelestCoord = [0, 0, 1];
    const MOON_RANGE = SUN_RANGE * (MOON_DEC_DEG / SUN_DEC_DEG);
    const moonDecNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
      c.MoonCelestLatLong.lat / MOON_DEC_DEG));
    const moonCeil = heavenlyVaultCeiling(
      c.MoonCelestLatLong.lat, s.VaultSize, s.VaultHeight, FE_RADIUS,
    );
    s.MoonVaultHeight = Math.min(
      moonCeil,
      s.StarfieldVaultHeight + HEADROOM + moonDecNorm * MOON_RANGE,
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

    // --- analemma accumulators ---
    // One vault-coord point per integer day-of-year while the
    // corresponding flag is on. Cleared whenever the cache key
    // (observer / time-of-day / year / bodySource) changes.
    const analKey = `${s.ObserverLat}|${s.ObserverLong}|${s.ObserverHeading}|${Math.round(s.Time*1000)/1000}|${utcDate.getUTCFullYear()}|${bodySource}`;
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
      if (s.DayOfYear !== slot.lastDay) {
        slot.points.push(srcCoord[0], srcCoord[1], srcCoord[2]);
        slot.lastDay = s.DayOfYear;
      }
    };
    stepAnalemma(this._sunAnalemma,  s.ShowSunAnalemma,  c.SunOpticalVaultCoord);
    stepAnalemma(this._moonAnalemma, s.ShowMoonAnalemma, c.MoonOpticalVaultCoord);
    c.SunAnalemmaPoints  = this._sunAnalemma.points;
    c.MoonAnalemmaPoints = this._moonAnalemma.points;

    // Moon phase (sun-at-infinity: moon→sun ≈ SunCelestCoord).
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
    c.OpticalVaultRadius = s.OpticalVaultSize;
    c.OpticalVaultHeight = Math.min(s.OpticalVaultHeight, s.VaultHeight);
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

    // Planets share sun's dec-range so they anchor at sun's z.
    const PLANET_BASELINE = {
      mercury: 0, venus: 0, mars: 0, jupiter: 0, saturn: 0,
      uranus:  0, neptune: 0,
    };
    const PLANET_RANGE_KEY = {
      mercury: 'MercuryVaultHeight', venus: 'VenusVaultHeight',
      mars: 'MarsVaultHeight', jupiter: 'JupiterVaultHeight',
      saturn: 'SaturnVaultHeight',
      uranus: 'UranusVaultHeight', neptune: 'NeptuneVaultHeight',
    };
    const PLANET_DEC_RANGE = SUN_RANGE;

    c.Planets = {};
    for (const name of PLANET_NAMES) {
      const eq = bodyRADec(name, utcDate, bodySource);
      // NaN = pipeline lacks this body; skip geometry + marker.
      if (!Number.isFinite(eq.ra) || !Number.isFinite(eq.dec)) continue;
      const celestCoord = equatorialToCelestCoord(eq);
      const ll = coordToLatLong(celestCoord);
      const decNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
        eq.dec / Math.PI * 180 / SUN_DEC_DEG));
      const desired = s.StarfieldVaultHeight + HEADROOM
                    + PLANET_BASELINE[name]
                    + decNorm * PLANET_DEC_RANGE;
      const planetCeil = heavenlyVaultCeiling(ll.lat, s.VaultSize, s.VaultHeight, FE_RADIUS);
      const planetZ = Math.min(planetCeil, desired);
      s[PLANET_RANGE_KEY[name]] = planetZ;
      const vaultCoord = vaultCoordToGlobalFeCoord(
        vaultCoordAt(ll.lat, ll.lng, planetZ, FE_RADIUS),
        c.TransMatVaultToFe,
      );
      const localGlobe = celestCoordToLocalGlobeCoord(celestCoord, c.TransMatCelestToGlobe);
      const anglesGlobe = localGlobeCoordToAngles(localGlobe);
      const opticalVaultCoord = localGlobeCoordToGlobalFeCoord(
        opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
        c.TransMatLocalFeToGlobalFe,
      );
      c.Planets[name] = {
        ra: eq.ra, dec: eq.dec,
        celestCoord, celestLatLong: ll,
        vaultCoord, opticalVaultCoord,
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
      const localGlobe  = celestCoordToLocalGlobeCoord(celestCoord, c.TransMatCelestToGlobe);
      const anglesGlobe = localGlobeCoordToAngles(localGlobe);
      const opticalVaultCoord = localGlobeCoordToGlobalFeCoord(
        opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
        c.TransMatLocalFeToGlobalFe,
      );
      return {
        id:   star.id,
        name: star.name,
        mag:  star.mag,
        ra, dec,
        celestCoord, celestLatLong,
        vaultCoord, opticalVaultCoord,
        anglesGlobe,
      };
    };
    c.CelNavStars     = CEL_NAV_STARS.map(projectStar);
    c.CataloguedStars = CATALOGUED_STARS.map(projectStar);
    c.BlackHoles      = BLACK_HOLES.map(projectStar);
    c.Quasars         = QUASARS.map(projectStar);
    c.Galaxies        = GALAXIES.map(projectStar);
    c.BscStars        = s.ShowBsc ? BRIGHT_STAR_CATALOG.map(projectStar) : [];

    // Satellites: sub-point (lat, lon) computed per-frame from
    // two-body Kepler; projected through the same vault /
    // local-globe / optical-vault machinery as stars. Only built
    // when ShowSatellites is on so the 12-entry catalogue isn't
    // iterated every frame for no reason.
    const SAT_VAULT_HEIGHT = 0.15;
    if (s.ShowSatellites) {
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
        const localGlobe  = celestCoordToLocalGlobeCoord(celestCoord, c.TransMatCelestToGlobe);
        const anglesGlobe = localGlobeCoordToAngles(localGlobe);
        const opticalVaultCoord = localGlobeCoordToGlobalFeCoord(
          opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
          c.TransMatLocalFeToGlobalFe,
        );
        return {
          id: sat.id, name: sat.name,
          ra: raRad, dec: decRad,
          celestCoord, celestLatLong,
          vaultCoord, opticalVaultCoord,
          anglesGlobe,
        };
      };
      c.Satellites = SATELLITES.map(projectSatellite);
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
    const N_GP   = 48;
    const sampleFrom = (getRaDec) => {
      const pts = [];
      for (let i = 0; i <= N_GP; i++) {
        const d = new Date(dayMs + (i / N_GP) * 86400000);
        const eq = getRaDec(d);
        if (!eq || !Number.isFinite(eq.ra) || !Number.isFinite(eq.dec)) return null;
        const gpLat = eq.dec * 180 / Math.PI;
        const raDeg = ((eq.ra * 180 / Math.PI) % 360 + 360) % 360;
        let gpLon = raDeg - gmstDegAt(d);
        gpLon = ((gpLon + 180) % 360 + 360) % 360 - 180;
        pts.push(canonicalLatLongToDisc(gpLat, gpLon, FE_RADIUS));
      }
      return pts;
    };
    const sampleFromSubPointFn = (subFn) => {
      const pts = [];
      for (let i = 0; i <= N_GP; i++) {
        const d = new Date(dayMs + (i / N_GP) * 86400000);
        const sub = subFn(d);
        pts.push(canonicalLatLongToDisc(sub.lat, sub.lon, FE_RADIUS));
      }
      return pts;
    };

    // Single master toggle — `ShowGPPath` (lives in Tracker Options).
    // Traces are drawn only for bodies currently in TrackerTargets
    // (plus FollowTarget), so the disc doesn't fill with every star
    // circle when the user just wants to see a handful of paths.
    if (s.ShowGPPath) {
      const activeEph = bodySource === 'heliocentric' ? ephHelio
                      : bodySource === 'geocentric'   ? ephGeo
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
        const pts = sampleFrom((d) => {
          try { return activeEph.bodyGeocentric(body, d); } catch { return null; }
        });
        if (pts) c.GPPaths[`p:${body}`] = { pts, color };
      }

      const sampleFixedStar = (raRad, decRad) =>
        sampleFrom(() => ({ ra: raRad, dec: decRad }));
      const starCategories = [
        [CEL_NAV_STARS,    0xffe8a0, 'cn'],
        [CATALOGUED_STARS, 0xffffff, 'cat'],
        [BLACK_HOLES,      0x9966ff, 'bh'],
        [QUASARS,          0x40e0d0, 'q'],
        [GALAXIES,         0xff80c0, 'gal'],
        [BRIGHT_STAR_CATALOG, 0xfff5d8, 'bsc'],
      ];
      for (const [list, color, prefix] of starCategories) {
        for (const star of list) {
          if (!gpSet.has(`star:${star.id}`)) continue;
          const raRad  = (star.raH / 24) * 2 * Math.PI;
          const decRad = star.decD * Math.PI / 180;
          const pts = sampleFixedStar(raRad, decRad);
          if (pts) c.GPPaths[`${prefix}:${star.id}`] = { pts, color };
        }
      }

      for (const sat of SATELLITES) {
        if (!gpSet.has(`star:${sat.id}`)) continue;
        const pts = sampleFromSubPointFn((d) => satelliteSubPoint(sat, d));
        c.GPPaths[`sat:${sat.id}`] = { pts, color: 0x66ff88 };
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
        const rHelio = ephHelio.bodyGeocentric('sun', utcDate);
        const rPtol  = ephPtol.bodyGeocentric('sun', utcDate);
        const rApix  = ephApix.bodyGeocentric('sun', utcDate);
        const rVsop  = ephVsop.bodyGeocentric('sun', utcDate);
        info = {
          target, name: 'Sun', category: 'luminary',
          azimuth: c.SunAnglesGlobe.azimuth,
          elevation: c.SunAnglesGlobe.elevation,
          helioReading:      { ra: rHelio.ra, dec: rHelio.dec },
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
        const rHelio = ephHelio.bodyGeocentric('moon', utcDate);
        const rPtol  = ephPtol.bodyGeocentric('moon', utcDate);
        const rApix  = ephApix.bodyGeocentric('moon', utcDate);
        const rVsop  = ephVsop.bodyGeocentric('moon', utcDate);
        info = {
          target, name: 'Moon', category: 'luminary',
          azimuth: c.MoonAnglesGlobe.azimuth,
          elevation: c.MoonAnglesGlobe.elevation,
          helioReading:      { ra: rHelio.ra, dec: rHelio.dec },
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
          const rHelio = ephHelio.bodyGeocentric(target, utcDate);
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
            helioReading:      { ra: rHelio.ra, dec: rHelio.dec },
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
          def   = satelliteById(starId);
          if (entry) cat = 'satellite';
        }
        if (!entry) {
          entry = c.BscStars.find((x) => x.id === starId);
          def   = bscStarById(starId);
          if (entry) cat = 'bsc';
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
            bsc:        0xfff5d8,  // pale ivory
          };
          info = {
            target, name: def.name, category: 'star', subCategory: cat, mag: def.mag,
            gpColor: gpColorByCat[cat] || 0xffffff,
            azimuth: entry.anglesGlobe.azimuth,
            elevation: entry.anglesGlobe.elevation,
            helioReading:      { ra: entry.ra, dec: entry.dec },
            geoReading:        { ra: entry.ra, dec: entry.dec },
            ptolemyReading:    { ra: entry.ra, dec: entry.dec },
            astropixelsReading:{ ra: entry.ra, dec: entry.dec },
            vsop87Reading:     { ra: entry.ra, dec: entry.dec },
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
